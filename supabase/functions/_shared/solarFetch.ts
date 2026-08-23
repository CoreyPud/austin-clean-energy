// The Google Solar API call, response shape, and DB upsert used by ensure-property-solar (the
// only caller). Split out from the endpoint handler for readability, not reuse.

type SupabaseClientLike = ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.58.0").createClient>;

const AUSTIN_REF_HRS = 1950;
const TSRF_MIN = 0.75;

function calcEligibleKw(sp: any): number | null {
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

export interface FetchSolarResult {
  status: "ok" | "not-found" | "error";
  property?: Record<string, unknown>;
  segments?: Record<string, unknown>[];
  errorMessage?: string;
}

export async function fetchAndBuildSolarRecord(
  apiKey: string,
  pid: string,
  lat: number,
  lon: number,
): Promise<FetchSolarResult> {
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${apiKey}`;
  const solarRes = await fetch(url);

  if (solarRes.status === 404) {
    return { status: "not-found", property: { pid, solar_fetched_at: new Date().toISOString() } };
  }
  if (!solarRes.ok) {
    const text = await solarRes.text();
    return { status: "error", errorMessage: `Solar API ${solarRes.status}: ${text}` };
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

  return { status: "ok", property, segments };
}

export async function persistSolarResult(
  supabase: SupabaseClientLike,
  result: FetchSolarResult,
): Promise<{ error: string | null }> {
  if (!result.property) return { error: result.errorMessage ?? "No property record to persist" };

  const { error: propErr } = await supabase
    .from("tcad_properties")
    .upsert(result.property, { onConflict: "pid" });
  if (propErr) return { error: `properties: ${propErr.message}` };

  if (result.segments?.length) {
    const { error: segErr } = await supabase
      .from("tcad_roof_segments")
      .upsert(result.segments, { onConflict: "pid,segment_index" });
    if (segErr) return { error: `segments: ${segErr.message}` };
  }

  return { error: null };
}
