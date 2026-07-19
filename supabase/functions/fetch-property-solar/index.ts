import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const AUSTIN_REF_HRS = 1950;
const TSRF_MIN = 0.75;

function calcEligibleKw(sp: any) {
  const configs = sp.solarPanelConfigs;
  if (!configs?.length) return null;
  const panelKw = (sp.panelCapacityWatts ?? 400) / 1000;
  const threshold = panelKw * AUSTIN_REF_HRS * TSRF_MIN;
  let best: any = null;
  for (const cfg of configs) {
    if (cfg.yearlyEnergyDcKwh / cfg.panelsCount >= threshold) best = cfg;
  }
  return best ? +(best.panelsCount * panelKw).toFixed(2) : 0;
}

async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "validate", token }),
    });
    const result = await res.json();
    return result.valid === true;
  } catch (e) {
    console.error("Token validation error:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST only" });

  try {
    const token = req.headers.get("x-admin-token");
    const valid = await validateAdminToken(token);
    if (!valid) return json(401, { error: "Unauthorized" });

    let body: { pid?: string; lat?: number; lon?: number };
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { pid, lat, lon } = body;
    if (!pid || typeof lat !== "number" || typeof lon !== "number") {
      return json(400, { error: "Missing pid, lat, or lon" });
    }

    const apiKey = Deno.env.get("GOOGLE_SOLAR_API_KEY");
    if (!apiKey) return json(500, { error: "GOOGLE_SOLAR_API_KEY not configured" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`;
    const solarRes = await fetch(url);

    if (solarRes.status === 404) {
      const property = { pid, solar_fetched_at: new Date().toISOString() };
      const { error } = await supabase
        .from("tcad_properties")
        .upsert(property, { onConflict: "pid" });
      if (error) return json(500, { error: `DB: ${error.message}` });
      return json(200, { ok: true, property });
    }

    if (!solarRes.ok) {
      const text = await solarRes.text();
      return json(500, { error: `Solar API ${solarRes.status}: ${text}` });
    }

    const raw = await solarRes.json();
    const sp = raw.solarPotential ?? {};
    const id = raw.imageryDate;
    const imageryDate = id?.year
      ? `${id.year}-${String(id.month).padStart(2, "0")}-${String(id.day).padStart(2, "0")}`
      : null;
    const refLat = raw.center?.latitude ?? null;
    const refLon = raw.center?.longitude ?? null;
    const solarPanels =
      refLat != null && (sp.solarPanels ?? []).length
        ? {
            ref: [refLat, refLon],
            p: sp.solarPanels.map((p: any) => [
              +((p.center.latitude - refLat) * 1e6).toFixed(6),
              +((p.center.longitude - refLon) * 1e6).toFixed(6),
              p.orientation === "LANDSCAPE" ? 1 : 0,
              +p.yearlyEnergyDcKwh.toFixed(1),
              p.segmentIndex,
            ]),
          }
        : null;

    const property = {
      pid,
      solar_fetched_at: new Date().toISOString(),
      solar_imagery_quality: raw.imageryQuality ?? null,
      solar_imagery_date: imageryDate,
      solar_max_panels: sp.maxArrayPanelsCount ?? null,
      solar_max_area_m2: sp.maxArrayAreaMeters2 ?? null,
      solar_sunshine_hrs: sp.maxSunshineHoursPerYear ?? null,
      solar_sunshine_median: sp.wholeRoofStats?.sunshineQuantiles?.[5] ?? null,
      solar_panel_capacity_w: sp.panelCapacityWatts ?? null,
      solar_eligible_kw: calcEligibleKw(sp),
      solar_panels_layout: solarPanels,
    };

    const panelKw = (sp.panelCapacityWatts ?? 400) / 1000;
    const maxConfig = (sp.solarPanelConfigs ?? []).at(-1);
    const segSummaryMap = new Map(
      (maxConfig?.roofSegmentSummaries ?? []).map((s: any) => [s.segmentIndex, s]),
    );
    const segments = (sp.roofSegmentStats ?? []).map((seg: any, i: number) => {
      const summary: any = segSummaryMap.get(i);
      return {
        pid,
        segment_index: i,
        pitch_deg: seg.pitchDegrees ?? null,
        azimuth_deg: seg.azimuthDegrees ?? null,
        area_m2: seg.stats?.areaMeters2 ?? null,
        ground_area_m2: seg.stats?.groundAreaMeters2 ?? null,
        sunshine_median: seg.stats?.sunshineQuantiles?.[5] ?? null,
        sunshine_max: seg.stats?.sunshineQuantiles?.[10] ?? null,
        sunshine_quantiles: seg.stats?.sunshineQuantiles ?? null,
        center_lat: seg.center?.latitude ?? null,
        center_lon: seg.center?.longitude ?? null,
        max_panels: summary?.panelsCount ?? null,
        max_kw: summary ? +(summary.panelsCount * panelKw).toFixed(2) : null,
        yearly_energy_kwh: summary ? +summary.yearlyEnergyDcKwh.toFixed(1) : null,
      };
    });

    const { error: propErr } = await supabase
      .from("tcad_properties")
      .upsert(property, { onConflict: "pid" });
    if (propErr) return json(500, { error: `properties: ${propErr.message}` });

    if (segments.length > 0) {
      const { error: segErr } = await supabase
        .from("tcad_roof_segments")
        .upsert(segments, { onConflict: "pid,segment_index" });
      if (segErr) return json(500, { error: `segments: ${segErr.message}` });
    }

    return json(200, { ok: true, property });
  } catch (e) {
    console.error("fetch-property-solar error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
