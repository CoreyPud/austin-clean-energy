// The Google Solar API call, the tcad_properties / tcad_roof_segments storage format (both
// directions: Google response -> rows, and cached rows -> Google-shaped response), and the DB
// upsert. Shared by fetch-property-solar and unified-assessment so the two can't store or read
// the cache differently.

import { calcEligibleKw } from "./solar-filters.ts";

type SupabaseClientLike = ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.58.0").createClient>;

/** Re-fetch Google data older than this even if we already have it: solar potential doesn't
 *  change often, but roofs get replaced or shaded out and imagery improves. */
export const SOLAR_CACHE_MAX_AGE_DAYS = 365;

export function isSolarCacheFresh(fetchedAt: string | null | undefined): boolean {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() <= SOLAR_CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
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
  return { status: "ok", ...buildSolarRecord(pid, raw) };
}

/** Google buildingInsights response -> tcad_properties row + tcad_roof_segments rows. */
export function buildSolarRecord(
  pid: string,
  raw: any,
): { property: Record<string, unknown>; segments: Record<string, unknown>[] } {
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

  return { property, segments };
}

/** Cached tcad_properties row + its tcad_roof_segments rows -> the subset of a Google
 *  buildingInsights response that callers read, so a cache hit and a live fetch go through the
 *  same downstream code. Returns null when the row has no stored panel layout. Fields Google
 *  provides but we don't store (e.g. carbonOffsetFactorKgPerMwh) come back absent. */
export function solarResponseFromCache(row: any, segRows: any[]): any | null {
  const layout = row?.solar_panels_layout;
  if (!layout?.ref || !Array.isArray(layout.p) || !layout.p.length) return null;
  const [refLat, refLon] = layout.ref;
  const [y, m, d] = typeof row.solar_imagery_date === "string" ? row.solar_imagery_date.split("-").map(Number) : [];
  const roofSegmentStats: any[] = [];
  for (const s of segRows ?? []) {
    roofSegmentStats[s.segment_index] = {
      pitchDegrees: s.pitch_deg ?? undefined,
      azimuthDegrees: s.azimuth_deg ?? undefined,
    };
  }
  for (let i = 0; i < roofSegmentStats.length; i++) roofSegmentStats[i] ??= {};
  return {
    center: { latitude: refLat, longitude: refLon },
    imageryDate: y ? { year: y, month: m, day: d } : undefined,
    imageryQuality: row.solar_imagery_quality ?? undefined,
    solarPotential: {
      maxArrayPanelsCount: row.solar_max_panels ?? layout.p.length,
      maxArrayAreaMeters2: row.solar_max_area_m2 ?? undefined,
      maxSunshineHoursPerYear: row.solar_sunshine_hrs ?? undefined,
      panelCapacityWatts: row.solar_panel_capacity_w ?? undefined,
      roofSegmentStats,
      solarPanels: layout.p.map(([dlat, dlon, o, kwh, seg]: number[]) => ({
        center: { latitude: refLat + dlat / 1e6, longitude: refLon + dlon / 1e6 },
        orientation: o ? "LANDSCAPE" : "PORTRAIT",
        yearlyEnergyDcKwh: kwh,
        segmentIndex: seg,
      })),
    },
  };
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
