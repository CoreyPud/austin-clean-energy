// Finds the next council meeting's Draft Agenda, splits it into items, classifies each for
// climate/energy relevance, and writes decisions-poc/data/agenda-vote-upcoming.json in the
// shape import-agenda-items expects -- status='open' council_decisions rows for the public
// voting page. This is the only route to pre-vote content (CIUR/sich-49ay only ever contains
// items already voted on -- confirmed live, see decisions-poc/SUPABASE.md).
//
// Draft Agenda can be revised before the meeting, so unlike every other extractEdimsText
// caller, this deletes that id's cache entry first to force a fresh fetch.
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { findUpcomingMeeting } from "./council-sources.js";
import { extractEdimsText, edimsUrl } from "./extract.js";
import { classifyMeetingItems } from "./classify-council.js";

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = resolve(here, "..", "cache");
const dataDir = resolve(here, "..", "data");

function bustCache(edimsId: string) {
  const p = resolve(cacheDir, `edims_${edimsId}.txt`);
  if (existsSync(p)) unlinkSync(p);
}

// Same item-boundary marker minutes.ts uses, without the disposition classification --
// there's no outcome yet, just posting language.
function splitAgendaItems(text: string): { itemNumber: string; description: string }[] {
  const marker = /(?:^|\n|\.\s)\s*(\d{1,3})\.\s+(?=[A-Z"“])/g;
  const bounds: { num: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text))) bounds.push({ num: m[1]!, start: m.index + m[0].length });

  const items: { itemNumber: string; description: string }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i]!;
    if (seen.has(b.num)) continue;
    const chunk = text.slice(b.start, bounds[i + 1]?.start ?? b.start + 1500).trim();
    if (chunk.length < 15) continue;
    seen.add(b.num);
    items.push({ itemNumber: b.num, description: chunk.replace(/\s+/g, " ").trim() });
  }
  return items;
}

// Individual zoning/site cases (rezonings, neighborhood-plan amendments) always carry a case
// number like "C14-2022-0107" or "NPA-2023-0002.01" in their posting language, and are always
// routine per classify-council.ts's own system prompt ("individual rezoning/zoning/site cases"
// = routine). Confirmed live: the LLM does not reliably apply that rule when a batch contains
// many similar-looking rezoning items (it flagged 10/10 real cases as "major" in one run) --
// this deterministic pre-filter is far more reliable, so these never even reach the classifier.
const ZONING_CASE_RE = /\b(?:C14|C15|C8|SP|PSP|NPA)-\d{4}[.-]\d+/;

async function main() {
  const meeting = await findUpcomingMeeting();
  if (!meeting) {
    console.log("No upcoming meeting with a posted Draft Agenda found in the next few weeks.");
    return;
  }
  console.log(`Upcoming meeting: ${meeting.date} (Draft Agenda edims:${meeting.draftAgendaId})`);

  bustCache(meeting.draftAgendaId);
  const text = await extractEdimsText(meeting.draftAgendaId);
  const allItems = splitAgendaItems(text);
  const rawItems = allItems.filter((it) => !ZONING_CASE_RE.test(it.description));
  console.log(`${allItems.length} items found in Draft Agenda (${allItems.length - rawItems.length} individual zoning/site cases excluded)`);
  if (!rawItems.length) return;

  const cls = await classifyMeetingItems(`Austin City Council, ${meeting.date} (Draft Agenda)`, rawItems);

  const items = rawItems
    .map((it) => ({ it, c: cls.get(it.itemNumber) }))
    // is_climate alone isn't enough -- confirmed live that the model isn't self-consistent
    // between is_climate and significance, so a routine item can still come back is_climate:true.
    .filter(({ c }) => c?.is_climate && c?.significance !== "routine")
    .map(({ it, c }) => {
      const itemNumber = it.itemNumber.padStart(3, "0");
      return {
        id: `${meeting.ymd}-${itemNumber}`,
        meeting_date: meeting.date,
        meeting_year: Number(meeting.date.slice(0, 4)),
        item_number: itemNumber,
        body: "Austin City Council",
        title: c!.summary || it.description.slice(0, 200),
        description: it.description,
        topic: c!.topic,
        significance: c!.significance,
        is_climate: true,
        status: "open",
        source_url: meeting.agendaUrl,
      };
    });
  console.log(`${items.length} classified as climate/energy relevant`);

  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const outPath = resolve(dataDir, "agenda-vote-upcoming.json");
  writeFileSync(outPath, JSON.stringify({ items, meta: { meetingDate: meeting.date, draftAgendaId: meeting.draftAgendaId, agendaBackupId: meeting.agendaBackupId, draftAgendaUrl: edimsUrl(meeting.draftAgendaId) } }, null, 2), "utf8");
  console.log(`wrote ${items.length} items -> ${outPath}`);
  console.log(`Next: POST this file's { items } as the body to import-agenda-items (see decisions-poc/SUPABASE.md).`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
