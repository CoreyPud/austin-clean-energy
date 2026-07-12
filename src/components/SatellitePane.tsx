import { useEffect, useLayoutEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapTokenLoader from "@/components/MapTokenLoader";

export interface SolarPanel {
  lat: number;
  lon: number;
  orientation: "LANDSCAPE" | "PORTRAIT";
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

interface Props {
  lat: number;
  lon: number;
  className?: string;
  panels?: SolarPanel[];
  panelHeightM?: number;
  panelWidthM?: number;
  segmentAzimuths?: Record<number, number>;
  segmentPitches?: Record<number, number>;
}

const AUSTIN_REF_HRS = 1950;
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

interface MapProps extends Omit<Props, "className"> {
  panelOpacity: number;
}

function SatelliteMap({ lat, lon, panels, panelHeightM = 1.0, panelWidthM = 1.65, segmentAzimuths = {}, segmentPitches = {}, panelOpacity }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);
  const popupRef     = useRef<mapboxgl.Popup | null>(null);

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
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useLayoutEffect(() => {
    if (!panels?.length) return;
    if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
  }, [panels, segmentAzimuths]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !panels?.length) return;

    const halfH = panelHeightM / 2 * 0.95;
    const halfW = panelWidthM / 2 * 0.95;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: panels.map((p, i) => {
        const az = segmentAzimuths[p.segmentIndex] ?? 180;
        const pitch = segmentPitches[p.segmentIndex] ?? 20;
        const tsrf = p.yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS);
        const coords = panelPolygon(p.lat, p.lon, halfH * Math.cos(pitch * RAD), halfW, az, p.orientation === "LANDSCAPE");
        return {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
          properties: { id: i, tsrf },
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
      const el = containerRef.current;
      const boxW = (Math.max(...lons) - Math.min(...lons)) * mPerDegLon;
      const boxH = (Math.max(...lats) - Math.min(...lats)) * M_PER_DEG_LAT;
      const diag = Math.sqrt(boxW ** 2 + boxH ** 2);
      const t = Math.max(0, Math.min(1, (diag - 20) / (100 - 20)));
      const padFrac = 0.25 - t * 0.15; // 25% for small residential → 10% for large commercial
      const padX = el ? el.clientWidth  * padFrac : 80;
      const padY = el ? el.clientHeight * padFrac : 80;
      map.fitBounds(bounds, { padding: { top: padY, bottom: padY, left: padX, right: padX }, animate: false });
      if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
    };

    const addLayers = () => {
      if (map.getSource("panels")) {
        (map.getSource("panels") as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource("panels", { type: "geojson", data: geojson });
        map.addLayer({
          id: "panels-fill",
          type: "fill",
          source: "panels",
          paint: {
            "fill-color": ["interpolate", ["linear"], ["get", "tsrf"], 0.6, "#f59e0b", 1.0, "#22c55e"],
            "fill-opacity": panelOpacity,
          },
        });
        map.addLayer({
          id: "panels-outline",
          type: "line",
          source: "panels",
          paint: { "line-color": "#000", "line-opacity": 0.3, "line-width": 0.5 },
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
      fitView();
    };

    if (map.isStyleLoaded()) addLayers();
    else map.once("load", addLayers);
  }, [panels, panelHeightM, panelWidthM, segmentAzimuths]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("panels-fill")) return;
    map.setPaintProperty("panels-fill", "fill-opacity", panelOpacity);
  }, [panelOpacity]);

  useEffect(() => {
    if (panels?.length) return;
    mapRef.current?.jumpTo({ center: [lon, lat], zoom: 18 });
    markerRef.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default function SatellitePane({ lat, lon, className = "w-full h-64 rounded-lg overflow-hidden border border-border", panels, panelHeightM, panelWidthM, segmentAzimuths, segmentPitches }: Props) {
  const [panelOpacity, setPanelOpacity] = useState(0.7);

  return (
    <div className={`${className} relative`}>
      <MapTokenLoader>
        <SatelliteMap
          lat={lat} lon={lon}
          panels={panels} panelHeightM={panelHeightM} panelWidthM={panelWidthM}
          segmentAzimuths={segmentAzimuths} segmentPitches={segmentPitches} panelOpacity={panelOpacity}
        />
      </MapTokenLoader>
      {panels?.length ? (
        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 pointer-events-none">
          <div className="flex-1 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-auto">
            <span className="text-white/70 text-xs select-none shrink-0">Panels</span>
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={panelOpacity}
              onChange={e => setPanelOpacity(+e.target.value)}
              className="w-full h-1 accent-white cursor-pointer"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
