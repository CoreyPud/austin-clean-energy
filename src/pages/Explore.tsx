import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MapTokenLoader from "@/components/MapTokenLoader";
import PropertyMapView from "@/components/Map";
import PropertyPreviewCard from "@/components/explore/PropertyPreviewCard";
import ExploreFilterPanel from "@/components/explore/ExploreFilterPanel";
import { classifyProperty } from "@/lib/property-solar";
import { findContainingFeatureId } from "@/lib/point-in-polygon";
import {
  matchesNumericFilters,
  EMPTY_NUMERIC_FILTERS,
  type NumericFieldKey,
  type NumericRange,
  type NumericFilterable,
} from "@/lib/property-numeric-filters";

/** [pid, lng, lat, isCommercial(0|1), zip, ym?, hasSolar(0|1)] -- Map.tsx's compact clusterPoints tuple format. */
type ClusterPoint = [string, number, number, number, string | null, number | undefined, number];

/** Shape of a row from the bounds query below, including the embedded solar_installations. */
interface PropertyQueryRow {
  pid: string;
  situs_zip: string | null;
  property_type: string | null;
  centroid_lat: number;
  centroid_lon: number;
  has_solar: boolean | null;
  market_value: number | null;
  estimated_roof_sqft: number | null;
  year_built: number | null;
  solar_sunshine_median: number | null;
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_buildable_kw: number | null;
  solar_eligible_kw: number | null;
  solar_max_area_m2: number | null;
  solar_installations: { installed_kw: number | null }[] | null;
}

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

const AUSTIN_CENTER: [number, number] = [-97.7431, 30.2672];
// 1000 is the actual ceiling here, not just a chosen number -- PostgREST silently truncates
// any higher limit to this project's configured max rows per request regardless of what's
// requested (confirmed empirically: asking for 5000 still returned exactly 1000).
const BOUNDS_QUERY_LIMIT = 1000;
const DEBOUNCE_MS = 400;

/**
 * Step 1 of the consumer-facing "Zillow-like" property browser: a full-map view that fetches
 * whatever's in the current viewport instead of a query-first flow. Single-sources the map
 * component (Map.tsx, same one CityOverview.tsx already uses for bounds-driven loading) and
 * the property detail view (PropertyPage.tsx, as a click-through overlay).
 *
 * Filtering: only the bounds+in_ae query hits the database. Property type, council district,
 * and the numeric range filters all run client-side against the full set of properties already
 * fetched for visited areas (propertiesRef), so toggling a filter is instant and never needs a
 * re-query -- it's a view over data that's already there, layered on top of the area-based fetch.
 */
