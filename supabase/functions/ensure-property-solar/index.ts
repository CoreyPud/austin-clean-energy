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

// Re-fetch data older than this even if we already have it -- solar potential doesn't change
// often, but roofs get replaced/shaded out and imagery improves, so treat it as stale
// eventually rather than frozen forever.
const MAX_AGE_DAYS = 365;
// Global cost guard, independent of the per-pid staleness check above: caps how many *new*
// Google Solar API calls this endpoint will make across all properties combined per hour,
// so a traffic spike (or a scraper working through never-seen pids) can't run up an unbounded
// bill. Counts off solar_fetched_at itself -- no separate rate-limit table needed. A request
// that gets rate-limited just no-ops (leaves the row as-is) so the next visit retries.
const MAX_FETCHES_PER_HOUR = 100;

// Public, single endpoint for pulling Google Solar data for a known TCAD pid -- called by
// PropertyPage/the preview card whenever a visitor lands on a parcel with missing or stale
// solar data, same on-demand fetch the calculator already does for arbitrary addresses, except
// this persists to tcad_properties/tcad_roof_segments since it's a known pid, so later
// visitors benefit without repeating the API call. No admin path: a coordinate is always
// looked up server-side from the pid, never trusted from the client, and the age + rate-limit
// checks below are the only guards -- there's nothing here for an admin token to bypass.
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

    const ageMs = existing.solar_fetched_at ? Date.now() - new Date(existing.solar_fetched_at).getTime() : Infinity;
    const isStale = ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (existing.solar_fetched_at && !isStale) {
      return json(200, { ok: true, alreadyFetched: true, property: existing });
    }
    if (existing.centroid_lat == null || existing.centroid_lon == null) {
      return json(400, { error: "Property has no location" });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentFetchCount, error: rateErr } = await supabase
      .from("tcad_properties")
      .select("pid", { count: "exact", head: true })
      .gt("solar_fetched_at", oneHourAgo);
    if (rateErr) return json(500, { error: rateErr.message });
    if ((recentFetchCount ?? 0) >= MAX_FETCHES_PER_HOUR) {
      return json(200, { ok: true, rateLimited: true, property: existing });
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
