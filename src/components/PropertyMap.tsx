import { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface PropertyPoint {
  pid: string;
  address: string | null;
  zip?: string | null;
  lat: number;
  lon: number;
  dist_gas: number | null;
  dist_peaker: number | null;
  property_type: string | null;
  has_solar: boolean | null;
  owner?: string | null;
  year_built?: number | null;
  market_value?: number | null;
  roof_sqft?: number | null;
  land_type_desc?: string | null;
  county?: string | null;
  solar_kw?: number | null;
  solar_permits?: any[];
  solar_fetched_at?: string | null;
  solar_max_panels?: number | null;
  solar_sunshine_median?: number | null;
  solar_max_area_m2?: number | null;
  solar_panel_capacity_w?: number | null;
  solar_imagery_quality?: string | null;
  solar_imagery_date?: string | null;
  solar_eligible_kw?: number | null;
  comment?: string | null;
  roof_type?: string | null;
  optimal_system_size_kw?: number | null;
  owner_contact?: string | null;
  owned_or_rented?: string | null;
}

export interface GasPlantPoint {
  id: number;
  name: string;
  lat: number;
  lon: number;
  capacity_mw: number | null;
}

export interface ProposedSitePoint {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface Props {
  properties: PropertyPoint[];
  gasPlants: GasPlantPoint[];
  proposedSites: ProposedSitePoint[];
  siteCounts?: Record<number, number>;
  plantCounts?: Record<number, number>;
  radiusMi?: number;
  focusPid?: string | null;
  onSelect?: (pid: string) => void;
}

function radiusCircleGeoJSON(
  points: { lat: number; lon: number }[],
  radiusMi: number,
  steps = 64,
): GeoJSON.FeatureCollection {
  const R = 3958.8;
  const features: GeoJSON.Feature[] = points.map(({ lat, lon }) => {
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dLat  = (radiusMi / R) * (180 / Math.PI) * Math.cos(angle);
      const dLon  = (radiusMi / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180) * Math.sin(angle);
      coords.push([lon + dLon, lat + dLat]);
    }
    return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} };
  });
  return { type: "FeatureCollection", features };
}

function toPropertyGeoJSON(properties: PropertyPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: properties.map(p => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lon, p.lat] },
      properties: {
        pid: p.pid,
        address: p.address ?? "No address",
        dist_gas: p.dist_gas,
        dist_peaker: p.dist_peaker,
        property_type: p.property_type ?? "other",
        has_solar: p.has_solar,
      },
    })),
  };
}

function toPointGeoJSON<T extends { lat: number; lon: number }>(
  items: T[],
  propsFn: (item: T) => Record<string, unknown>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map(item => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [item.lon, item.lat] },
      properties: propsFn(item),
    })),
  };
}

