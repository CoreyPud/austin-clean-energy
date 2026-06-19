import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 200;

// Austin metro bounding box
const LAT_MIN = 30.0, LAT_MAX = 30.6;
const LON_MIN = -98.2, LON_MAX = -97.4;

function buildUrl(apiKey: string, offset: number) {
  const p = new URLSearchParams({
    api_key:   apiKey,
    fuel_type: "ELEC",
    state:     "TX",
    status:    "E",
    limit:     String(BATCH_SIZE),
    offset:    String(offset),
  });
  return `https://developer.nlr.gov/api/alt-fuel-stations/v1.json?${p}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const apiKey = Deno.env.get("NREL_API_KEY");
    if (!apiKey) throw new Error("NREL_API_KEY secret not set");

    let offset = 0, total = Infinity, fetched = 0, upserted = 0;

    while (offset < total) {
      const res = await fetch(buildUrl(apiKey, offset));
      if (!res.ok) throw new Error(`NREL API ${res.status}: ${await res.text()}`);

      const json = await res.json();
      if (offset === 0) total = json.total_results ?? 0;

      const batch: any[] = (json.fuel_stations ?? []);
      fetched += batch.length;
      offset  += BATCH_SIZE;

      // Filter to Austin metro bounding box
      const austinBatch = batch
        .filter(s =>
          s.latitude  >= LAT_MIN && s.latitude  <= LAT_MAX &&
          s.longitude >= LON_MIN && s.longitude <= LON_MAX
        )
        .map(s => ({
          id:                 s.id,
          station_name:       s.station_name,
          latitude:           s.latitude,
          longitude:          s.longitude,
          ev_network:         s.ev_network         ?? null,
          ev_level1_evse_num: s.ev_level1_evse_num ?? 0,
          ev_level2_evse_num: s.ev_level2_evse_num ?? 0,
          ev_dc_fast_num:     s.ev_dc_fast_num     ?? 0,
          open_date:          s.open_date           ?? null,
          access_code:        s.access_code         ?? null,
          street_address:     s.street_address      ?? null,
          city:               s.city                ?? null,
          state:              s.state               ?? null,
          zip:                s.zip                 ?? null,
          status_code:        s.status_code         ?? "E",
          synced_at:          new Date().toISOString(),
        }));

      if (austinBatch.length > 0) {
        const { error } = await supabase
          .from("ev_charging_stations")
          .upsert(austinBatch, { onConflict: "id" });
        if (error) throw error;
        upserted += austinBatch.length;
      }

      if (batch.length < BATCH_SIZE) break;
    }

    console.log(`Fetched ${fetched} TX stations, upserted ${upserted} Austin stations`);
    return new Response(
      JSON.stringify({ ok: true, fetched, upserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-ev-stations error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
