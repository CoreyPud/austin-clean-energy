// Same field set PropertyViewer.tsx's "Advanced filters" panel uses (kept independent there
// for now rather than migrated, to avoid touching that admin tool's working filter logic) --
// shared here so Explore's filter panel computes the exact same values the same way.

export type NumericFieldKey =
  | "market_value" | "roof_sqft" | "year_built"
  | "solar_kw" | "solar_sunshine_median" | "max_system_kw"
  | "solar_buildable_kw" | "solar_eligible_kw" | "roof_area_sqft";

export interface NumericFilterable {
  market_value: number | null;
  roof_sqft: number | null;
  year_built: number | null;
  /** Installed (existing, real-world) solar, kW -- summed from solar_installations. */
  solar_kw: number | null;
  solar_sunshine_median: number | null;
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_buildable_kw: number | null;
  solar_eligible_kw: number | null;
  solar_max_area_m2: number | null;
}

export const NUMERIC_FIELDS: { key: NumericFieldKey; label: string; getValue: (p: NumericFilterable) => number | null }[] = [
  { key: "market_value", label: "Market value ($)", getValue: (p) => p.market_value },
  { key: "roof_sqft", label: "Roof sqft (TCAD)", getValue: (p) => p.roof_sqft },
  { key: "year_built", label: "Year built", getValue: (p) => p.year_built },
  { key: "solar_kw", label: "Installed solar (kW)", getValue: (p) => p.solar_kw },
  { key: "solar_sunshine_median", label: "Sun score (hrs/yr)", getValue: (p) => p.solar_sunshine_median },
  {
    key: "max_system_kw",
    label: "Max system size (kW)",
    getValue: (p) => (p.solar_max_panels != null && p.solar_panel_capacity_w != null
      ? (p.solar_max_panels * p.solar_panel_capacity_w) / 1000
      : null),
  },
  { key: "solar_buildable_kw", label: "Buildable kW", getValue: (p) => p.solar_buildable_kw },
  { key: "solar_eligible_kw", label: "75% TSRF kW", getValue: (p) => p.solar_eligible_kw },
  {
    key: "roof_area_sqft",
    label: "Usable roof area (sqft)",
    getValue: (p) => (p.solar_max_area_m2 != null ? p.solar_max_area_m2 * 10.764 : null),
  },
];

export type NumericRange = { min: string; max: string };

export const EMPTY_NUMERIC_FILTERS: Record<NumericFieldKey, NumericRange> = NUMERIC_FIELDS.reduce(
  (acc, f) => ({ ...acc, [f.key]: { min: "", max: "" } }),
  {} as Record<NumericFieldKey, NumericRange>,
);

export function matchesNumericFilters<T extends NumericFilterable>(
  p: T,
  filters: Record<NumericFieldKey, NumericRange>,
): boolean {
  for (const f of NUMERIC_FIELDS) {
    const { min, max } = filters[f.key];
    if (min === "" && max === "") continue;
    const v = f.getValue(p);
    if (v == null) return false;
    if (min !== "" && v < Number(min)) return false;
    if (max !== "" && v > Number(max)) return false;
  }
  return true;
}
