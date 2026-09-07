// Deterministic fact harvesting — pure regex, no LLM.
//
// These facts are extracted straight from source text and treated as GROUND TRUTH.
// The validate step checks the LLM's structural claims (dollar amounts, vote tallies,
// dissenters) against this pool; anything the LLM asserts that isn't here gets flagged.
import type { HarvestedFacts } from "./schema.js";

const TITLES = /\b(Vice Chair|Chair|Commissioners?|Council Member|Mayor Pro Tem|Mayor)\b/g;

/** Parse "$165,000,000" / "$4.8 million" style amounts into numbers. */
export function harvestDollars(text: string): number[] {
  const out = new Set<number>();
  // explicit numeric: $1,234,567(.89)
  for (const m of text.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)) {
    const n = Number(m[1]!.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  // "$4.8 million" / "$1 billion"
  for (const m of text.matchAll(/\$\s?(\d+(?:\.\d+)?)\s*(million|billion)/gi)) {
    const base = Number(m[1]);
    const mult = /billion/i.test(m[2]!) ? 1e9 : 1e6;
    if (Number.isFinite(base)) out.add(Math.round(base * mult));
  }
  return [...out];
}

/** Extract vote tallies and (where present) who voted against, from the surrounding clause. */
export function harvestTallies(
  text: string,
): { tally: string; against: string[]; context: string }[] {
  const results: { tally: string; against: string[]; context: string }[] = [];
  for (const m of text.matchAll(/\b(\d{1,2})-(\d{1,2})\s+vote\b([^.]*)/gi)) {
    const tally = `${m[1]}-${m[2]}`;
    const tail = m[3] ?? "";
    const context = text.slice(Math.max(0, m.index! - 90), m.index! + 120).replace(/\s+/g, " ").trim();
    let against: string[] = [];
    const againstClause = /with (.*?) voting against/i.exec(tail) ?? /with (.*?) voting against/i.exec(context);
    if (againstClause) against = parseNames(againstClause[1]!);
    results.push({ tally, against, context });
  }
  return results;
}

/** Turn "Vice Chair Braden and Commissioners Reed and White" into ["Braden","Reed","White"]. */
export function parseNames(clause: string): string[] {
  const stripped = clause.replace(TITLES, " ").replace(/\s+/g, " ");
  return stripped
    .split(/\s*(?:,|and)\s*/i)
    .map((s) => s.trim())
    .filter((s) => /^[A-Z][A-Za-z'\-]+$/.test(s)); // single surname tokens
}

/** Cross-references to other Austin actions: YYYYMMDD or YYYYMMDD-NNN. */
export function harvestCrossRefs(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(20\d{6})(?:-(\d{2,3}))?\b/g)) {
    out.add(m[2] ? `${m[1]}-${m[2]}` : m[1]!);
  }
  return [...out];
}

export function harvestFacts(text: string): HarvestedFacts {
  return {
    dollarAmounts: harvestDollars(text),
    tallies: harvestTallies(text),
    crossRefs: harvestCrossRefs(text),
  };
}
