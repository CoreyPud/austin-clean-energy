import { useEffect, useLayoutEffect, useRef } from "react";
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

function SatelliteMap({ lat, lon, panels, panelHeightM = 1.0, panelWidthM = 1.65, segmentAzimuths = {} }: Omit<Props, "className">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markerRef    = useRef<mapboxgl.Marker | null>(null);

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

  // Hide before paint whenever panels change so we never show the pre-fitBounds view
  useLayoutEffect(() => {
    if (!panels?.length) return;
    if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
  }, [panels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !panels?.length) return;

    const halfH = panelHeightM / 2;
    const halfW = panelWidthM / 2;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: panels.map((p, i) => {
        const az = segmentAzimuths[p.segmentIndex] ?? 180;
        const tsrf = p.yearlyEnergyDcKwh / (0.4 * AUSTIN_REF_HRS);
        const coords = panelPolygon(p.lat, p.lon, halfH, halfW, az, p.orientation === "LANDSCAPE");
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
      const padX = el ? el.clientWidth  * 0.25 : 80;
      const padY = el ? el.clientHeight * 0.25 : 80;
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
            "fill-opacity": 0.7,
          },
        });
        map.addLayer({
          id: "panels-outline",
          type: "line",
          source: "panels",
          paint: { "line-color": "#000", "line-opacity": 0.3, "line-width": 0.5 },
        });
      }
      fitView();
    };

    if (map.isStyleLoaded()) addLayers();
    else map.once("load", addLayers);
  }, [panels, panelHeightM, panelWidthM, segmentAzimuths]);

  useEffect(() => {
    if (panels?.length) return; // let fitBounds control view when panels present
    mapRef.current?.jumpTo({ center: [lon, lat], zoom: 18 });
    markerRef.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default function SatellitePane({ lat, lon, className = "w-full h-64 rounded-lg overflow-hidden border border-border", panels, panelHeightM, panelWidthM, segmentAzimuths }: Props) {
  return (
    <div className={className}>
      <MapTokenLoader>
        <SatelliteMap lat={lat} lon={lon} panels={panels} panelHeightM={panelHeightM} panelWidthM={panelWidthM} segmentAzimuths={segmentAzimuths} />
      </MapTokenLoader>
    </div>
  );
}
