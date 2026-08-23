import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MapTokenLoader from "@/components/MapTokenLoader";
import Map from "@/components/Map";
import { classifyProperty } from "@/lib/property-solar";

/** [pid, lng, lat, isCommercial(0|1), zip] -- Map.tsx's compact clusterPoints tuple format. */
type ClusterPoint = [string, number, number, number, string | null];

const AUSTIN_CENTER: [number, number] = [-97.7431, 30.2672];
const BOUNDS_QUERY_LIMIT = 100;
const DEBOUNCE_MS = 400;

/**
 * Step 1 of the consumer-facing "Zillow-like" property browser: a full-map view that fetches
 * whatever's in the current viewport instead of a query-first flow. Single-sources the map
 * component (Map.tsx, same one CityOverview.tsx already uses for bounds-driven loading) and
 * will single-source the property detail view (PropertyPage.tsx, as a click-through overlay)
 * once that's wired up -- this pass is just the map and the bounded fetch.
 */
export default function Explore() {
  const [points, setPoints] = useState<ClusterPoint[]>([]);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBoundsChange = (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    loadingTimeoutRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("tcad_properties")
        .select("pid, situs_zip, property_type, centroid_lat, centroid_lon")
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
        .limit(BOUNDS_QUERY_LIMIT);

      if (error) {
        console.error("Explore bounds query error:", error);
        return;
      }

      setPoints(
        (data ?? []).map((p): ClusterPoint => [
          p.pid,
          p.centroid_lon as number,
          p.centroid_lat as number,
          classifyProperty(p.property_type) === "commercial" ? 1 : 0,
          p.situs_zip,
        ]),
      );
    }, DEBOUNCE_MS);
  };

  return (
    <div className="h-screen w-full">
      <MapTokenLoader>
        <Map
          className="h-full w-full"
          center={AUSTIN_CENTER}
          zoom={12}
          clusterPoints={points}
          enableDynamicLoading
          onBoundsChange={handleBoundsChange}
          showLegend
          cooperativeGestures={false}
        />
      </MapTokenLoader>
    </div>
  );
}
