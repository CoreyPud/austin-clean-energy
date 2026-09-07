// Commission meeting-index crawler. Replaces the hand-seeded registry: given a
// board id, it fetches that body's meeting index and returns the agenda + minutes
// documents for each meeting (optionally filtered to a year).
//
// The old .htm index URLs meta-refresh to /boards-commissions/meetings/{id}_1;
// we hit the new path directly. Each meeting block carries a bcic_mtgdate,
// a bcic_mtgtype, and bcic_doc links labeled "Agenda" / "Approved Minutes" / etc.
import type { SourceDoc } from "./schema.js";
import { edimsUrl } from "./extract.js";

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function parseDate(s: string): string | null {
  const m = /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/.exec(s);
  if (!m) return null;
  const mo = MONTHS[m[1]!.toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${mo}-${m[2]!.padStart(2, "0")}`;
}

const indexUrl = (boardId: number, page = 1) =>
  `https://www.austintexas.gov/boards-commissions/meetings/${boardId}_${page}`;

/** Fetch and parse one board's meeting index into agenda/minutes SourceDocs. */
export async function crawlBoard(
  boardId: number,
  body: string,
  opts: { year?: string } = {},
): Promise<SourceDoc[]> {
  const res = await fetch(indexUrl(boardId), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`index ${res.status} for board ${boardId}`);
  const html = await res.text();

  // split into per-meeting blocks on the date marker (class attr may be quoted or not)
  const blocks = html.split(/class=["']?bcic_mtgdate["']?/i).slice(1);
  const docs: SourceDoc[] = [];

  for (const block of blocks) {
    const date = parseDate(block.slice(0, 200));
    if (!date) continue;
    if (opts.year && !date.startsWith(opts.year)) continue;

    // collect id -> best label. Each doc appears as an icon anchor (<img>) and a
    // text anchor whose label may be wrapped in tags, e.g. <a ...><b>Agenda</b></a>.
    const labels = new Map<string, string>();
    for (const m of block.matchAll(/document\.cfm\?id=(\d+)"[^>]*>(.*?)<\/a>/gis)) {
      const id = m[1]!;
      const label = m[2]!.replace(/<[^>]+>/g, "").trim(); // strip inner tags (<b>, <img>)
      if (label && !labels.get(id)) labels.set(id, label);
    }

    for (const [id, label] of labels) {
      let docType: SourceDoc["docType"] | null = null;
      if (/agenda/i.test(label)) docType = "commission_agenda";
      else if (/minutes/i.test(label)) docType = "commission_minutes";
      if (!docType) continue; // skip cancellation notices, backup, video for now
      docs.push({ docId: `edims:${id}`, docType, body, meetingDate: date, edimsId: id, url: edimsUrl(id) });
    }
  }
  return docs;
}
