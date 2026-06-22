import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapTokenLoader from "@/components/MapTokenLoader";

interface Props {
  lat: number;
  lon: number;
  className?: string;
}

function SatelliteMap({ lat, lon }: { lat: number; lon: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    markerRef.current = new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([lon, lat]).addTo(map);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    mapRef.current?.jumpTo({ center: [lon, lat], zoom: 18 });
    markerRef.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  return <div ref={containerRef} className="w-full h-full" />;
}

export default function SatellitePane({ lat, lon, className = "w-full h-64 rounded-lg overflow-hidden border border-border" }: Props) {
  return (
    <div className={className}>
      <MapTokenLoader>
        <SatelliteMap lat={lat} lon={lon} />
      </MapTokenLoader>
    </div>
  );
}
