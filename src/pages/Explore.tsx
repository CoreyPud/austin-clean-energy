import { useEffect, useRef, useState } from "react";
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
// Background full-area load: paginated the same way as the bounds query, but for every AE
// property regardless of viewport, so the map fills in behind the scenes while the existing
// pan/zoom-driven fetch keeps handling what's actually on screen. A short gap between pages
// keeps it from competing for bandwidth with bounds-triggered fetches while the user is
// actively panning.
const BACKGROUND_PAGE_SIZE = 1000;
const BACKGROUND_PAGE_DELAY_MS = 30;
// Recomputing/re-rendering after every one of ~250 background pages would be wasteful --
// batch it instead.
const BACKGROUND_RECOMPUTE_EVERY_N_PAGES = 10;

interface MinimalPropertyRow {
  pid: string;
  situs_zip: string | null;
  property_type: string | null;
  centroid_lat: number;
  centroid_lon: number;
  has_solar: boolean | null;
}

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
  const [backgroundLoad, setBackgroundLoad] = useState<{ loaded: number; total: number | null; done: boolean }>({
    loaded: 0,
    total: null,
    done: false,
  });

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

  // Fills in the rest of the AE area in the background, independent of pan/zoom, so a fully
  // populated cache (for future clustering at zoomed-out levels) builds up without blocking or
  // slowing down the normal viewport-driven experience. Records this adds are minimal (no
  // filter-relevant columns) -- matchesNumericFilters already treats a null field as "doesn't
  // match" a specific range, so a background-only property just won't show up under an active
  // numeric filter until a real viewport visit enriches it via handleBoundsChange, which never
  // downgrades an already-enriched record since it always overwrites with full data anyway.
  useEffect(() => {
    let cancelled = false;

    const loadEverything = async () => {
      const districts = await loadDistricts();
      let offset = 0;
      let pagesSinceRecompute = 0;

      while (!cancelled) {
        const { data, error, count } = await supabase
          .from("tcad_properties")
          .select("pid, situs_zip, property_type, centroid_lat, centroid_lon, has_solar", { count: "exact" })
          .eq("in_ae", true)
          .not("centroid_lat", "is", null)
          .not("centroid_lon", "is", null)
          .order("pid")
          .range(offset, offset + BACKGROUND_PAGE_SIZE - 1);

        if (cancelled) return;
        if (error) {
          console.error("Explore background load error:", error);
          return;
        }

        for (const p of (data ?? []) as MinimalPropertyRow[]) {
          // Never overwrite a record a real viewport visit already enriched with filter data.
          if (propertiesRef.current.has(p.pid)) continue;
          const lng = p.centroid_lon;
          const lat = p.centroid_lat;
          propertiesRef.current.set(p.pid, {
            pid: p.pid,
            lng,
            lat,
            property_type: p.property_type,
            zip: p.situs_zip,
            has_solar: p.has_solar ? 1 : 0,
            district: findContainingFeatureId(lng, lat, districts, "district_number"),
            market_value: null,
            roof_sqft: null,
            year_built: null,
            solar_kw: null,
            solar_sunshine_median: null,
            solar_max_panels: null,
            solar_panel_capacity_w: null,
            solar_buildable_kw: null,
            solar_eligible_kw: null,
            solar_max_area_m2: null,
          });
        }

        offset += BACKGROUND_PAGE_SIZE;
        pagesSinceRecompute++;
        const loaded = Math.min(offset, count ?? offset);
        const isLastPage = (data?.length ?? 0) < BACKGROUND_PAGE_SIZE;
        if (pagesSinceRecompute >= BACKGROUND_RECOMPUTE_EVERY_N_PAGES || isLastPage) {
          recomputeVisiblePoints();
          pagesSinceRecompute = 0;
        }
        setBackgroundLoad({ loaded, total: count ?? null, done: isLastPage });
        if (isLastPage) break;

        await new Promise((resolve) => setTimeout(resolve, BACKGROUND_PAGE_DELAY_MS));
      }
    };

    loadEverything();
    return () => { cancelled = true; };
    // Runs once on mount by design; recomputeVisiblePoints/loadDistricts only read refs, so
    // using their mount-time closure is safe even though the linter can't tell that itself.
  }, []);

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
          clusterMode
          showServiceAreaBoundary
          showCouncilDistricts={selectedDistricts.length > 0}
          councilDistrictFilter={selectedDistricts}
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
      {!backgroundLoad.done && (
        <div className="absolute bottom-8 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1.5 border border-border text-xs text-muted-foreground">
          Loading full map
          {backgroundLoad.total ? ` (${Math.min(100, Math.round((backgroundLoad.loaded / backgroundLoad.total) * 100))}%)` : "…"}
        </div>
      )}
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
