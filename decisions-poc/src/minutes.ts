// Council minutes parser — the master outcome source.
// Extracts EVERY agenda item's disposition from the minutes PDF (consent, contested,
// withdrawn, postponed, and executive-session items), with the verbatim disposition
// snippet kept for provenance. Deterministic (regex); no LLM.
export interface MinuteItem {
  itemNumber: string;
  description: string; // posting language as recorded
  outcome: string; // approved | approved_on_consent | postponed | withdrawn | conducted_and_approved | conducted | failed | no_action
  tally: string | null; // "8-0"
  dissenters: string[];
  statutes: string[]; // 551.0xx if an executive-session item
  isExec: boolean;
  dispositionQuote: string; // verbatim sentence the outcome was read from
}

// unpdf returns one newline-free string, so bound the page-header match to the date
// (matching to end-of-line would eat the whole document).
const PAGE_HEADER = /\d*\s*REGULAR COUNCIL MINUTES\s+\w+DAY,\s*\w+\s+\d{1,2},\s*\d{4}/gi;

function classify(chunk: string): { outcome: string; quote: string } {
  const sentences = chunk.split(/(?<=\.)\s+/);
  const find = (re: RegExp) => sentences.find((s) => re.test(s)) ?? "";
  if (/approved on consent/i.test(chunk))
    return { outcome: "approved_on_consent", quote: find(/approved on consent/i) };
  if (/conducted and approved/i.test(chunk))
    return { outcome: "conducted_and_approved", quote: find(/conducted and approved/i) };
  if (/postponed indefinitely/i.test(chunk))
    return { outcome: "postponed", quote: find(/postponed indefinitely/i) };
  if (/\bpostponed\b/i.test(chunk)) return { outcome: "postponed", quote: find(/postponed/i) };
  if (/\bwithdrawn\b/i.test(chunk)) return { outcome: "withdrawn", quote: find(/withdrawn/i) };
  if (/\bfailed\b/i.test(chunk)) return { outcome: "failed", quote: find(/failed/i) };
  if (/was approved|motion to approve|ordinance was approved|resolution was approved/i.test(chunk))
    return { outcome: "approved", quote: find(/approved/i) };
  if (/\bconducted\b/i.test(chunk)) return { outcome: "conducted", quote: find(/conducted/i) };
  if (/no action/i.test(chunk)) return { outcome: "no_action", quote: find(/no action/i) };
  return { outcome: "unknown", quote: "" };
}

export function parseMinutes(rawText: string): MinuteItem[] {
  const text = rawText.replace(PAGE_HEADER, " ").replace(/[ \t]+/g, " ");
  // item markers: a number+dot at a line/sentence start, followed by a capital or quote
  const marker = /(?:^|\n|\.\s)\s*(\d{1,3})\.\s+(?=[A-Z"“])/g;
  const bounds: { num: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text))) bounds.push({ num: m[1]!, start: m.index + m[0].length });

  const items: MinuteItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < bounds.length; i++) {
    const b = bounds[i]!;
    if (seen.has(b.num)) continue; // first occurrence of an item number wins
    const chunk = text.slice(b.start, bounds[i + 1]?.start ?? b.start + 1200).trim();
    if (chunk.length < 15) continue;
    const { outcome, quote } = classify(chunk);
    if (outcome === "unknown") continue; // not a real disposition-bearing item
    seen.add(b.num);
    const statutes = [...new Set([...chunk.matchAll(/551\.0\d\d/g)].map((x) => x[0]))];
    const tallyM = /(\d{1,2})-(\d{1,2})\s+vote/i.exec(chunk);
    const againstM = /with (.*?) voting against/i.exec(chunk);
    const dissenters = againstM
      ? againstM[1]!
          .replace(/\b(Vice Chair|Chair|Council Members?|Mayor Pro Tem|Mayor)\b/g, " ")
          .split(/\s*(?:,|and)\s*/i)
          .map((s) => s.trim())
          .filter((s) => /^[A-Z][A-Za-z'\-]+$/.test(s))
      : [];
    // description = text before the disposition sentence
    const descEnd = quote ? chunk.indexOf(quote) : Math.min(chunk.length, 240);
    // full posting language, never truncated at the data layer (display can clamp in CSS)
    const description = chunk.slice(0, descEnd > 20 ? descEnd : 240).replace(/\s+/g, " ").trim();
    items.push({
      itemNumber: b.num,
      description,

      outcome,
      tally: tallyM ? `${tallyM[1]}-${tallyM[2]}` : null,
      dissenters,
      statutes,
      isExec: statutes.length > 0,
      dispositionQuote: quote.replace(/\s+/g, " ").trim(),
    });
  }
  return items;
}
