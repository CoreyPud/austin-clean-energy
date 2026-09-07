// LLM step — segment a document into climate/energy DECISION items and structure them.
// The LLM does the hard language work (which items are substantive climate/energy
// decisions, topic, plain-language summary, and pulling fields from prose). Its
// structural claims are audited afterward in validate.ts against regex ground truth.
import { llmJson } from "./llm.js";
import type { Significance } from "./schema.js";

export interface LlmDecisionItem {
  item_no: string | null;
  title: string;
  decision_type: string; // Contract | Resolution | Ordinance | Recommendation | Discussion | Plan
  topic: string; // generation | storage | renewable | efficiency | transport | emissions | climate_policy | other
  is_climate: boolean;
  significance: Significance;
  dollar_amount: number | null;
  vote_tally: string | null; // "8-3" if stated
  dissenters: string[];
  result: string; // approved | recommended | failed | postponed | pending
  summary: string; // <= 25 words, plain language
  cross_refs: string[]; // referenced prior actions if any
}

const SYSTEM = [
  "You extract Austin climate/energy DECISIONS from a public meeting document.",
  "Return JSON {\"items\":[...]}. Include ONLY substantive climate or energy decisions or recommendations:",
  "generation, storage, renewables, energy efficiency, transportation electrification, emissions, or climate policy.",
  "EXCLUDE routine business (IT/software, maintenance, supplies, real estate, HR, legal services) unless it is",
  "directly climate/energy-substantive. Do not invent values: if a dollar amount or vote tally is not stated, use null.",
  "Each item: {item_no, title, decision_type, topic, is_climate, significance(high|medium|low),",
  "dollar_amount(number|null), vote_tally(string|null e.g. \"8-3\"), dissenters(string[] surnames),",
  "result, summary(<=25 words), cross_refs(string[])}.",
].join(" ");

export async function extractDecisionItems(
  docLabel: string,
  text: string,
): Promise<LlmDecisionItem[]> {
  // keep the prompt bounded; agendas/minutes fit well under this
  const body = text.slice(0, 16000);
  const out = await llmJson<{ items: LlmDecisionItem[] }>(
    SYSTEM,
    `Document: ${docLabel}\n\n${body}`,
  );
  return out.items ?? [];
}
