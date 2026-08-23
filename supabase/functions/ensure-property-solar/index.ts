import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { fetchAndBuildSolarRecord, persistSolarResult } from "../_shared/solarFetch.ts";

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

// Public counterpart to fetch-property-solar's admin tool: called from PropertyPage/the
// preview card whenever a visitor lands on a parcel we've never pulled Google Solar data for,
// same as the calculator already does on demand for arbitrary addresses -- except this
// persists the result since it's a known TCAD pid, so the next visitor gets it for free.
//
// No admin token, so the only cost guard is server-side: coordinates are looked up from the
// pid (never trusted from the client) and solar_fetched_at is checked before spending an API
// call. A pid fetched twice concurrently before the first upsert lands can still double-call
// the API; that's an accepted, self-limiting race, not worth a locking scheme for this traffic.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  try {
    let body: { pid?: string };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { pid } = body;
    if (!pid) return json(400, { error: "Missing pid" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing, error: lookupErr } = await supabase
      .from("tcad_properties")
      .select("pid, centroid_lat, centroid_lon, solar_fetched_at")
      .eq("pid", pid)
      .maybeSingle();

    if (lookupErr) return json(500, { error: lookupErr.message });
    if (!existing) return json(404, { error: "Property not found" });

    if (existing.solar_fetched_at) {
      return json(200, { ok: true, alreadyFetched: true, property: existing });
    }
    if (existing.centroid_lat == null || existing.centroid_lon == null) {
      return json(400, { error: "Property has no location" });
    }

    const apiKey = Deno.env.get("GOOGLE_SOLAR_API_KEY");
    if (!apiKey) return json(500, { error: "GOOGLE_SOLAR_API_KEY not configured" });

    const result = await fetchAndBuildSolarRecord(apiKey, pid, existing.centroid_lat, existing.centroid_lon);
    if (result.status === "error") return json(500, { error: result.errorMessage });

    const { error } = await persistSolarResult(supabase, result);
    if (error) return json(500, { error });

    return json(200, { ok: true, property: result.property });
  } catch (e) {
    console.error("ensure-property-solar error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
