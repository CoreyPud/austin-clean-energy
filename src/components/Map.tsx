import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const DISTRICT_LAYER_IDS = ['council-districts-fill', 'council-districts-line', 'council-districts-label'];
// 'inst-point' fill color when a caller doesn't supply pointColor -- unchanged from before
// pointColor existed, so CityOverview.tsx (which never passes it) keeps its exact original
// residential/commercial 2-color look.
const DEFAULT_POINT_COLOR: mapboxgl.Expression = [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  ['case', ['==', ['get', 'c'], 1], '#1e3a8a', '#166534'],
  ['case', ['==', ['get', 'c'], 1], '#2563eb', '#22c55e'],
];

/** Compact clustered point tuple: [id, lng, lat, isCommercial(0|1), zip|null, ym?, hasSolar(0|1)?,
 *  filterProps?]. Named here so both the full-source build and the incremental updateData path
 *  below share one feature-shape definition instead of two copies that could drift apart. */
type ClusterPointTuple = [string, number, number, number, string | null, number?, number?, Record<string, string | number>?];

const buildFeature = ([id, lng, lat, c, zip, , hasSolar, filterProps]: ClusterPointTuple) => ({
  type: 'Feature' as const,
  // Top-level id (distinct from properties.id) is what feature-state keys off of, for the
  // hover/selected paint below.
  id,
  // filterProps spreads in last so a caller-supplied field never collides with the
  // always-present ones -- pointFilter expressions only ever reference filterProps' own keys
  // (property_type, district, the numeric filter fields), never these.
  properties: { id, c, zip: zip || '', has_solar: hasSolar || 0, ...(filterProps ?? {}) },
  geometry: { type: 'Point' as const, coordinates: [lng, lat] },
});

interface HeatmapPoint {
  zip: string;
  count: number;
  coordinates: [number, number];
  intensity: number;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    coordinates: [number, number];
    title: string;
    address?: string;
    capacity?: string;
    programType?: string;
    installDate?: string;
    id?: string;
    color?: string;
    source?: 'existing' | 'api' | 'target';
  }>;
  /** filterProps (if present on a tuple) is spread into the feature's GeoJSON properties
   *  verbatim -- it's how pointFilter below gets anything to reference beyond c/zip/has_solar. */
  clusterPoints?: ClusterPointTuple[];
  /** Mapbox 'circle-color' expression applied to the 'inst-point' layer via setPaintProperty --
   *  same pattern as pointFilter below (a caller builds whatever expression it needs and this
   *  just applies it, no GeoJSON/data involvement). Falls back to DEFAULT_POINT_COLOR (the
   *  original residential-vs-commercial 2-color split, keyed on 'c') when omitted, so
   *  CityOverview.tsx (which never passes this) is unaffected. Pair with legendContent so the
   *  legend actually reflects whatever this expression does -- Map.tsx has no way to infer a
   *  legend from an arbitrary expression itself. */
  pointColor?: mapboxgl.Expression | null;
  /** Overrides the default residential/commercial 2-item legend entirely when showLegend is on.
   *  Whoever builds pointColor above should build this from the exact same color data, so the
   *  two can never drift out of sync with each other. */
  legendContent?: ReactNode;
  onClusterPointClick?: (id: string) => void;
  /** Mapbox filter expression applied to the 'inst-point' layer via setFilter -- lets a caller
   *  filter the already-loaded point set (matched against each feature's properties, including
   *  whatever clusterPoints' filterProps supplied) without touching clusterPoints/setData at
   *  all. Cheap regardless of dataset size: no GeoJSON rebuild, just a native Mapbox re-filter
   *  of what's already on the GPU. Combined with clusterMode's own point/cluster split filter
   *  when both are in play. */
  pointFilter?: mapboxgl.Expression | null;
  /** Aggregates clusterPoints into count bubbles at low zoom via Mapbox's built-in
   *  (supercluster-backed) clustering instead of rendering every point as its own feature --
   *  needed once clusterPoints gets into the hundreds of thousands (a raw per-point circle
   *  layer at that scale is what caused an OOM crash on /explore's full-area background load).
   *  Individual dots (hover/selected feature-state, click-to-open) still work at high zoom
   *  once a cluster has broken apart into its members. */
  clusterMode?: boolean;
  /** Hides individual clusterPoint dots entirely below this zoom (Mapbox's native layer
   *  minzoom -- the layer simply isn't drawn, no clustering index and no extra computation).
   *  Simpler alternative to clusterMode for a dataset that doesn't need count bubbles, just
   *  "nothing at low zoom, real dots once zoomed in." */
  pointsMinZoom?: number;
  /** id of a clusterPoint to show a floating overlay over (e.g. a Zillow-style preview card).
   *  The overlay tracks that point's screen position as the map pans/zooms. */
  selectedPointId?: string | null;
  /** Renders the overlay content for selectedPointId. Positioning/tracking is handled by Map. */
  renderPointOverlay?: (id: string) => ReactNode;
  /** Fires when the map background (not a cluster point) is clicked -- typically used to
   *  dismiss a point overlay. */
  onMapBackgroundClick?: () => void;
  heatmapData?: HeatmapPoint[];
  showLegend?: boolean;
  className?: string;
  onMarkerClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number; zoom: number }) => void;
  enableDynamicLoading?: boolean;
  isLoadingMapData?: boolean;
  /** When this string changes, the map refits its view to the current markers (overrides enableDynamicLoading). */
  fitMarkersKey?: string;
  /** Requires ctrl/cmd+scroll to zoom, so scrolling a page past an embedded map doesn't
   *  hijack the scroll. Defaults to true for every embedded use; a page where the map IS
   *  the whole viewport (nothing to scroll past) should pass false for plain scroll-to-zoom. */
  cooperativeGestures?: boolean;
  /** Draws the Austin Energy service-area boundary from
   *  public/data/austin-energy-service-area.geojson. Outline only -- no filtering/masking.
   *  Source: City of Austin GIS, "Austin Energy Utility Service Area" layer (OBJECTID 641,
   *  last updated 2026-04-03), fetched from
   *  https://maps.austintexas.gov/gis/rest/Shared/BoundariesGrids_2/MapServer/1/query?where=1=1&outFields=*&f=geojson
   *  -- see that dataset's own _source field for the full provenance note. Same polygon (7
   *  decimal places, ~1cm precision) is embedded in fix_in_ae_service_area.sql, which recomputes
   *  tcad_properties.in_ae via point-in-polygon instead of the old ZIP-list approximation. */
  showServiceAreaBoundary?: boolean;
  /** Draws Austin's council district boundaries with a number label per district, from
   *  public/data/austin-council-districts.geojson. Outline + label only, no dot filtering.
   *  Source: City of Austin Open Data (Socrata), "Boundaries: City of Austin Council Districts"
   *  (dataset w3v2-cj58), fetched from https://data.austintexas.gov/resource/w3v2-cj58.geojson
   *  -- see that dataset's own _source field for the full provenance note. */
  showCouncilDistricts?: boolean;
  /** Restricts the drawn districts to these district_number values (e.g. ["3", "7"]) instead
   *  of all 10. Omit/empty to draw every district. */
  councilDistrictFilter?: string[];
  /** Skips the auto-fit-to-clusterPoints-on-first-load behavior below. Use when the caller
   *  wants to control the initial camera itself (e.g. a fixed view sized to a known service
   *  area) instead of having it jump to fit whatever small initial batch of points loads
   *  first. */
  disableClusterAutoFit?: boolean;
}

