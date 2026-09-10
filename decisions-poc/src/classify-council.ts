// Batched climate/energy classifier — one LLM call per meeting (not per item), so a
// ~70-item meeting costs a single request. Returns climate relevance + topic + a
// plain-language summary for each item; the LLM is the categorizer (per project pref).
import { llmJson } from "./llm.js";

export interface ItemClass {
  item_number: string;
  is_climate: boolean;
  topic: string; // generation | storage | renewable | efficiency | transport | emissions | land_use | water | climate_policy | other
  significance: "major" | "notable" | "routine";
  summary: string; // <= 22 words
}

const SYSTEM = [
  "You label Austin City Council agenda items for a climate/energy decisions tracker.",
  "For EVERY item given, return JSON {\"items\":[{item_number, is_climate(bool), topic, significance, summary}]}.",
  "is_climate = true if the item substantively concerns energy, electricity/utility, climate, emissions,",
  "transportation electrification, water, land use with climate bearing, or sustainability; else false.",
  "topic is one word-ish: generation|storage|renewable|efficiency|transport|emissions|land_use|water|climate_policy|other.",
  "significance distinguishes actual policy DECISIONS from routine operational business.",
  "CRITICAL: the department does NOT determine significance. A contract for Austin Energy or Austin Water is NOT",
  "significant just because it is energy/water-related. Judge the NATURE of the action, and ignore dollar size.",
  "'routine' (most items) = operational business: any contract/amendment/renewal for maintenance, repair, equipment,",
  "parts, pumps, supplies, chemicals, monitoring, software, IT, professional/engineering/construction services,",
  "insurance, easements, service extensions, revenue-bond issuance for ongoing capital programs, and individual",
  "rezoning/zoning/site cases. Examples that are ROUTINE: 'replace condenser water pumps', 'SCADA maintenance',",
  "'meter testing', 'odor control facility construction', 'engineering services amendment'.",
  "'major' = a genuine policy decision: adopt/amend a plan, ordinance, or City Code; set rates; grant a franchise;",
  "or newly commit to acquire/build ENERGY RESOURCES (power purchase agreements, battery/storage agreements, new",
  "generation). Examples that are MAJOR: 'battery storage agreement for 100 MW', 'power purchase agreements for wind',",
  "'adopt Rain to River Strategic Plan', 'implement natural gas peaker generation'.",
  "'notable' = rare in-between only. When unsure, choose routine.",
  "summary: <=22 words, plain language, what the item does. Keep every item; do not drop any.",
].join(" ");

export async function classifyMeetingItems(
  meetingLabel: string,
  items: { itemNumber: string; description: string }[],
): Promise<Map<string, ItemClass>> {
  const list = items.map((i) => `${i.itemNumber}. ${i.description.slice(0, 200)}`).join("\n");
  const out = await llmJson<{ items: ItemClass[] }>(
    SYSTEM,
    `Meeting: ${meetingLabel}\n\nItems:\n${list}`,
  );
  const map = new Map<string, ItemClass>();
  for (const c of out.items ?? []) map.set(String(c.item_number), c);
  return map;
}
