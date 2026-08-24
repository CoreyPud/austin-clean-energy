import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MapTokenLoader from "@/components/MapTokenLoader";
import PropertyMapView from "@/components/Map";
import PropertyPreviewCard from "@/components/explore/PropertyPreviewCard";
import ExploreFilterPanel from "@/components/explore/ExploreFilterPanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Expression } from "mapbox-gl";
import { classifyProperty, TYPE_LABEL, TYPE_COLOR, GRADIENT_COLORS } from "@/lib/property-solar";
import { loadBulkPropertiesCached, decodeTypeCode } from "@/lib/properties-bulk";
import {
  NUMERIC_FIELDS,
  GRADIENT_PERCENTILES,
  computeNumericBounds,
  toStrictlyIncreasing,
  type NumericFieldKey,
  type NumericBounds,
  type NumericRange,
  type NumericFilterable,
} from "@/lib/property-numeric-filters";

// Stable insertion order (matches TYPE_CODES elsewhere) for both the property_type color-by
// expression and its legend swatches, so the two always agree on what's shown and in what order.
const PROPERTY_TYPE_ORDER = Object.keys(TYPE_LABEL);
// Static -- built once, not per-render -- since TYPE_COLOR/PROPERTY_TYPE_ORDER never change.
const TYPE_COLOR_EXPRESSION = [
  "match", ["get", "property_type"],
  ...PROPERTY_TYPE_ORDER.flatMap((t) => [t, TYPE_COLOR[t]]),
  TYPE_COLOR.other,
] as unknown as Expression;

// Single_family/multifamily/condo share one color (TYPE_COLOR) and commercial/other each have
// their own -- so the legend shows the 3 colors that actually appear on the map, not all 5
// type labels (which would just repeat "Residential"'s swatch three times).
const PROPERTY_TYPE_LEGEND = [
  { label: "Residential", color: TYPE_COLOR.single_family },
  { label: "Commercial", color: TYPE_COLOR.commercial },
  { label: "Other", color: TYPE_COLOR.other },
];

type ColorMode = "property_type" | "market_value" | "year_built";
const COLOR_MODE_LABEL: Record<ColorMode, string> = {
  property_type: "Property type",
  market_value: "Market value",
  year_built: "Year built",
};

/** [pid, lng, lat, isCommercial(0|1), zip, ym?, hasSolar(0|1), filterProps?] -- Map.tsx's compact
 *  clusterPoints tuple format. filterProps carries whatever a Mapbox pointFilter expression
 *  needs to reference (property_type, district, the numeric filter fields) as GeoJSON feature
 *  properties -- keys with a null value are simply omitted, so pointFilter's `['has', key]`
 *  checks below can express "this property has a value for this field" (see buildFilterProps /
 *  pointFilter below). */
type ClusterPoint = [
  string, number, number, number, string | null, number | undefined, number,
  Record<string, string | number>?,
];

/** Everything fetched per property, kept separately from the compact ClusterPoint tuple that
 *  actually goes to the map -- filters run against this, and only the (much smaller) filtered
 *  result gets turned into ClusterPoints. */
interface PropertyRecord extends NumericFilterable {
  pid: string;
  lng: number;
  lat: number;
  property_type: string | null;
  zip: string | null;
  has_solar: 0 | 1;
  district: string | null;
}

// Centered and zoomed to contain the full AE service-area polygon (bbox ~50.6 x 45.2km) with
// margin, computed against its actual extent rather than picking an arbitrary Austin-ish view.
const AUSTIN_CENTER: [number, number] = [-97.7437, 30.3005];
const INITIAL_ZOOM = 11;

