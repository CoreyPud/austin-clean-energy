// A subset of the fields PropertyViewer.tsx's "Advanced filters" panel uses (kept independent
// there for now rather than migrated, to avoid touching that admin tool's working filter logic).
// Deliberately just the fields the properties-bulk edge function returns for every property, so
// Explore's filters work identically everywhere on the map with no per-viewport fetch needed --
// solar sizing fields (buildable kW, 75% TSRF, usable roof area, sun score, max system size)
// aren't in that payload and were dropped from here rather than adding a separate fetch path.

export type NumericFieldKey = "market_value" | "roof_sqft" | "year_built" | "solar_kw";

export interface NumericFilterable {
  market_value: number | null;
  roof_sqft: number | null;
  year_built: number | null;
  /** Installed (existing, real-world) solar, kW -- summed from solar_installations. */
  solar_kw: number | null;
}

export const NUMERIC_FIELDS: {
  key: NumericFieldKey;
  label: string;
  getValue: (p: NumericFilterable) => number | null;
  /** Slider step -- a sensible increment for this field's actual scale, not a generic 1. */
  step: number;
  /** Formats a slider value for display next to the handles (e.g. "$150,000", "5.2 kW"). */
  format: (v: number) => string;
}[] = [
  {
    key: "market_value", label: "Market value", step: 1000,
    getValue: (p) => p.market_value,
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  {
    key: "roof_sqft", label: "Roof sqft (TCAD)", step: 50,
    getValue: (p) => p.roof_sqft,
    format: (v) => `${Math.round(v).toLocaleString()} sqft`,
  },
  {
    key: "year_built", label: "Year built", step: 1,
    getValue: (p) => p.year_built,
    format: (v) => `${Math.round(v)}`,
  },
  {
    key: "solar_kw", label: "Installed solar", step: 0.5,
    getValue: (p) => p.solar_kw,
    format: (v) => `${v.toFixed(1)} kW`,
  },
];

// Percentile breakpoints a color-gradient mode (Explore.tsx's colorMode) interpolates between --
// 5th through 95th in 10-point steps, so a Mapbox `interpolate` expression built from these
// stops spreads colors by percentile RANK rather than raw value, which matters for a skewed
// field like market_value (linear-by-value would cram most properties into one end of the
// ramp). Values outside [p5, p95] clamp to the end colors, same as the request's "gradient from
// lowest 5%ile to highest 5 percentile."
export const GRADIENT_PERCENTILES = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];

/** A field's actual [min, max] across the loaded dataset -- a slider's full extent, and (when
 *  the current selection equals it exactly) the "no filter applied" state. */
export type NumericBounds = {
  min: number;
  max: number;
  /** Values at GRADIENT_PERCENTILES, from the same sorted pass used for min/max above --
   *  practically free to compute alongside it (just extra array indexing, not another sort). */
  gradientStops: number[];
};

/** Current slider selection for one field. Equal to that field's NumericBounds means "no
 *  filter" -- there's no separate on/off flag, Explore.tsx's pointFilter just compares the two
 *  directly (see its own comment for why). */
export type NumericRange = { min: number; max: number };

// Fields whose true max is dominated by a handful of extreme outliers (a huge commercial
// parcel's market value, roof sqft, or installed solar capacity) -- left uncapped, the useful
// residential range gets squeezed into a few slider pixels. Capped at the 90th percentile
// instead of the true max; a slider left at its full extent still means "no filter" (see
// NumericRange's comment), so outlier properties stay visible by default -- this only limits
// how far the slider itself can be *dragged*, not what's shown before you touch it.
const PERCENTILE_CAPPED_FIELDS: NumericFieldKey[] = ["market_value", "roof_sqft", "solar_kw"];
const MAX_PERCENTILE = 0.9;

/** One pass over every loaded record to collect each numeric field's non-null values, then
 *  derive bounds from them: true min/max for most fields, a 90th-percentile-capped max for
 *  PERCENTILE_CAPPED_FIELDS, and year_built's min floored at 1900 (0 in the source data is a
 *  bad-data placeholder, not a real construction year, so it's not a legitimate low outlier to
 *  percentile-trim away -- a hard floor is the correct fix, not the same trimming logic used
 *  for the capped fields' max). A field with zero non-null values anywhere (shouldn't happen
 *  for these four in practice, but a real dataset can surprise you) falls back to [0, 0]. */
export function computeNumericBounds(records: Iterable<NumericFilterable>): Record<NumericFieldKey, NumericBounds> {
  const values = NUMERIC_FIELDS.reduce(
    (acc, f) => ({ ...acc, [f.key]: [] as number[] }),
    {} as Record<NumericFieldKey, number[]>,
  );
  for (const rec of records) {
    for (const f of NUMERIC_FIELDS) {
      const v = f.getValue(rec);
      if (v != null) values[f.key].push(v);
    }
  }

  const bounds = {} as Record<NumericFieldKey, NumericBounds>;
  for (const f of NUMERIC_FIELDS) {
    const arr = values[f.key];
    if (arr.length === 0) {
      bounds[f.key] = { min: 0, max: 0, gradientStops: GRADIENT_PERCENTILES.map(() => 0) };
      continue;
    }
    arr.sort((a, b) => a - b);
    const max = PERCENTILE_CAPPED_FIELDS.includes(f.key)
      ? arr[Math.min(arr.length - 1, Math.floor(arr.length * MAX_PERCENTILE))]
      : arr[arr.length - 1];
    const gradientStops = GRADIENT_PERCENTILES.map(
      (p) => arr[Math.min(arr.length - 1, Math.floor((arr.length - 1) * (p / 100)))],
    );
    bounds[f.key] = { min: arr[0], max, gradientStops };
  }
  bounds.year_built.min = Math.max(bounds.year_built.min, 1900);
  return bounds;
}

/** Mapbox's `interpolate` expression requires strictly increasing input stops -- real
 *  percentile breakpoints can tie (e.g. year_built has only ~126 distinct values spread across
 *  247k properties, so adjacent percentiles landing on the same year is common). Nudges any
 *  non-increasing stop up by epsilon rather than dropping it, so a gradient expression always
 *  gets exactly GRADIENT_PERCENTILES.length stops to pair with its colors. */
export function toStrictlyIncreasing(stops: number[], epsilon: number): number[] {
  const result = [...stops];
  for (let i = 1; i < result.length; i++) {
    if (result[i] <= result[i - 1]) result[i] = result[i - 1] + epsilon;
  }
  return result;
}