const Map = ({ center = [-97.7431, 30.2672], zoom = 10, markers = [], clusterPoints, onClusterPointClick, heatmapData = [], className = "", showLegend = false, onMarkerClick, onBoundsChange, enableDynamicLoading = false, isLoadingMapData = false, fitMarkersKey, cooperativeGestures = true, selectedPointId, renderPointOverlay, onMapBackgroundClick, showServiceAreaBoundary = false, showCouncilDistricts = false, councilDistrictFilter, clusterMode = false, pointsMinZoom, disableClusterAutoFit = false, pointFilter = null, pointColor = null, legendContent }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const lastFitKeyRef = useRef<string | undefined>(undefined);
  // Positioned imperatively (not via React state) in the effect below -- this tracks a live
  // map camera at up to 60fps during a drag/zoom, and re-rendering the whole overlay subtree
  // on every 'move' tick was the actual cause of laggy panning once a point was selected.
  const overlayRef = useRef<HTMLDivElement>(null);
  const hoveredPointIdRef = useRef<string | number | null>(null);
  const selectedPointIdRef = useRef<string | number | null>(null);
  // Tracks the clusterPoints reference actually last pushed into the 'installations' source, so
  // the effect below can skip a redundant rebuild-and-setData when it re-runs for an unrelated
  // dependency (e.g. a caller passing a new onClusterPointClick/onMapBackgroundClick closure
  // every render) but clusterPoints itself hasn't changed. Rebuilding the full GeoJSON and
  // making Mapbox re-tile it is not free at ~250k points -- doing it on every unrelated
  // re-render under rapid filter interaction is what caused an OOM.
  const lastAppliedClusterPointsRef = useRef<typeof clusterPoints>(undefined);
  // Synced every render so the async district-layer setup (fetch().then(...)) and the
  // filter-update effect both always read the latest selection, regardless of which render's
  // closure created them.
  const councilDistrictFilterRef = useRef(councilDistrictFilter);
  councilDistrictFilterRef.current = councilDistrictFilter;
  // Same pattern as councilDistrictFilterRef -- the applyPointFilter callback below and the
  // effect that calls it on prop changes both need the latest value regardless of which
  // render's closure they were created in.
  const pointFilterRef = useRef(pointFilter);
  pointFilterRef.current = pointFilter;
  // Same pattern again, for pointColor.
  const pointColorRef = useRef(pointColor);
  pointColorRef.current = pointColor;

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = (window as any).MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      cooperativeGestures,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Austin Energy service-area boundary -- outline only, sanity-check visual, no filtering.
  useEffect(() => {
    if (!map.current || !showServiceAreaBoundary) return;
    const currentMap = map.current;
    let cancelled = false;

    const addBoundary = () => {
      if (cancelled || !currentMap || currentMap.getSource('ae-service-area')) return;
      fetch('/data/austin-energy-service-area.geojson')
        .then((res) => res.json())
        .then((geojson) => {
          if (cancelled || !currentMap || currentMap.getSource('ae-service-area')) return;
          currentMap.addSource('ae-service-area', { type: 'geojson', data: geojson });
          currentMap.addLayer({
            id: 'ae-service-area-fill',
            type: 'fill',
            source: 'ae-service-area',
            paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.04 },
          });
          currentMap.addLayer({
            id: 'ae-service-area-line',
            type: 'line',
            source: 'ae-service-area',
            paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [2, 1.5] },
          });
        })
        .catch((err) => console.error('Failed to load AE service area boundary:', err));
    };

    // isStyleLoaded/'styledata', not loaded()/'load' -- see the matching comment on the
    // council-districts effect below for why 'load' (fires once ever, not on every re-run) is
    // the wrong check here even though this particular effect only runs once today.
    if (currentMap.isStyleLoaded()) addBoundary();
    else currentMap.once('styledata', addBoundary);

    return () => {
      cancelled = true;
      try {
        if (currentMap.getLayer('ae-service-area-line')) currentMap.removeLayer('ae-service-area-line');
        if (currentMap.getLayer('ae-service-area-fill')) currentMap.removeLayer('ae-service-area-fill');
        if (currentMap.getSource('ae-service-area')) currentMap.removeSource('ae-service-area');
      } catch {
        // Map instance already torn down by the init effect's own cleanup -- nothing to clean up.
      }
    };
  }, [showServiceAreaBoundary]);

  // Applies councilDistrictFilterRef's current value to the district layers (if they exist).
  // Called both right after the layers are first created and whenever the filter changes
  // while they already exist, so it's correct regardless of which happens first. Reads only
  // from a ref (never stale) and takes the map explicitly, so it's safe to keep referentially
  // stable via useCallback rather than re-created (and re-added to effect deps) every render.
  const applyDistrictFilter = useCallback((targetMap: mapboxgl.Map) => {
    const selected = councilDistrictFilterRef.current;
    const filterExpr: mapboxgl.Expression | null =
      selected && selected.length > 0 ? ['in', ['get', 'district_number'], ['literal', selected]] : null;
    for (const id of DISTRICT_LAYER_IDS) {
      if (targetMap.getLayer(id)) targetMap.setFilter(id, filterExpr);
    }
  }, []);

  // Same idea as applyDistrictFilter, for the 'inst-point' layer's own pointFilter prop. When
  // clusterMode is also on, the point/cluster split filter (['!', ['has','point_count']]) has
  // to be preserved alongside whatever pointFilter adds -- ANDed together rather than one
  // replacing the other.
  const applyPointFilter = useCallback((targetMap: mapboxgl.Map) => {
    if (!targetMap.getLayer('inst-point')) return;
    const splitFilter: mapboxgl.Expression | null = clusterMode ? ['!', ['has', 'point_count']] : null;
    const extra = pointFilterRef.current ?? null;
    const combined: mapboxgl.Expression | null =
      splitFilter && extra ? ['all', splitFilter, extra] : (extra ?? splitFilter);
    targetMap.setFilter('inst-point', combined);
  }, [clusterMode]);

  // Same idea again, for pointColor -- setPaintProperty instead of setFilter, DEFAULT_POINT_COLOR
  // instead of "no filter" as the fallback.
  const applyPointColor = useCallback((targetMap: mapboxgl.Map) => {
    if (!targetMap.getLayer('inst-point')) return;
    targetMap.setPaintProperty('inst-point', 'circle-color', pointColorRef.current ?? DEFAULT_POINT_COLOR);
  }, []);

  // Austin's council districts -- boundary line + number label per district, restricted to
  // councilDistrictFilter when set.
  useEffect(() => {
    if (!map.current || !showCouncilDistricts) return;
    const currentMap = map.current;
    let cancelled = false;

    const addDistricts = () => {
      if (cancelled || !currentMap || currentMap.getSource('council-districts')) return;
      fetch('/data/austin-council-districts.geojson')
        .then((res) => res.json())
        .then((geojson) => {
          if (cancelled || !currentMap || currentMap.getSource('council-districts')) return;
          currentMap.addSource('council-districts', { type: 'geojson', data: geojson });
          // 10-hue categorical palette (Tableau10), keyed on district_number -- which the
          // source data stores as a string ("1".."10"), so the match cases must match.
          const districtColor: mapboxgl.Expression = [
            'match', ['get', 'district_number'],
            '1', '#1f77b4',
            '2', '#ff7f0e',
            '3', '#2ca02c',
            '4', '#d62728',
            '5', '#9467bd',
            '6', '#8c564b',
            '7', '#e377c2',
            '8', '#7f7f7f',
            '9', '#bcbd22',
            '10', '#17becf',
            '#999999',
          ];
          currentMap.addLayer({
            id: 'council-districts-fill',
            type: 'fill',
            source: 'council-districts',
            paint: { 'fill-color': districtColor, 'fill-opacity': 0.08 },
          });
          currentMap.addLayer({
            id: 'council-districts-line',
            type: 'line',
            source: 'council-districts',
            paint: { 'line-color': districtColor, 'line-width': 1.5, 'line-opacity': 0.8 },
          });
          currentMap.addLayer({
            id: 'council-districts-label',
            type: 'symbol',
            source: 'council-districts',
            layout: {
              'text-field': ['concat', 'D', ['get', 'district_number']],
              'text-size': 13,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            },
            paint: {
              'text-color': districtColor,
              'text-halo-color': '#ffffff',
              'text-halo-width': 1.5,
            },
          });
          applyDistrictFilter(currentMap);
        })
        .catch((err) => console.error('Failed to load council districts:', err));
    };

    // isStyleLoaded (not loaded()/'load') because this effect re-runs on every toggle, not just
    // once on mount -- Mapbox's 'load' event only ever fires once for a map instance's initial
    // style load, so a second `.once('load', ...)` registration here would simply never fire
    // once that's already happened (which is very plausibly why the overlay only "sometimes"
    // showed: whenever loaded() read false at exactly the moment a toggle fired -- e.g. while
    // the ~250k-point background source was mid-(re)load -- it waited on an event that was
    // never coming again). isStyleLoaded/'styledata' both fire correctly on every check instead.
    if (currentMap.isStyleLoaded()) addDistricts();
    else currentMap.once('styledata', addDistricts);

    return () => {
      cancelled = true;
      try {
        if (currentMap.getLayer('council-districts-label')) currentMap.removeLayer('council-districts-label');
        if (currentMap.getLayer('council-districts-line')) currentMap.removeLayer('council-districts-line');
        if (currentMap.getLayer('council-districts-fill')) currentMap.removeLayer('council-districts-fill');
        if (currentMap.getSource('council-districts')) currentMap.removeSource('council-districts');
      } catch {
        // Map instance already torn down by the init effect's own cleanup -- nothing to clean up.
      }
    };
  }, [showCouncilDistricts, applyDistrictFilter]);

  // Updates which districts are drawn when the selection changes while the layers already
  // exist (the effect above only runs on showCouncilDistricts, i.e. empty <-> non-empty).
  useEffect(() => {
    if (!map.current) return;
    applyDistrictFilter(map.current);
  }, [councilDistrictFilter, applyDistrictFilter]);

  // Updates the 'inst-point' layer's filter whenever pointFilter changes, without touching the
  // GeoJSON source at all -- this is the whole point (no pun intended) of pointFilter existing
  // separately from clusterPoints: toggling a filter never needs a setData pass.
  useEffect(() => {
    if (!map.current) return;
    applyPointFilter(map.current);
  }, [pointFilter, applyPointFilter]);

  // Same idea for pointColor -- a color-mode switch is a single setPaintProperty call, no
  // GeoJSON rebuild.
  useEffect(() => {
    if (!map.current) return;
    applyPointColor(map.current);
  }, [pointColor, applyPointColor]);

  // Attach/detach bounds change listener without recreating the map
  useEffect(() => {
    if (!map.current) return;

    const handleBoundsChange = () => {
      if (!map.current) return;
      const bounds = map.current.getBounds();
      const currentZoom = map.current.getZoom();
      
      // Only trigger if zoomed in enough (zoom > 11)
      if (currentZoom > 11 && enableDynamicLoading && onBoundsChange) {
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          zoom: currentZoom
        });
      }
    };

    if (enableDynamicLoading && onBoundsChange) {
      map.current.on('moveend', handleBoundsChange);
      // Also fire once for the initial view, not just after the first user-initiated
      // move, so a bounds-driven page has data before anyone touches the map.
      if (map.current.loaded()) {
        handleBoundsChange();
      } else {
        map.current.once('load', handleBoundsChange);
      }
    }

    return () => {
      if (map.current) {
        map.current.off('moveend', handleBoundsChange);
        map.current.off('load', handleBoundsChange);
      }
    };
  }, [enableDynamicLoading, onBoundsChange]);

  // Handle heatmap rendering
  useEffect(() => {
    if (!map.current || !heatmapData || heatmapData.length === 0) return;

    const addHeatmapLayers = () => {
      if (!map.current) return;

      // Remove existing layers if they exist
      if (map.current.getLayer('solar-labels')) map.current.removeLayer('solar-labels');
      if (map.current.getLayer('solar-circles')) map.current.removeLayer('solar-circles');
      if (map.current.getLayer('solar-heatmap')) map.current.removeLayer('solar-heatmap');
      if (map.current.getSource('solar-permits')) map.current.removeSource('solar-permits');

      // Create GeoJSON for heatmap
      const geojson: any = {
        type: 'FeatureCollection',
        features: heatmapData.map(point => ({
          type: 'Feature',
          properties: {
            zip: point.zip,
            count: point.count,
            intensity: point.intensity
          },
          geometry: {
            type: 'Point',
            coordinates: point.coordinates
          }
        }))
      };

      console.log('Adding heatmap with', heatmapData.length, 'points');

      // Add source
      map.current.addSource('solar-permits', {
        type: 'geojson',
        data: geojson
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'solar-heatmap',
        type: 'heatmap',
        source: 'solar-permits',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            14, 0
          ]
        }
      });

      // Add circle layer for higher zoom levels
      map.current.addLayer({
        id: 'solar-circles',
        type: 'circle',
        source: 'solar-permits',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 4,
            100, 20
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 'rgb(103,169,207)',
            50, 'rgb(239,138,98)',
            100, 'rgb(178,24,43)'
          ],
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0,
            14, 0.8
          ]
        }
      });

      // Add labels for ZIP codes
      map.current.addLayer({
        id: 'solar-labels',
        type: 'symbol',
        source: 'solar-permits',
        layout: {
          'text-field': ['concat', ['get', 'zip'], '\n', ['to-string', ['get', 'count']], ' permits'],
          'text-size': 11,
          'text-offset': [0, 0.5]
        },
        paint: {
          'text-color': '#000',
          'text-halo-color': '#fff',
          'text-halo-width': 2,
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            12, 1
          ]
        }
      });

      // Add click event for info
      map.current.on('click', 'solar-circles', (e) => {
        if (!e.features || !e.features[0] || !map.current) return;
        const props = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 12px;">
              <strong style="font-size: 14px;">ZIP ${props?.zip}</strong><br/>
              <span style="font-size: 13px; color: #666;">${props?.count} solar permits</span>
            </div>
          `)
          .addTo(map.current);
      });

      map.current.on('mouseenter', 'solar-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'solar-circles', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    };

    // Check if map is already loaded
    if (map.current.loaded()) {
      addHeatmapLayers();
    } else {
      map.current.on('load', addHeatmapLayers);
    }
  }, [heatmapData]);

  useEffect(() => {
    if (!map.current || !clusterPoints) return;
    // Nothing to do -- this data was already applied. Only clusterPoints identity matters here
    // (see lastAppliedClusterPointsRef's own comment for why); the effect can still have been
    // re-triggered by some other dependency without there being any new data to push.
    if (lastAppliedClusterPointsRef.current === clusterPoints && map.current.getSource('installations')) {
      return;
    }

    const buildGeoJSON = () => ({
      type: 'FeatureCollection' as const,
      features: clusterPoints.map(buildFeature),
    });

    const ensureLayers = () => {
      if (!map.current) return;
      const existingSource: any = map.current.getSource('installations');
      if (existingSource && existingSource.setData) {
        // Fast path: just update data, no layer teardown → no flicker
        existingSource.setData(buildGeoJSON());
        lastAppliedClusterPointsRef.current = clusterPoints;
        return;
      }

      map.current.addSource('installations', {
        type: 'geojson',
        data: buildGeoJSON(),
        // clusterMaxZoom 13 -- computed against the actual AE service-area extent
        // (~50.6 x 45.2km): a typical ~1400px-wide viewport shows roughly 1/5 of that area at
        // zoom 13 vs. ~1/19 at zoom 14, so 13 is close to "clustering stops once about 1/8 of
        // the city is in view." Viewport width varies by device, so treat this as tunable.
        ...(clusterMode ? { cluster: true, clusterMaxZoom: 13, clusterRadius: 50 } : {}),
      });
      lastAppliedClusterPointsRef.current = clusterPoints;

      if (clusterMode) {
        map.current.addLayer({
          id: 'inst-cluster',
          type: 'circle',
          source: 'installations',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 14, 100, 18, 1000, 24, 10000, 32],
            'circle-color': ['step', ['get', 'point_count'], '#93c5fd', 100, '#3b82f6', 1000, '#1d4ed8', 10000, '#1e3a8a'],
            'circle-opacity': 0.85,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        });
        map.current.addLayer({
          id: 'inst-cluster-count',
          type: 'symbol',
          source: 'installations',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: { 'text-color': '#fff' },
        });

        map.current.on('click', 'inst-cluster', (e) => {
          if (!map.current) return;
          const feature = map.current.queryRenderedFeatures(e.point, { layers: ['inst-cluster'] })[0];
          const clusterId = feature?.properties?.cluster_id;
          if (clusterId == null || feature.geometry.type !== 'Point') return;
          const source = map.current.getSource('installations') as mapboxgl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !map.current || zoom == null) return;
            map.current.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
          });
        });
        const setClusterPointer = () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; };
        const clearClusterPointer = () => { if (map.current) map.current.getCanvas().style.cursor = ''; };
        map.current.on('mouseenter', 'inst-cluster', setClusterPointer);
        map.current.on('mouseleave', 'inst-cluster', clearClusterPointer);
      }

      map.current.addLayer({
        id: 'inst-point',
        type: 'circle',
        source: 'installations',
        ...(pointsMinZoom != null ? { minzoom: pointsMinZoom } : {}),
        paint: {
          // Overwritten by applyPointColor immediately below if pointColor is set -- this
          // initial value only matters for the split second before that call, and as the
          // permanent value when pointColor is never provided at all.
          'circle-color': DEFAULT_POINT_COLOR,
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            8, ['case',
              ['boolean', ['feature-state', 'selected'], false], 2.2,
              ['boolean', ['feature-state', 'hover'], false], 1.8,
              1.2],
            11, ['case',
              ['boolean', ['feature-state', 'selected'], false], 3.6,
              ['boolean', ['feature-state', 'hover'], false], 3,
              2],
            14, ['case',
              ['boolean', ['feature-state', 'selected'], false], 6,
              ['boolean', ['feature-state', 'hover'], false], 5,
              3.5],
            17, ['case',
              ['boolean', ['feature-state', 'selected'], false], 10,
              ['boolean', ['feature-state', 'hover'], false], 8.5,
              6],
          ],
          // Selected takes priority over has_solar's yellow ring -- a dark ring is the clearest
          // "this one" cue regardless of fill color, which matters more now that circle-color
          // can be an arbitrary caller-supplied pointColor expression instead of just two colors.
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#111827',
            ['==', ['get', 'has_solar'], 1], '#facc15',
            '#fff',
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            8, ['case',
              ['boolean', ['feature-state', 'selected'], false], 2,
              ['==', ['get', 'has_solar'], 1], 1, 0],
            11, ['case',
              ['boolean', ['feature-state', 'selected'], false], 3,
              ['==', ['get', 'has_solar'], 1], 1.5, 0.5],
            14, ['case',
              ['boolean', ['feature-state', 'selected'], false], 4,
              ['==', ['get', 'has_solar'], 1], 2.5, 1],
            17, ['case',
              ['boolean', ['feature-state', 'selected'], false], 6,
              ['==', ['get', 'has_solar'], 1], 4, 1],
          ],
          'circle-opacity': 0.85,
        },
      });
      applyPointFilter(map.current);
      applyPointColor(map.current);

      map.current.on('click', 'inst-point', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id && onClusterPointClick) onClusterPointClick(String(id));
      });

      const setPointer = () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; };
      const clearPointer = () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        if (hoveredPointIdRef.current !== null) {
          map.current.setFeatureState({ source: 'installations', id: hoveredPointIdRef.current }, { hover: false });
          hoveredPointIdRef.current = null;
        }
      };
      map.current.on('mouseenter', 'inst-point', setPointer);
      map.current.on('mouseleave', 'inst-point', clearPointer);
      map.current.on('mousemove', 'inst-point', (e) => {
        if (!map.current) return;
        const id = e.features?.[0]?.id;
        if (id === undefined || id === hoveredPointIdRef.current) return;
        if (hoveredPointIdRef.current !== null) {
          map.current.setFeatureState({ source: 'installations', id: hoveredPointIdRef.current }, { hover: false });
        }
        hoveredPointIdRef.current = id;
        map.current.setFeatureState({ source: 'installations', id }, { hover: true });
      });

      map.current.on('click', (e) => {
        if (!map.current || !onMapBackgroundClick) return;
        const hitLayers = clusterMode ? ['inst-point', 'inst-cluster'] : ['inst-point'];
        const hit = map.current.queryRenderedFeatures(e.point, { layers: hitLayers });
        if (hit.length === 0) onMapBackgroundClick();
      });
    };

    if (map.current.loaded()) {
      ensureLayers();
    } else {
      map.current.on('load', ensureLayers);
    }
  }, [clusterPoints, onClusterPointClick, onMapBackgroundClick, clusterMode, pointsMinZoom, applyPointFilter, applyPointColor]);

  // Track the selected point's screen position (for a floating overlay card) as the map moves.
  // Writes directly to the DOM instead of React state -- 'move' fires on every animation frame
  // during a drag/zoom, and routing that through setState re-rendered the whole overlay subtree
  // 60x/sec, which is what made panning/zooming laggy whenever a card was open.
  useLayoutEffect(() => {
    if (!map.current || !selectedPointId || !clusterPoints) return;
    const point = clusterPoints.find(([id]) => id === selectedPointId);
    if (!point) return;
    const [, lng, lat] = point;

    const updatePos = () => {
      if (!map.current || !overlayRef.current) return;
      const { x, y } = map.current.project([lng, lat]);
      overlayRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    updatePos();
    map.current.on('move', updatePos);
    return () => { map.current?.off('move', updatePos); };
  }, [selectedPointId, clusterPoints]);

  // Mark the selected cluster point's feature-state so the paint expressions above can
  // render it darker/larger. Feature-state persists across setData as long as ids match, so
  // this only needs to react to selectedPointId actually changing, not every data refresh.
  useEffect(() => {
    if (!map.current || !map.current.getSource('installations')) return;
    const prev = selectedPointIdRef.current;
    if (prev !== null && prev !== selectedPointId) {
      map.current.setFeatureState({ source: 'installations', id: prev }, { selected: false });
    }
    if (selectedPointId) {
      map.current.setFeatureState({ source: 'installations', id: selectedPointId }, { selected: true });
    }
    selectedPointIdRef.current = selectedPointId ?? null;
  }, [selectedPointId, clusterPoints]);


  // Handle marker rendering
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    if (!map.current) return;

    const renderMarkers = () => {
      if (!map.current) return;
      console.log('Rendering markers on map:', markers.length);

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      markers.forEach(({ coordinates, title, address, capacity, programType, installDate, id, color = '#22c55e' }) => {
        // Container element (Mapbox positions this element via CSS transform)
        const el = document.createElement('div');
        el.className = 'marker-container';
        const isTargetProperty = id === 'target-property';
        const containerSize = isTargetProperty ? '32px' : '14px';
        el.style.width = containerSize;
        el.style.height = containerSize;
        el.style.cursor = 'pointer';

        if (isTargetProperty) {
          // Pulsing ring for target property
          const pulse = document.createElement('div');
          pulse.style.position = 'absolute';
          pulse.style.inset = '0';
          pulse.style.borderRadius = '50%';
          pulse.style.border = '3px solid #ef4444';
          pulse.style.animation = 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite';
          pulse.style.opacity = '0.6';
          el.appendChild(pulse);
        }

        // Inner dot (we scale this so we don't override Mapbox's translate transform)
        const dot = document.createElement('div');
        dot.className = 'marker';
        dot.style.backgroundColor = color;
        const markerSize = isTargetProperty ? '32px' : '14px';
        dot.style.width = markerSize;
        dot.style.height = markerSize;
        dot.style.borderRadius = '50%';
        dot.style.border = isTargetProperty ? '4px solid white' : '2px solid white';
        dot.style.boxShadow = isTargetProperty ? '0 3px 8px rgba(239,68,68,0.5)' : '0 2px 4px rgba(0,0,0,0.3)';
        dot.style.transition = 'transform 0.2s';
        if (isTargetProperty) {
          el.style.zIndex = '10';
          dot.style.position = 'relative';
        }
        el.appendChild(dot);
        
        el.addEventListener('mouseenter', () => {
          dot.style.transform = 'scale(1.3)';
          el.style.zIndex = '1000';
        });
        
        el.addEventListener('mouseleave', () => {
          dot.style.transform = 'scale(1)';
          el.style.zIndex = 'auto';
        });

        // Prefer meaningful titles and avoid generic numbered labels
        const computedTitle =
          (title && !/^Solar Installation\b/i.test(title) ? title : '') ||
          address ||
          (programType ? `${programType}${capacity ? ` • ${capacity}` : ''}` : '') ||
          (capacity ? `Installed Capacity: ${capacity}` : 'Installation');

        const popupContent = `
          <div style="padding: 12px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: 700; margin: 0 0 8px 0; font-size: 16px; color: #1a1a1a;">${computedTitle}</h3>
            ${address && computedTitle !== address ? `
              <div style="display: flex; align-items: start; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-top: 2px; flex-shrink: 0; color: #666;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">${address}</p>
              </div>
            ` : ''}
            ${capacity ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Capacity:</strong> ${capacity}</p>
              </div>
            ` : ''}
            ${programType ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;">${programType}</p>
              </div>
            ` : ''}
            ${installDate ? `
              <div style="display: flex; align-items: center; margin-bottom: 6px; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; color: #666;">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Date:</strong> ${new Date(installDate).toLocaleDateString()}</p>
              </div>
            ` : ''}
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '350px'
        }).setHTML(popupContent);

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    };

    // Ensure markers render after map loads
    if (map.current.loaded()) {
      renderMarkers();
    } else {
      const onLoad = () => renderMarkers();
      map.current.once('load', onLoad);
    }

    // Listen for custom marker click events
    const handleMarkerClick = (e: any) => {
      if (onMarkerClick) {
        onMarkerClick(e.detail);
      }
    };

    window.addEventListener('marker-click', handleMarkerClick);

    return () => {
      window.removeEventListener('marker-click', handleMarkerClick);
    };
  }, [markers, onMarkerClick]);

  // Auto-fit bounds to markers (disabled when dynamic loading is enabled)
  useEffect(() => {
    if (!map.current || !markers || markers.length === 0) return;

    // When dynamic loading is on, only fit if the caller explicitly bumped fitMarkersKey
    // (and only once per key change — don't refit on every marker reload).
    if (enableDynamicLoading) {
      if (fitMarkersKey === undefined || lastFitKeyRef.current === fitMarkersKey) return;
      lastFitKeyRef.current = fitMarkersKey;
    }

    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(({ coordinates }) => bounds.extend(coordinates));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 800 });
    } else if (markers.length === 1) {
      map.current.flyTo({ center: markers[0].coordinates, zoom: 14 });
    }
  }, [markers, enableDynamicLoading, fitMarkersKey]);

  // Auto-fit bounds to cluster points (once on first load)
  const didFitClusterRef = useRef(false);
  useEffect(() => {
    if (disableClusterAutoFit) return;
    if (!map.current || !clusterPoints || clusterPoints.length === 0) return;
    if (didFitClusterRef.current) return;

    const doFit = () => {
      if (!map.current || !clusterPoints || clusterPoints.length === 0) return;
      const bounds = new mapboxgl.LngLatBounds();
      clusterPoints.forEach(([, lng, lat]) => bounds.extend([lng, lat]));
      map.current.fitBounds(bounds, { padding: 20, duration: 0 });
      didFitClusterRef.current = true;
    };

    if (map.current.loaded()) doFit();
    else map.current.once('load', doFit);
  }, [clusterPoints, disableClusterAutoFit]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      {isLoadingMapData && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm font-medium">Loading installations...</span>
          </div>
        </div>
      )}
      {showLegend && (clusterPoints && clusterPoints.length > 0) && (
        <div className="absolute bottom-8 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 border border-border">
          {legendContent ?? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] border border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Residential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb] border border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Commercial</span>
              </div>
            </div>
          )}
        </div>
      )}
      {selectedPointId && renderPointOverlay && (
        // pointer-events-none on the wrapper (re-enabled only on the actual card via
        // pointer-events-auto below) so this positioning wrapper never blocks clicks to the map
        // underneath -- without it, clicking a nearby dot (or empty map) anywhere within this
        // div's layout box did nothing, since the click never reached Mapbox's own canvas
        // click handlers at all.
        <div ref={overlayRef} className="absolute top-0 left-0 z-30 pointer-events-none">
          <div style={{ transform: 'translate(-50%, calc(-100% - 16px))' }} className="pointer-events-auto inline-block">
            {renderPointOverlay(selectedPointId)}
          </div>
        </div>
      )}
      {showLegend && !clusterPoints && markers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 border border-border">
          
          <div className="space-y-2">
            {markers.some(m => m.source === 'existing' || m.color === '#22c55e') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Residential Installations</span>
              </div>
            )}
            {markers.some(m => m.color === '#2563eb') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Commercial Installations</span>
              </div>
            )}
            {markers.some(m => m.source === 'api' || m.color === '#f59e0b') && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Pending Permits (last 180 days)</span>
              </div>
            )}
            {markers.some(m => m.source === 'target' || m.id === 'target-property') && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow-sm"></div>
                <span className="text-xs text-muted-foreground">Your Property</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