/**
 * Step 1 of the consumer-facing "Zillow-like" property browser: a full-map view of every AE
 * property, loaded once via properties-bulk (see loadBulkPropertiesCached below) rather than a
 * query-first or pan/zoom-driven flow -- there's deliberately no per-viewport fetch here.
 * Single-sources the map component (Map.tsx, same one CityOverview.tsx already uses) and the
 * property detail view (PropertyPage.tsx, as a click-through overlay).
 *
 * Filtering: property type, council district, and the numeric range filters never touch
 * propertiesRef or trigger a GeoJSON rebuild -- they compile into a Mapbox `pointFilter`
 * expression (see below) that Map.tsx applies directly to the already-loaded 'inst-point' layer
 * via setFilter, so toggling a filter is a single native Mapbox call instead of a full
 * re-filter-and-setData pass over up to ~250k points. This only works because
 * properties-bulk's payload already carries everything a filter can reference for every
 * property -- see property-numeric-filters.ts's own comment for which fields those are and why
 * that set is deliberately smaller than what PropertyViewer.tsx's admin filters support.
 */
export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [points, setPoints] = useState<ClusterPoint[]>([]);
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  // Both null until the bulk load completes and computeNumericBounds can see real data --
  // numericBounds is each field's full [min, max] across every property (the sliders' extent),
  // numericRange is the current selection, initialized to a copy of the bounds ("everything
  // selected" is the default). ExploreFilterPanel treats a null pair as "sliders not ready yet".
  const [numericBounds, setNumericBounds] = useState<Record<NumericFieldKey, NumericBounds> | null>(null);
  const [numericRange, setNumericRange] = useState<Record<NumericFieldKey, NumericRange> | null>(null);
  const [backgroundLoad, setBackgroundLoad] = useState<{ done: boolean }>({ done: false });
  const [colorMode, setColorMode] = useState<ColorMode>("property_type");

  // Accumulates every property fetched so far, keyed by pid, so panning back over already-seen
  // area re-renders instantly from memory instead of re-querying. points (the GeoJSON-bound
  // state) only needs to be rebuilt from this when the underlying data changes -- not when a
  // filter changes, since filtering is a Mapbox-side setFilter now (see pointFilter below).
  const propertiesRef = useRef<Map<string, PropertyRecord>>(new Map());

  /** Everything a Mapbox filter expression might need to reference for one property, as GeoJSON
   *  feature properties. Omits null-valued fields entirely (rather than including them as null)
   *  so `['has', key]` in pointFilter below can cleanly express "this property has a value for
   *  this field" -- the same semantics matchesNumericFilters used to enforce by hand. */
  const buildFilterProps = (rec: PropertyRecord): Record<string, string | number> => {
    const props: Record<string, string | number> = {};
    if (rec.property_type != null) props.property_type = rec.property_type;
    if (rec.district != null) props.district = rec.district;
    for (const f of NUMERIC_FIELDS) {
      const v = f.getValue(rec);
      if (v != null) props[f.key] = v;
    }
    return props;
  };

  const rebuildPoints = () => {
    const result: ClusterPoint[] = [];
    for (const rec of propertiesRef.current.values()) {
      result.push([
        rec.pid,
        rec.lng,
        rec.lat,
        classifyProperty(rec.property_type) === "commercial" ? 1 : 0,
        rec.zip,
        undefined,
        rec.has_solar,
        buildFilterProps(rec),
      ]);
    }
    setPoints(result);
  };

  // Compiles the three filter UIs into one Mapbox filter expression, applied by Map.tsx via
  // setFilter on the 'inst-point' layer -- see the buildFilterProps properties above for what
  // it can reference. Recomputed only when a filter actually changes, and cheap to apply (no
  // GeoJSON rebuild, no re-render of anything but the map's own filter state).
  const pointFilter = useMemo<Expression | null>(() => {
    // Built as loosely-typed arrays -- mapbox-gl's Expression type is a strict recursive union
    // that doesn't infer cleanly from imperatively-assembled array literals -- then cast once
    // at the end. The actual shape is validated by Mapbox itself at setFilter time.
    const clauses: unknown[] = [];
    if (selectedTypes.length > 0) {
      clauses.push(["in", ["get", "property_type"], ["literal", selectedTypes]]);
    }
    if (selectedDistricts.length > 0) {
      clauses.push(["in", ["get", "district"], ["literal", selectedDistricts]]);
    }
    if (numericBounds && numericRange) {
      for (const f of NUMERIC_FIELDS) {
        const bounds = numericBounds[f.key];
        const range = numericRange[f.key];
        // Selection still spans the field's full extent -- "no filter", same as it always was
        // by default, not just at first render.
        const atMin = range.min <= bounds.min;
        const atMax = range.max >= bounds.max;
        if (atMin && atMax) continue;
        clauses.push(["has", f.key]);
        if (!atMin) clauses.push([">=", ["get", f.key], range.min]);
        if (!atMax) clauses.push(["<=", ["get", f.key], range.max]);
      }
    }
    return clauses.length > 0 ? (["all", ...clauses] as unknown as Expression) : null;
  }, [selectedTypes, selectedDistricts, numericBounds, numericRange]);

  // Colors the map by whichever colorMode is selected -- property_type is a fixed categorical
  // match (TYPE_COLOR_EXPRESSION), market_value/year_built are percentile-based gradients built
  // from numericBounds' gradientStops (computed once, see the bulk-load effect below -- the same
  // one-time O(n log n) sort already done there for the slider bounds, not extra per-point work:
  // the actual per-feature coloring is Mapbox's own GPU-side interpolate expression, evaluated
  // at render time the same way circle-radius-by-zoom already is). A property missing the
  // selected field (e.g. no market_value on record) falls back to a neutral gray rather than
  // erroring the expression on a null input.
  const pointColor = useMemo<Expression | null>(() => {
    if (colorMode === "property_type") return TYPE_COLOR_EXPRESSION;
    if (!numericBounds) return null;
    const stops = toStrictlyIncreasing(numericBounds[colorMode].gradientStops, 1);
    const interpolateStops = stops.flatMap((v, i) => [v, GRADIENT_COLORS[i]]);
    return [
      "case", ["has", colorMode],
      ["interpolate", ["linear"], ["get", colorMode], ...interpolateStops],
      "#9ca3af",
    ] as unknown as Expression;
  }, [colorMode, numericBounds]);

  const colorField = NUMERIC_FIELDS.find((f) => f.key === colorMode);
  const legendContent = (
    <div className="space-y-2 w-40">
      <Select value={colorMode} onValueChange={(v) => setColorMode(v as ColorMode)}>
        <SelectTrigger className="h-7 text-xs px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(COLOR_MODE_LABEL) as ColorMode[]).map((mode) => (
            <SelectItem key={mode} value={mode} className="text-xs">
              {COLOR_MODE_LABEL[mode]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {colorMode === "property_type" ? (
        <div className="space-y-1.5 pt-1">
          {PROPERTY_TYPE_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      ) : numericBounds && colorField ? (
        <div className="pt-1 space-y-1">
          <div
            className="h-2.5 rounded-full"
            style={{ background: `linear-gradient(to right, ${GRADIENT_COLORS.join(", ")})` }}
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{colorField.format(numericBounds[colorMode].gradientStops[0])}</span>
            <span>{colorField.format(numericBounds[colorMode].gradientStops[GRADIENT_PERCENTILES.length - 1])}</span>
          </div>
        </div>
      ) : (
        <div className="pt-1 text-xs text-muted-foreground/60">Loading…</div>
      )}
    </div>
  );

  // The entire dataset, loaded once via properties-bulk (direct-Postgres edge function, no
  // PostgREST 1000-row cap) instead of ~250 paginated round trips, cached in IndexedDB and
  // keyed off the payload's own generatedAt so a same-day reload skips the download entirely.
  // council_district comes pre-computed from the server (a DB trigger, see
  // geo_derivation_setup.sql), as do all four numeric-filter fields -- there's deliberately no
  // separate per-viewport fetch layered on top of this; every property is fully filterable the
  // moment this load completes, regardless of whether its area's ever been visited.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadEverything = async () => {
      let payload;
      try {
        payload = await loadBulkPropertiesCached(controller.signal);
      } catch (err) {
        if (!cancelled) console.error("Explore bulk load error:", err);
        return;
      }
      if (cancelled) return;

      for (const [pid, lng, lat, typeCode, zip, hasSolar, councilDistrict, marketValue, yearBuilt, roofSqft, solarKw] of payload.points) {
        propertiesRef.current.set(pid, {
          pid,
          lng,
          lat,
          property_type: decodeTypeCode(typeCode, payload.typeCodes),
          zip,
          has_solar: hasSolar,
          district: councilDistrict != null ? String(councilDistrict) : null,
          market_value: marketValue,
          roof_sqft: roofSqft,
          year_built: yearBuilt,
          solar_kw: solarKw,
        });
      }
      if (!cancelled) {
        rebuildPoints();
        const bounds = computeNumericBounds(propertiesRef.current.values());
        setNumericBounds(bounds);
        // Deep-copy per field -- the slider mutates numericRange's entries directly via
        // onNumericRangeChange, and sharing object references with numericBounds would let a
        // drag silently mutate the bounds too.
        setNumericRange(
          NUMERIC_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: { ...bounds[f.key] } }), {} as Record<NumericFieldKey, NumericRange>),
        );
        setBackgroundLoad({ done: true });
      }
    };

    loadEverything();
    return () => { cancelled = true; controller.abort(); };
    // Runs once on mount by design; rebuildPoints only reads propertiesRef, so using its
    // mount-time closure is safe even though the linter can't tell that itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProperty = (pid: string) => {
    navigate(`/property/${pid}`, { state: { background: location } });
  };

  // Stable reference (setSelectedPid itself never changes identity) -- Map.tsx's clusterPoints
  // effect lists onMapBackgroundClick as a dependency, so an inline arrow function here made
  // that effect (which rebuilds the whole ~250k-feature GeoJSON and re-tiles it in Mapbox on
  // its fast path) refire on every Explore render, including ones with nothing to do with the
  // map at all (every filter keystroke). Under repeated rapid filter interaction that piled up
  // in-flight rebuild/re-tile work faster than it could be garbage collected.
  const clearSelectedPid = useCallback(() => setSelectedPid(null), []);

  return (
    <div className="h-screen w-full relative">
      <MapTokenLoader className="h-full w-full">
        <PropertyMapView
          className="h-full w-full"
          center={AUSTIN_CENTER}
          zoom={INITIAL_ZOOM}
          disableClusterAutoFit
          clusterPoints={points}
          pointFilter={pointFilter}
          pointColor={pointColor}
          legendContent={legendContent}
          showLegend
          cooperativeGestures={false}
          showServiceAreaBoundary
          showCouncilDistricts={selectedDistricts.length > 0}
          councilDistrictFilter={selectedDistricts}
          onClusterPointClick={setSelectedPid}
          selectedPointId={selectedPid}
          onMapBackgroundClick={clearSelectedPid}
          renderPointOverlay={(pid) => (
            <PropertyPreviewCard
              pid={pid}
              onOpen={() => openProperty(pid)}
              onClose={() => setSelectedPid(null)}
            />
          )}
        />
      </MapTokenLoader>
      {!backgroundLoad.done && (
        <div className="absolute bottom-8 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1.5 border border-border text-xs text-muted-foreground">
          Loading full map…
        </div>
      )}
      <ExploreFilterPanel
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selectedDistricts={selectedDistricts}
        onDistrictsChange={setSelectedDistricts}
        numericBounds={numericBounds}
        numericRange={numericRange}
        onNumericRangeChange={setNumericRange}
      />
    </div>
  );
}
