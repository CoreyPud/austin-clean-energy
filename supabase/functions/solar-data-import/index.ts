import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  // Auth
  const secret = Deno.env.get("SOLAR_IMPORT_SECRET");
  const auth   = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return json(401, { error: "Unauthorized" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { properties?: Record<string, unknown>[]; segments?: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { properties = [], segments = [] } = body;
  const results: Record<string, unknown> = {};

  // Only these solar columns may be written — all others are stripped
  const ALLOWED_PROPERTY_COLS = new Set([
    "pid",
    "solar_fetched_at",
    "solar_imagery_quality",
    "solar_imagery_date",
    "solar_max_panels",
    "solar_max_area_m2",
    "solar_sunshine_hrs",
    "solar_sunshine_median",
    "solar_panel_capacity_w",
    "solar_eligible_kw",
  ]);

  // Upsert properties — strip any columns not in the solar allowlist
  if (properties.length > 0) {
    const sanitized = properties.map(row =>
      Object.fromEntries(
        Object.entries(row).filter(([k]) => ALLOWED_PROPERTY_COLS.has(k))
      )
    ).filter(row => row.pid); // require pid
    if (sanitized.length === 0) return json(400, { error: "No valid property rows after sanitization" });
    const { error, count } = await supabase
      .from("tcad_properties")
      .upsert(sanitized, { onConflict: "pid", count: "exact" });
    if (error) return json(500, { error: `properties: ${error.message}` });
    results.properties_upserted = count;
  }

  // Upsert segments — only columns present in each object are touched
  if (segments.length > 0) {
    const { error, count } = await supabase
      .from("tcad_roof_segments")
      .upsert(segments, { onConflict: "pid,segment_index", count: "exact" });
    if (error) return json(500, { error: `segments: ${error.message}` });
    results.segments_upserted = count;
  }

  return json(200, { ok: true, ...results });
});
