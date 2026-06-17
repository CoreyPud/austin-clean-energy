import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SOUTH = 25.5, NORTH = 36.7, WEST = -106.8, EAST = -93.4;

const CF: Record<string, number> = {
  coal: 0.65, oil: 0.30, gas: 0.45, biomass: 0.55, hydro: 0.45,
  nuclear: 0.92, wind: 0.35, solar: 0.20, storage: 0.10, other: 0.35,
};

const FUEL_COLORS: Record<string, string> = {
  coal: "#991b1b", oil: "#dc2626", gas: "#d97706", biomass: "#a16207",
  nuclear: "#166534", hydro: "#0d9488", wind: "#16a34a", solar: "#4ade80",
  storage: "#7c3aed", other: "#6b7280",
};

const CIRC_MIN = 2.5, CIRC_MAX = 12;

export interface Plant {
  id: number;
  name: string;
  lat: number;
  lon: number;
  fuel: string;
  cap_mw: number | null;
  avg_output_mw: number | null;
  owner: string;
  commission_month: string | null;
  retirement_year: number | null;
  co2_tons: number | null;
}

export type PlantGen = Record<string, number>;

function buildGeoJSON(
  plants: Plant[],
  monthKey: string,
  aeOnly: boolean,
  aePct: Record<string, number>,
  plantGen: PlantGen | null,
): GeoJSON.FeatureCollection {
  const year = parseInt(monthKey.slice(0, 4), 10);

  const mwForMonth = (p: Plant): number => {
    const v = plantGen?.[String(p.id)];
    if (v != null && v > 0) return v;
    return p.avg_output_mw ?? (p.cap_mw ? p.cap_mw * (CF[p.fuel] ?? 0.35) : 0);
  };

  const timeActive = plants.filter(p =>
    (!p.commission_month || p.commission_month <= monthKey) &&
    (!p.retirement_year  || p.retirement_year  >  year)
  );
  const allMw   = timeActive.map(mwForMonth).filter(v => v > 0);
  const mwMin   = allMw.length ? Math.min(...allMw) : 0;
  const mwRange = allMw.length > 1 ? Math.max(...allMw) - mwMin : 1;

  const active = timeActive.filter(p => !aeOnly || aePct[String(p.id)] != null);

  return {
    type: "FeatureCollection",
    features: active.map(p => {
      const mw     = mwForMonth(p);
      const t      = mw > 0 ? Math.max(0, Math.min(1, (mw - mwMin) / mwRange)) : 0;
      const radius = CIRC_MIN + Math.sqrt(t) * (CIRC_MAX - CIRC_MIN);

      const actualMw = plantGen?.[String(p.id)] ?? null;
      let popup = `<b>${p.name}</b><br>Fuel: ${p.fuel}`;
      if (p.cap_mw)         popup += `<br>Nameplate: ${Math.round(p.cap_mw)} MW`;
      if (actualMw != null) popup += `<br>${monthKey.replace("_", " ")} output: ${Math.round(actualMw)} MW`;
      else if (p.avg_output_mw) popup += `<br>Avg output: ${Math.round(p.avg_output_mw)} MW`;
      if (p.owner)          popup += `<br>Owner: ${p.owner}`;
      if (p.co2_tons)       popup += `<br>Est CO₂: ${p.co2_tons.toLocaleString()} t/yr`;

      const dispMw = actualMw ?? p.avg_output_mw ?? p.cap_mw;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: {
          radius,
          color: FUEL_COLORS[p.fuel] ?? "#6b7280",
          popup,
          tooltip: `${p.name} (${p.fuel}${dispMw ? `, ${Math.round(dispMw)} MW` : ""})`,
        },
      } as GeoJSON.Feature;
    }),
  };
}

interface Props {
  monthKey:  string;
  plants:    Plant[];
  aeOnly:    boolean;
  aePct:     Record<string, number>;
  plantGen:  PlantGen | null;
  height?:   number;
}

export function No2Map({ monthKey, plants, aeOnly, aePct, plantGen, height = 540 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const loadedRef    = useRef(false);

  const monthKeyRef = useRef(monthKey);
  const aeOnlyRef   = useRef(aeOnly);
  const plantsRef   = useRef(plants);
  const aePctRef    = useRef(aePct);
  const plantGenRef = useRef(plantGen);
  monthKeyRef.current = monthKey;
  aeOnlyRef.current   = aeOnly;
  plantsRef.current   = plants;
  aePctRef.current    = aePct;
  plantGenRef.current = plantGen;

  const applyState = (map: mapboxgl.Map, mk: string) => {
    const plantSrc = map.getSource("plants") as mapboxgl.GeoJSONSource | undefined;
    if (plantSrc) {
      plantSrc.setData(buildGeoJSON(
        plantsRef.current, mk,
        aeOnlyRef.current, aePctRef.current, plantGenRef.current,
      ));
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const token = (window as any).MAPBOX_TOKEN;
    if (!token) return;
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      cooperativeGestures: true,
      bounds: [[WEST, SOUTH], [EAST, NORTH]],
      fitBoundsOptions: { padding: 8 },
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.on("load", () => {
      const initKey = monthKeyRef.current;

      map.addSource("plants", {
        type: "geojson",
        data: buildGeoJSON(
          plantsRef.current, initKey,
          aeOnlyRef.current, aePctRef.current, plantGenRef.current,
        ),
      });
      map.addLayer({
        id: "plants-layer",
        type: "circle",
        source: "plants",
        paint: {
          "circle-radius":       ["get", "radius"],
          "circle-color":        ["get", "color"],
          "circle-opacity":      0.9,
          "circle-stroke-width": 1,
          "circle-stroke-color": "white",
        },
      });

      const clickPopup = new mapboxgl.Popup({ closeButton: true,  maxWidth: "220px" });
      const hoverPopup = new mapboxgl.Popup({ closeButton: false, maxWidth: "220px", offset: 8 });

      map.on("click", "plants-layer", e => {
        const f = e.features?.[0];
        if (!f) return;
        hoverPopup.remove();
        clickPopup
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(f.properties!.popup)
          .addTo(map);
      });
      map.on("mouseenter", "plants-layer", e => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        hoverPopup
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setText(f.properties!.tooltip)
          .addTo(map);
      });
      map.on("mouseleave", "plants-layer", () => {
        map.getCanvas().style.cursor = "";
        hoverPopup.remove();
      });

      loadedRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); loadedRef.current = false; };
  }, []);

  useEffect(() => {
    if (loadedRef.current && mapRef.current) applyState(mapRef.current, monthKey);
  }, [monthKey, aeOnly, plants.length, plantGen]);

  return (
    <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-b-lg" />
  );
}