export function PropertyMap({ properties, gasPlants, proposedSites, siteCounts, plantCounts, radiusMi = 5, focusPid, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const popupRef     = useRef<mapboxgl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const token = (window as any).MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-97.74, 30.27],
      zoom: 10,
    });
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: "240px" });

    map.on("load", () => {
      // ── Radius circles ──────────────────────────────────────────
      map.addSource("radius-proposed", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "radius-proposed-fill", type: "fill", source: "radius-proposed",
        paint: { "fill-color": "#d97706", "fill-opacity": 0.06 } });
      map.addLayer({ id: "radius-proposed-line", type: "line", source: "radius-proposed",
        paint: { "line-color": "#d97706", "line-width": 1.5, "line-dasharray": [3, 2] } });

      map.addSource("radius-gas", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "radius-gas-fill", type: "fill", source: "radius-gas",
        paint: { "fill-color": "#7f1d1d", "fill-opacity": 0.06 } });
      map.addLayer({ id: "radius-gas-line", type: "line", source: "radius-gas",
        paint: { "line-color": "#7f1d1d", "line-width": 1.5, "line-dasharray": [3, 2] } });

      // ── Selected property highlight ──────────────────────────────
      map.addSource("selected-prop", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "selected-prop-ring", type: "circle", source: "selected-prop",
        paint: { "circle-radius": 12, "circle-color": "transparent", "circle-stroke-width": 3, "circle-stroke-color": "#ffffff" } });
      map.addLayer({ id: "selected-prop-dot",  type: "circle", source: "selected-prop",
        paint: { "circle-radius": 7, "circle-color": "#facc15", "circle-stroke-width": 1.5, "circle-stroke-color": "#78350f" } });

      // ── Properties ──────────────────────────────────────────────
      map.addSource("properties", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "properties-layer",
        type: "circle",
        source: "properties",
        paint: {
          "circle-radius": 4,
          "circle-opacity": 0.85,
          "circle-color": [
            "match", ["get", "property_type"],
            "single_family", "#3b82f6",
            "multifamily",   "#8b5cf6",
            "condo",         "#ec4899",
            "commercial",    "#f97316",
            "#6b7280",
          ],
          "circle-stroke-width": ["case", ["boolean", ["get", "has_solar"], false], 2, 0.5],
          "circle-stroke-color": ["case", ["boolean", ["get", "has_solar"], false], "#facc15", "#ffffff"],
        },
      });

      // ── Existing gas plants ──────────────────────────────────────
      map.addSource("gas-plants", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "gas-plants-circle",
        type: "circle",
        source: "gas-plants",
        paint: {
          "circle-radius": 7,
          "circle-color": "#7f1d1d",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "gas-plants-label",
        type: "symbol",
        source: "gas-plants",
        layout: {
          "text-field": ["get", "short_name"],
          "text-size": 10,
          "text-offset": [0, 2.0],
          "text-anchor": "top",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#7f1d1d",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      // ── Proposed peaker sites ────────────────────────────────────
      map.addSource("proposed-peakers", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "proposed-peakers-circle",
        type: "circle",
        source: "proposed-peakers",
        paint: {
          "circle-radius": 7,
          "circle-color": "#d97706",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "proposed-peakers-count",
        type: "symbol",
        source: "proposed-peakers",
        layout: {
          "text-field": ["get", "count_label"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#92400e",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });
      map.addLayer({
        id: "gas-plants-count",
        type: "symbol",
        source: "gas-plants",
        layout: {
          "text-field": ["get", "count_label"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#7f1d1d",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      // ── Hover: properties ────────────────────────────────────────
      map.on("mouseenter", "properties-layer", e => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        const { address, dist_gas, dist_peaker, property_type } = f.properties as Record<string, any>;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        const dists: { label: string; val: number }[] = [];
        if (dist_peaker != null) dists.push({ label: "Proposed peaker", val: dist_peaker });
        if (dist_gas     != null) dists.push({ label: "Gas plant",       val: dist_gas });
        const nearest = dists.sort((a, b) => a.val - b.val)[0];
        popupRef.current!
          .setLngLat([lng, lat])
          .setHTML(`
            <div style="font-size:12px;line-height:1.5">
              <b>${address}</b><br>
              <span style="color:#6b7280">${property_type ?? "unknown"}</span><br>
              ${nearest ? `${nearest.label}: <b>${nearest.val.toFixed(1)} mi</b>` : ""}
            </div>`)
          .addTo(map);
      });
      map.on("mouseleave", "properties-layer", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current!.remove();
      });
      map.on("click", "properties-layer", e => {
        const pid = e.features?.[0]?.properties?.pid;
        if (pid) onSelect?.(pid);
      });

      // ── Hover: gas plants ────────────────────────────────────────
      map.on("mouseenter", "gas-plants-circle", e => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        const { name, capacity_mw } = f.properties as Record<string, any>;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        popupRef.current!
          .setLngLat([lng, lat])
          .setHTML(`<div style="font-size:12px"><b>${name}</b><br>Existing AE gas plant<br>${capacity_mw ? Math.round(capacity_mw) + " MW nameplate" : ""}</div>`)
          .addTo(map);
      });
      map.on("mouseleave", "gas-plants-circle", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current!.remove();
      });

      // ── Hover: proposed peakers ──────────────────────────────────
      map.on("mouseenter", "proposed-peakers-circle", e => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f) return;
        const { name } = f.properties as Record<string, any>;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        popupRef.current!
          .setLngLat([lng, lat])
          .setHTML(`<div style="font-size:12px"><b>Proposed: ${name}</b><br>AE Phase III shortlist</div>`)
          .addTo(map);
      });
      map.on("mouseleave", "proposed-peakers-circle", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current!.remove();
      });

      setReady(true);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update properties source
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("properties") as mapboxgl.GeoJSONSource | undefined)
      ?.setData(toPropertyGeoJSON(properties));
  }, [ready, properties]);

  // Update radius circles
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("radius-proposed") as mapboxgl.GeoJSONSource | undefined)
      ?.setData(radiusCircleGeoJSON(proposedSites, radiusMi));
    (mapRef.current?.getSource("radius-gas") as mapboxgl.GeoJSONSource | undefined)
      ?.setData(radiusCircleGeoJSON(gasPlants, radiusMi));
  }, [ready, proposedSites, gasPlants, radiusMi]);

  // Update gas plants source
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("gas-plants") as mapboxgl.GeoJSONSource | undefined)
      ?.setData(toPointGeoJSON(gasPlants, p => {
        const count = plantCounts?.[p.id];
        return {
          name: p.name,
          short_name: p.name.replace("Energy Center", "").replace("Power Station", "").trim(),
          capacity_mw: p.capacity_mw,
          count_label: count != null ? `${count.toLocaleString()} properties` : "",
        };
      }));
  }, [ready, gasPlants, plantCounts]);

  // Update proposed peakers source
  useEffect(() => {
    if (!ready) return;
    (mapRef.current?.getSource("proposed-peakers") as mapboxgl.GeoJSONSource | undefined)
      ?.setData(toPointGeoJSON(proposedSites, p => {
        const count = siteCounts?.[p.id];
        return {
          name: p.name,
          num: String(p.id),
          count_label: count != null ? `${count.toLocaleString()} properties` : "",
        };
      }));
  }, [ready, proposedSites, siteCounts]);

  // Fly to + highlight focused property
  useEffect(() => {
    if (!ready) return;
    const prop = focusPid ? properties.find(p => p.pid === focusPid) : null;
    const src = mapRef.current?.getSource("selected-prop") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(prop
      ? { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [prop.lon, prop.lat] }, properties: {} }] }
      : { type: "FeatureCollection", features: [] }
    );
    if (prop) mapRef.current?.flyTo({ center: [prop.lon, prop.lat], zoom: 15, duration: 600 });
  }, [ready, focusPid, properties]);

  return <div ref={containerRef} className="w-full h-full" />;
}