export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [points, setPoints] = useState<ClusterPoint[]>([]);
  const [selectedPid, setSelectedPid] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [numericFilters, setNumericFilters] = useState<Record<NumericFieldKey, NumericRange>>(EMPTY_NUMERIC_FILTERS);

  // Accumulates every property fetched so far, keyed by pid, so panning back over already-seen
  // area re-renders instantly from memory instead of re-querying, and so filter changes can
  // re-derive the visible set without a new fetch.
  const propertiesRef = useRef<Map<string, PropertyRecord>>(new Map());
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const districtsPromiseRef = useRef<Promise<GeoJSON.FeatureCollection> | null>(null);
  // Synced every render (and mutated directly in each filter onChange below, ahead of the
  // resulting setState) so recomputeVisiblePoints -- called from both the debounced bounds
  // fetch and the filter handlers -- always reads the latest filter values immediately,
  // regardless of which render's closure it was created in or React's batching timing.
  const filtersRef = useRef({ selectedTypes, selectedDistricts, numericFilters });
  filtersRef.current = { selectedTypes, selectedDistricts, numericFilters };

  const loadDistricts = (): Promise<GeoJSON.FeatureCollection> => {
    if (!districtsPromiseRef.current) {
      districtsPromiseRef.current = fetch("/data/austin-council-districts.geojson").then((r) => r.json());
    }
    return districtsPromiseRef.current;
  };

  const recomputeVisiblePoints = () => {
    const { selectedTypes, selectedDistricts, numericFilters } = filtersRef.current;
    const filtered: ClusterPoint[] = [];
    for (const rec of propertiesRef.current.values()) {
      if (selectedTypes.length > 0 && !selectedTypes.includes(rec.property_type ?? "")) continue;
      if (selectedDistricts.length > 0 && (!rec.district || !selectedDistricts.includes(rec.district))) continue;
      if (!matchesNumericFilters(rec, numericFilters)) continue;
      filtered.push([
        rec.pid,
        rec.lng,
        rec.lat,
        classifyProperty(rec.property_type) === "commercial" ? 1 : 0,
        rec.zip,
        undefined,
        rec.has_solar,
      ]);
    }
    setPoints(filtered);
  };

  const handleBoundsChange = (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    loadingTimeoutRef.current = setTimeout(async () => {
      const [{ data, error }, districts] = await Promise.all([
        supabase
          .from("tcad_properties")
          .select(`
            pid, situs_zip, property_type, centroid_lat, centroid_lon, has_solar,
            market_value, estimated_roof_sqft, year_built, solar_sunshine_median,
            solar_max_panels, solar_panel_capacity_w, solar_buildable_kw, solar_eligible_kw,
            solar_max_area_m2, solar_installations(installed_kw)
          `)
          .eq("in_ae", true)
          .not("centroid_lat", "is", null)
          .not("centroid_lon", "is", null)
          .gte("centroid_lat", bounds.south)
          .lte("centroid_lat", bounds.north)
          .gte("centroid_lon", bounds.west)
          .lte("centroid_lon", bounds.east)
          // Without an explicit order, Postgres satisfies LIMIT by scanning the
          // (centroid_lat, centroid_lon) index from its low end, so results end up biased to
          // the south edge of the viewport instead of spread across it. Ordering by a
          // non-spatial column decorrelates the limit from that scan direction. This is a
          // stopgap, not genuine spatial sampling -- a densely-covered viewport with far more
          // than BOUNDS_QUERY_LIMIT candidates would want real grid-bucketed sampling instead.
          .order("pid")
          .limit(BOUNDS_QUERY_LIMIT),
        loadDistricts(),
      ]);

      if (error) {
        console.error("Explore bounds query error:", error);
        return;
      }

      for (const p of (data ?? []) as unknown as PropertyQueryRow[]) {
        const lng = p.centroid_lon;
        const lat = p.centroid_lat;
        const installedKw = (p.solar_installations ?? []).reduce(
          (sum: number, r: { installed_kw: number | null }) => sum + (r.installed_kw ?? 0),
          0,
        ) || null;
        propertiesRef.current.set(p.pid, {
          pid: p.pid,
          lng,
          lat,
          property_type: p.property_type,
          zip: p.situs_zip,
          has_solar: p.has_solar ? 1 : 0,
          district: findContainingFeatureId(lng, lat, districts, "district_number"),
          market_value: p.market_value,
          roof_sqft: p.estimated_roof_sqft,
          year_built: p.year_built,
          solar_kw: installedKw,
          solar_sunshine_median: p.solar_sunshine_median,
          solar_max_panels: p.solar_max_panels,
          solar_panel_capacity_w: p.solar_panel_capacity_w,
          solar_buildable_kw: p.solar_buildable_kw,
          solar_eligible_kw: p.solar_eligible_kw,
          solar_max_area_m2: p.solar_max_area_m2,
        });
      }
      recomputeVisiblePoints();
    }, DEBOUNCE_MS);
  };

  const openProperty = (pid: string) => {
    navigate(`/property/${pid}`, { state: { background: location } });
  };

  return (
    <div className="h-screen w-full relative">
      <MapTokenLoader>
        <PropertyMapView
          className="h-full w-full"
          center={AUSTIN_CENTER}
          zoom={12}
          clusterPoints={points}
          enableDynamicLoading
          onBoundsChange={handleBoundsChange}
          showLegend
          cooperativeGestures={false}
          showServiceAreaBoundary
          showCouncilDistricts
          onClusterPointClick={setSelectedPid}
          selectedPointId={selectedPid}
          onMapBackgroundClick={() => setSelectedPid(null)}
          renderPointOverlay={(pid) => (
            <PropertyPreviewCard
              pid={pid}
              onOpen={() => openProperty(pid)}
              onClose={() => setSelectedPid(null)}
            />
          )}
        />
      </MapTokenLoader>
      <ExploreFilterPanel
        selectedTypes={selectedTypes}
        onTypesChange={(v) => { setSelectedTypes(v); filtersRef.current.selectedTypes = v; recomputeVisiblePoints(); }}
        selectedDistricts={selectedDistricts}
        onDistrictsChange={(v) => { setSelectedDistricts(v); filtersRef.current.selectedDistricts = v; recomputeVisiblePoints(); }}
        numericFilters={numericFilters}
        onNumericFiltersChange={(v) => { setNumericFilters(v); filtersRef.current.numericFilters = v; recomputeVisiblePoints(); }}
      />
    </div>
  );
}
