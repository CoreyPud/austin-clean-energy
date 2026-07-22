import { useEffect, useLayoutEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapTokenLoader from "@/components/MapTokenLoader";

// Defined in the filter lib (which must stay import-free so scripts can load it);
// re-exported here since components already import the type from this module.
import type { SolarPanel } from "@/lib/solar-filters";
export type { SolarPanel };

interface LatLon { lat: number; lon: number }

interface Props {
  lat: number;
  lon: number;
  className?: string;
  panels?: SolarPanel[];
  walkwayPanels?: SolarPanel[];
  debugHoles?: LatLon[];
  edgeSegments?: LatLon[][];
  panelHeightM?: number;
  panelWidthM?: number;
  segmentAzimuths?: Record<number, number>;
  segmentPitches?: Record<number, number>;
  selectedPanelCount?: number;
  fitKey?: string | number;
}

const AUSTIN_REF_HRS = 1950;
const PANEL_OPACITY = 0.9;
const PANEL_LAYERS = ["panels-fill", "panels-outline", "walkways-fill", "walkways-outline"];
const RAD = Math.PI / 180;
const M_PER_DEG_LAT = 111320;

function panelPolygon(
  lat: number, lon: number,
  halfH: number, halfW: number,
  azimuthDeg: number,
  isLandscape: boolean,
): [number, number][] {
  const mPerDegLon = M_PER_DEG_LAT * Math.cos(lat * RAD);
  const az = azimuthDeg * RAD;
  const ax = Math.sin(az), ay = Math.cos(az);
  const px = -ay, py = ax;
  const [longH, longW] = isLandscape ? [halfW, halfH] : [halfH, halfW];
  const corners: [number, number][] = [
    [ ax * longH + px * longW,  ay * longH + py * longW],
    [ ax * longH - px * longW,  ay * longH - py * longW],
    [-ax * longH - px * longW, -ay * longH - py * longW],
    [-ax * longH + px * longW, -ay * longH + py * longW],
  ];
  return corners.map(([dx, dy]) => [
    lon + dx / mPerDegLon,
    lat + dy / M_PER_DEG_LAT,
  ]);
}

function fillOpacityExpr(opacity: number, hasFilter: boolean): any {
  if (!hasFilter) return opacity;
  return ["case", ["boolean", ["get", "selected"], true], opacity, Math.max(0.07, opacity * 0.18)];
}

interface MapProps extends Omit<Props, "className"> {
  panelsVisible: boolean;
}

function SatelliteMap({
  lat, lon, panels, walkwayPanels, debugHoles, edgeSegments, panelHeightM = 1.0, panelWidthM = 1.65,
  segmentAzimuths = {}, segmentPitches = {}, panelsVisible, selectedPanelCount, fitKey,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);
  const popupRef     = useRef<mapboxgl.Popup | null>(null);

  // panelsRef: tracks loading state (undefined = loading). fitKeyRef + azimuthsRef drive refit.
  const panelsRef    = useRef<SolarPanel[] | undefined>(undefined);
  const azimuthsRef  = useRef<Record<number, number>>({});
  const fitKeyRef    = useRef<string | number | undefined>(undefined);
  // Refs so the visibility effect can rebuild the correct opacity expression
  const selCountRef  = useRef<number | undefined>(selectedPanelCount);
  const panelsLenRef = useRef<number>(panels?.length ?? 0);

  useEffect(() => { selCountRef.current  = selectedPanelCount; }, [selectedPanelCount]);
  useEffect(() => { panelsLenRef.current = panels?.length ?? 0; }, [panels]);

  useEffect(() => {
    if (!containerRef.current) return;
    const token = (window as any).MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [lon, lat],
      zoom: 18,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    if (!panels?.length) {
      markerRef.current = new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([lon, lat]).addTo(map);
    }
    // Auto-resize Mapbox canvas whenever the CSS container is resized (e.g., panel drag)
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useLayoutEffect(() => {
    if (!panels?.length) return;
    if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
  }, [panels, segmentAzimuths]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (panels === undefined) {
      // Loading state — hide map and clear stale overlay.
      // Only hide if we had panels before (avoids hiding on initial no-panel mount).
      if (panelsRef.current !== undefined && wrapperRef.current) {
        wrapperRef.current.style.opacity = "0";
      }
      const clearSource = () => {
        if (map.getSource("panels")) {
          (map.getSource("panels") as mapboxgl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
        }
      };
      if (map.isStyleLoaded()) clearSource();
      else map.once("load", clearSource);
      // Don't update panelsRef — keep previous value so next non-undefined panels trigger shouldFit
      return;
    }

    if (panels.length === 0) {
      // Confirmed no panels — show satellite with marker at property location
      const show = () => {
        if (map.getSource("panels")) {
          (map.getSource("panels") as mapboxgl.GeoJSONSource).setData({ type: "FeatureCollection", features: [] });
        }
        if (markerRef.current) {
          markerRef.current.setLngLat([lon, lat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([lon, lat]).addTo(map);
        }
        map.jumpTo({ center: [lon, lat], zoom: 18 });
        if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
      };
      if (map.isStyleLoaded()) show();
      else map.once("load", show);
      panelsRef.current = panels;
      return;
    }

    // Has panels — remove marker
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }

    // Refit only when the property/data changes (fitKey), not when the filter toggles
    const fitKeyChanged   = fitKey !== fitKeyRef.current;
    const azimuthsChanged = segmentAzimuths !== azimuthsRef.current;
    panelsRef.current   = panels;
    azimuthsRef.current = segmentAzimuths;
    fitKeyRef.current   = fitKey;
    const shouldFit = fitKeyChanged || azimuthsChanged;

    const halfH = panelHeightM / 2 * 0.95;
    const halfW = panelWidthM / 2 * 0.95;

    // Selection order: greedy proximity growth through ≥80% TSRF panels (seed = northernmost),
    // then <80% TSRF panels by production % descending.
    // Proximity growth ensures contiguous patches — distant sections aren't jumped to until nearby ones are full.
    const TSRF_THRESH = 0.80;
    const withMeta = panels.map((p, i) => ({
      i, lat: p.lat, lon: p.lon,
      tsrf: p.yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS),
    }));

    const highQ = withMeta.filter(x => x.tsrf >= TSRF_THRESH);
    const lowQ  = withMeta.filter(x => x.tsrf <  TSRF_THRESH).sort((a, b) => b.tsrf - a.tsrf);

    // Greedy nearest-neighbour through ≥80% panels; seed from northernmost
    const greedyOrder: typeof withMeta = [];
    if (highQ.length > 0) {
      const remaining = new Set(highQ.map(x => x.i));
      const seed = highQ.reduce((best, x) => x.lat > best.lat || (x.lat === best.lat && x.lon < best.lon) ? x : best);
      const minDist = new Float64Array(panels.length).fill(Infinity);

      const grow = (p: typeof withMeta[0]) => {
        greedyOrder.push(p);
        remaining.delete(p.i);
        for (const ri of remaining) {
          const r = withMeta[ri];
          const d2 = (r.lat - p.lat) ** 2 + (r.lon - p.lon) ** 2;
          if (d2 < minDist[ri]) minDist[ri] = d2;
        }
      };

      grow(seed);
      while (remaining.size > 0) {
        let bestI = -1, bestD = Infinity;
        for (const ri of remaining) { if (minDist[ri] < bestD) { bestD = minDist[ri]; bestI = ri; } }
        if (bestI === -1) break;
        grow(withMeta[bestI]);
      }
    }

    const nSel = selectedPanelCount ?? panels.length;
    const selectedSet = new Set([...greedyOrder, ...lowQ].slice(0, Math.min(nSel, panels.length)).map(x => x.i));
    const hasFilter = selectedPanelCount != null && selectedPanelCount < panels.length;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: panels.map((p, i) => {
        const az    = segmentAzimuths[p.segmentIndex] ?? 180;
        const pitch = segmentPitches[p.segmentIndex] ?? 20;
        const tsrf  = p.yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS);
        const coords = panelPolygon(p.lat, p.lon, halfH * Math.cos(pitch * RAD), halfW, az, p.orientation === "LANDSCAPE");
        return {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
          properties: { id: i, tsrf, selected: selectedSet.has(i) },
        };
      }),
    };

    const lats = panels.map(p => p.lat);
    const lons = panels.map(p => p.lon);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const mPerDegLon = M_PER_DEG_LAT * Math.cos(midLat * RAD);
    const dLat = halfH / M_PER_DEG_LAT;
    const dLon = halfW / mPerDegLon;
    const bounds: mapboxgl.LngLatBoundsLike = [
      [Math.min(...lons) - dLon, Math.min(...lats) - dLat],
      [Math.max(...lons) + dLon, Math.max(...lats) + dLat],
    ];

    const fitView = () => {
      try {
        const el = containerRef.current;
        const boxW = (Math.max(...lons) - Math.min(...lons)) * mPerDegLon;
        const boxH = (Math.max(...lats) - Math.min(...lats)) * M_PER_DEG_LAT;
        const diag = Math.sqrt(boxW ** 2 + boxH ** 2);
        const t = Math.max(0, Math.min(1, (diag - 20) / (100 - 20)));
        const padFrac = 0.25 - t * 0.15;
        const padX = el ? el.clientWidth  * padFrac : 80;
        const padY = el ? el.clientHeight * padFrac : 80;
        map.fitBounds(bounds, { padding: { top: padY, bottom: padY, left: padX, right: padX }, animate: false });
      } finally {
        if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
      }
    };

    const opacityExpr = fillOpacityExpr(PANEL_OPACITY, hasFilter);

    // Walkway GeoJSON (gray tiles for removed walkway panels)
    const walkwayGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: (walkwayPanels ?? []).map((p) => {
        const az    = segmentAzimuths[p.segmentIndex] ?? 180;
        const pitch = segmentPitches[p.segmentIndex] ?? 0;
        const coords = panelPolygon(p.lat, p.lon, halfH * Math.cos(pitch * RAD), halfW, az, p.orientation === "LANDSCAPE");
        return {
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [[...coords, coords[0]]] },
          properties: {},
        };
      }),
    };

    // Debug holes — red dots at interior hole cell centres
    const debugGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: (debugHoles ?? []).map(h => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [h.lon, h.lat] },
        properties: {},
      })),
    };

    // Detected roof edge — dashed orange polyline along the panel/open-space boundary
    const hullGeojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: (edgeSegments ?? []).length
        ? [{
            type: "Feature" as const,
            geometry: {
              type: "MultiLineString" as const,
              coordinates: (edgeSegments ?? []).map(seg => seg.map(p => [p.lon, p.lat] as [number, number])),
            },
            properties: {},
          }]
        : [],
    };

    const addLayers = () => {
      if (map.getSource("panels")) {
        (map.getSource("panels") as mapboxgl.GeoJSONSource).setData(geojson);
        if (map.getLayer("panels-fill")) {
          map.setPaintProperty("panels-fill", "fill-opacity", opacityExpr);
        }
        if (map.getSource("walkways")) {
          (map.getSource("walkways") as mapboxgl.GeoJSONSource).setData(walkwayGeojson);
        }
        if (map.getSource("debug-holes")) {
          (map.getSource("debug-holes") as mapboxgl.GeoJSONSource).setData(debugGeojson);
        }
        if (map.getSource("hull-outline")) {
          (map.getSource("hull-outline") as mapboxgl.GeoJSONSource).setData(hullGeojson);
        }
      } else {
        map.addSource("panels", { type: "geojson", data: geojson });
        map.addLayer({
          id: "panels-fill",
          type: "fill",
          source: "panels",
          paint: {
            "fill-color": ["interpolate", ["linear"], ["get", "tsrf"], 0.6, "#f59e0b", 1.0, "#22c55e"],
            "fill-opacity": opacityExpr,
          },
        });
        map.addLayer({
          id: "panels-outline",
          type: "line",
          source: "panels",
          paint: { "line-color": "#000", "line-opacity": 0.3, "line-width": 0.5 },
        });

        // Walkway layer (always created; empty when no walkways active)
        map.addSource("walkways", { type: "geojson", data: walkwayGeojson });
        map.addLayer({
          id: "walkways-fill",
          type: "fill",
          source: "walkways",
          paint: { "fill-color": "#e5e7eb", "fill-opacity": 0.75 },
        });
        map.addLayer({
          id: "walkways-outline",
          type: "line",
          source: "walkways",
          paint: { "line-color": "#6b7280", "line-opacity": 0.6, "line-width": 0.5 },
        });

        // Hull outline (dashed orange polygon)
        map.addSource("hull-outline", { type: "geojson", data: hullGeojson });
        map.addLayer({
          id: "hull-line",
          type: "line",
          source: "hull-outline",
          paint: { "line-color": "#f97316", "line-width": 2, "line-dasharray": [4, 3], "line-opacity": 0.9 },
        });

        // Debug holes (red circles)
        map.addSource("debug-holes", { type: "geojson", data: debugGeojson });
        map.addLayer({
          id: "debug-holes-circles",
          type: "circle",
          source: "debug-holes",
          paint: {
            "circle-radius": 5,
            "circle-color": "#ef4444",
            "circle-opacity": 0.6,
            "circle-stroke-color": "#991b1b",
            "circle-stroke-width": 1,
            "circle-stroke-opacity": 0.9,
          },
        });

        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 8 });

        map.on("mouseenter", "panels-fill", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const tsrf = e.features?.[0]?.properties?.tsrf;
          if (tsrf == null) return;
          popupRef.current!
            .setLngLat(e.lngLat)
            .setHTML(`<strong style="font-size:13px">${Math.round(tsrf * 100)}% of optimal</strong>`)
            .addTo(map);
        });
        map.on("mousemove", "panels-fill", (e) => {
          popupRef.current?.setLngLat(e.lngLat);
        });
        map.on("mouseleave", "panels-fill", () => {
          map.getCanvas().style.cursor = "";
          popupRef.current?.remove();
        });
      }
      if (shouldFit) fitView();
      else if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
    };

    if (map.isStyleLoaded()) addLayers();
    else map.once("load", addLayers);
  }, [panels, walkwayPanels, debugHoles, edgeSegments, panelHeightM, panelWidthM, segmentAzimuths, selectedPanelCount]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("panels-fill")) return;
    const vis = panelsVisible ? "visible" : "none";
    for (const id of PANEL_LAYERS) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
    }
    if (!panelsVisible) popupRef.current?.remove();
  }, [panelsVisible]);

  useEffect(() => {
    if (panels === undefined || panels.length > 0) return;
    mapRef.current?.jumpTo({ center: [lon, lat], zoom: 18 });
    markerRef.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default function SatellitePane({
  lat, lon,
  className = "w-full h-64 rounded-lg overflow-hidden border border-border",
  panels, walkwayPanels, debugHoles, edgeSegments, panelHeightM, panelWidthM,
  segmentAzimuths, segmentPitches, selectedPanelCount, fitKey,
}: Props) {
  const [panelsVisible, setPanelsVisible] = useState(true);

  return (
    <div className={`${className} relative`}>
      <MapTokenLoader>
        <SatelliteMap
          lat={lat} lon={lon}
          panels={panels} walkwayPanels={walkwayPanels}
          debugHoles={debugHoles} edgeSegments={edgeSegments}
          panelHeightM={panelHeightM} panelWidthM={panelWidthM}
          segmentAzimuths={segmentAzimuths} segmentPitches={segmentPitches}
          panelsVisible={panelsVisible} selectedPanelCount={selectedPanelCount}
          fitKey={fitKey}
        />
      </MapTokenLoader>
      {panels?.length ? (
        <div className="absolute bottom-2 left-3 flex items-center gap-2 pointer-events-none">
          <label className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-auto cursor-pointer">
            <input
              type="checkbox"
              checked={panelsVisible}
              onChange={e => setPanelsVisible(e.target.checked)}
              className="rounded accent-white cursor-pointer"
            />
            <span className="text-white/80 text-xs select-none">Panels</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
