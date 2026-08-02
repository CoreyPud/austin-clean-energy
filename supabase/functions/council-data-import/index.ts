import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

// Secret-guarded write endpoint for loading the human-reviewed historical
// classification backfill (produced/refined locally) into council_votes.
// Mirrors solar-data-import. Only classification columns are written; the vote
// tallies/descriptions come from sync-council-data.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATS = new Set(["energy_supply","buildings_efficiency","transportation","land_use","water","natural_systems","waste","climate_planning","environmental_justice","none"]);
const KINDS = new Set(["policy","resolution","decision","routine","proclamation","executive_session"]);
const CONF = new Set(["high","medium","low"]);

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });

  // Reuses the existing shared import secret (same one solar-data-import uses),
  // so no new secret needs provisioning.
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return json(401, { ok: false, error: "Unauthorized" });

  let body: { votes?: any[]; version?: number };
  try { body = await req.json(); } catch { return json(400, { ok: false, error: "Invalid JSON" }); }

  const version = Number(body.version ?? 1);
  const rows = (body.votes ?? []).filter(
    (r) => r && typeof r.item_id === "string"
      && typeof r.is_climate === "boolean"
      && CATS.has(r.category) && KINDS.has(r.item_kind) && CONF.has(r.confidence),
  );
  if (!rows.length) return json(400, { ok: false, error: "No valid classification rows" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Update classification columns only, matched on existing item_id.
  let updated = 0, missing = 0;
  for (const r of rows) {
    const { error, count } = await supabase
      .from("council_votes")
      .update({
        is_climate: r.is_climate,
        category: r.category,
        item_kind: r.item_kind,
        summary: r.summary ?? null,
        confidence: r.confidence,
        classified_at: new Date().toISOString(),
        classification_version: version,
      }, { count: "exact" })
      .eq("item_id", r.item_id);
    if (error) return json(500, { ok: false, error: `${r.item_id}: ${error.message}` });
    if (count && count > 0) updated++; else missing++;
  }

  return json(200, { ok: true, updated, missing, version });
});
