import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Classifies council_votes rows that have no climate label yet (is_climate IS
// NULL). The human-reviewed historical backfill is loaded separately with a
// classification_version set, so this only ever touches genuinely new items.
//
// Uses the Lovable AI gateway (LOVABLE_API_KEY auto-injected in the Lovable
// Cloud runtime). Pinned model — do not silently ride the "preview" default.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";
const CLASSIFICATION_VERSION = 1;
const MAX_ROWS_PER_RUN = 300; // stay within edge time limits; cron drains backlog
const BATCH = 30;

// Keep this prompt in sync with data/council/classification_spec.md.
const SYSTEM_PROMPT = `You classify Austin City Council agenda items for a climate-accountability project.

is_climate = true ONLY when the item is a SUBSTANTIVE DECISION that relates —
directly OR indirectly — to climate, clean energy, emissions, sustainability, or
resilience. Indirect counts: transportation mode-shift / transit / bike-ped / VMT,
water conservation and watershed protection, tree canopy / natural systems, waste
/ recycling.

LAND USE is POLICY ONLY: citywide code changes and explicit density /
transit-oriented / sustainability initiatives (e.g. HOME, TOD, density reform) →
category "land_use". But INDIVIDUAL CASE-BY-CASE REZONINGS are routine land
development, NOT climate — item ids like "C14-...", "C814-...", "NPA-..." or a
single named site/parcel rezoning or neighborhood-plan amendment →
is_climate:false, item_kind:"routine", even though they change what a lot can build.

Substantive decisions = policy, resolutions, ordinances, plan adoptions, significant
agreements/PPAs, or direction to staff. Set item_kind accordingly.

A "substantive decision" means policy, a resolution, an ordinance, a plan/target
adoption, direction to staff, a significant land acquisition for conservation, or
a major agreement/PPA. Operational spending and procedure are NOT substantive.

Reject (is_climate:false, item_kind:"routine"):
- Procedural / scheduling items: "set a public hearing", postponements, minor
  code cleanups, board/commission appointments.
- Operational procurement & spending, EVEN when climate-topical: authorizing or
  amending contracts for construction, maintenance, equipment, metering (AMI),
  service agreements, encroachment agreements, water/utility line work,
  solar-incentive issuances, electric-utility supply, base-rate corrections.
  These execute existing policy; they are not policy decisions.
- Vendor-name collisions where the term is only in a company name: "SolarWinds"
  (IT), "Wind Services" (trucks), "Coalition" (matches coal), "Carbon Activated
  Corp" (chemicals), "Climatec" (HVAC).

Keep item_kind "decision" only for substantive one-off decisions (e.g. acquiring
land for open space, adopting a plan, a major power-purchase agreement).

Return ONLY a JSON array, one object per input item, no prose:
[{"item_id": "...", "is_climate": true|false,
  "category": "energy_supply|buildings_efficiency|transportation|land_use|water|natural_systems|waste|climate_planning|environmental_justice|none",
  "item_kind": "policy|resolution|decision|routine|proclamation|executive_session",
  "summary": "one plain-English sentence",
  "confidence": "high|medium|low"}]`;

async function classifyBatch(apiKey: string, items: { item_id: string; item_description: string }[]) {
  const user = "Classify these items:\n" + items
    .map((it) => `- item_id ${it.item_id}: ${it.item_description}`)
    .join("\n");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  let text: string = data?.choices?.[0]?.message?.content ?? "";
  text = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in model output");
  return JSON.parse(text.slice(start, end + 1)) as any[];
}

const CATS = new Set(["energy_supply","buildings_efficiency","transportation","land_use","water","natural_systems","waste","climate_planning","environmental_justice","none"]);
const KINDS = new Set(["policy","resolution","decision","routine","proclamation","executive_session"]);
const CONF = new Set(["high","medium","low"]);

function validate(o: any): o is { item_id: string; is_climate: boolean; category: string; item_kind: string; summary: string; confidence: string } {
  return o && typeof o.item_id === "string" && typeof o.is_climate === "boolean"
    && CATS.has(o.category) && KINDS.has(o.item_kind)
    && typeof o.summary === "string" && CONF.has(o.confidence);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Reuses the shared import secret (same as solar-data-import) — no new secret needed.
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: pending, error } = await supabase
      .from("council_votes")
      .select("item_id,item_description")
      .is("is_climate", null)
      .limit(MAX_ROWS_PER_RUN);
    if (error) throw new Error(`select pending: ${error.message}`);

    let classified = 0, failed = 0;
    for (let i = 0; i < (pending?.length ?? 0); i += BATCH) {
      const batch = pending!.slice(i, i + BATCH);
      let results: any[];
      try {
        results = await classifyBatch(apiKey, batch);
      } catch (e) {
        console.error("batch failed:", String(e));
        failed += batch.length;
        continue; // leave these NULL; a later run retries them
      }
      const byId = new Map(results.filter(validate).map((r) => [r.item_id, r]));
      for (const item of batch) {
        const r = byId.get(item.item_id);
        if (!r) { failed++; continue; }
        const { error: upErr } = await supabase
          .from("council_votes")
          .update({
            is_climate: r.is_climate,
            category: r.category,
            item_kind: r.item_kind,
            summary: r.summary,
            confidence: r.confidence,
            classified_at: new Date().toISOString(),
            classification_version: CLASSIFICATION_VERSION,
          })
          .eq("item_id", item.item_id);
        if (upErr) { failed++; continue; }
        classified++;
      }
    }

    const result = { ok: true, pending: pending?.length ?? 0, classified, failed };
    console.log("classify-new-votes", result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("classify-new-votes error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
