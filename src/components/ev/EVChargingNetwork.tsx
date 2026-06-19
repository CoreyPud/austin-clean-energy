import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Zap, MapPin, Building2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface EVStation {
  id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  ev_network: string | null;
  ev_level1_evse_num: number;
  ev_level2_evse_num: number;
  ev_dc_fast_num: number;
  open_date: string | null;
  open_year: number | null;
  street_address: string | null;
  zip: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const NETWORK_LABELS: Record<string, string> = {
  "ChargePoint Network": "ChargePoint",
  "Tesla Destination":   "Tesla Destination",
  "Tesla":               "Tesla Supercharger",
  "Blink Network":       "Blink",
  "Non-Networked":       "Non-networked",
  "eVgo Network":        "EVgo",
  "Electrify America":   "Electrify America",
  "SHELL_RECHARGE":      "Shell Recharge",
  "FORD_CHARGE":         "Ford Charge",
  "MERCEDES_BENZ":       "Mercedes-Benz",
};

const networkLabel = (n: string | null) =>
  n ? (NETWORK_LABELS[n] ?? n) : "Unknown";

const CURRENT_YEAR = new Date().getFullYear();
const COLOR_DC = "#f97316";
const COLOR_L2 = "#22c55e";

function buildGeoJSON(stations: EVStation[]) {
  return {
    type: "FeatureCollection" as const,
    features: stations.map(s => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [s.longitude, s.latitude] },
      properties: {
        id:        s.id,
        name:      s.station_name,
        network:   networkLabel(s.ev_network),
        l1:        s.ev_level1_evse_num,
        l2:        s.ev_level2_evse_num,
        dc:        s.ev_dc_fast_num,
        is_dc:     s.ev_dc_fast_num > 0 ? 1 : 0,
        open_year: s.open_year ?? CURRENT_YEAR,
        open_date: s.open_date,
        address:   s.street_address,
        zip:       s.zip,
      },
    })),
  };
}

function yearFilter(year: number) {
  return ["<=", ["get", "open_year"], year] as any;
}


function popupHtml(props: Record<string, any>) {
  const ports = [
    props.l2 > 0 ? `${props.l2} Level 2` : null,
    props.dc > 0 ? `${props.dc} DC Fast` : null,
    props.l1 > 0 ? `${props.l1} Level 1` : null,
  ].filter(Boolean).join(" · ");

  return `
    <div style="padding:10px 12px;min-width:200px;font-family:system-ui,sans-serif;">
      <strong style="font-size:13px;display:block;margin-bottom:4px;">${props.name}</strong>
      <span style="font-size:11px;color:#666;">${props.network}</span>
      <div style="margin-top:6px;font-size:12px;color:#333;">${ports || "No port data"}</div>
      ${props.address ? `<div style="margin-top:4px;font-size:11px;color:#888;">${props.address}${props.zip ? `, ${props.zip}` : ""}</div>` : ""}
      ${props.open_date ? `<div style="margin-top:4px;font-size:11px;color:#888;">Opened ${props.open_date}</div>` : ""}
    </div>`;
}

// ── Map subcomponent ───────────────────────────────────────────────────────

interface MapProps {
  stations: EVStation[];
  selectedYear: number;
  minYear: number;
  onYearChange: (y: number) => void;
  visibleCount: number;
  visiblePorts: number;
}

const EVStationMap = ({ stations, selectedYear, minYear, onYearChange, visibleCount, visiblePorts }: MapProps) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<mapboxgl.Map | null>(null);
  const hoverPopupRef   = useRef<mapboxgl.Popup | null>(null);
  const hoveredIdRef    = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const token = (window as any).MAPBOX_TOKEN;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     "mapbox://styles/mapbox/light-v11",
      center:    [-97.7431, 30.2672],
      zoom:       10,
      cooperativeGestures: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // generateId lets us use feature-state for hover highlighting
      map.addSource("ev-stations", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        generateId: true,
      });

      map.addLayer({
        id:     "ev-stations-layer",
        type:   "circle",
        source: "ev-stations",
        filter: yearFilter(CURRENT_YEAR),
        paint: {
          "circle-color":  ["case", ["==", ["get", "is_dc"], 1], COLOR_DC, COLOR_L2],
          // Zoom interpolation must be top-level — cannot nest inside case
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2.4, 11, 4, 14, 7, 17, 12],
          // Hover highlight via opacity (1 = hovered, 0.75 = others)
          "circle-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.75],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 8, 0, 12, 0.5, 15, 1],
        },
      });

      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        maxWidth: "240px",
      });
      hoverPopupRef.current = hoverPopup;

      map.on("mousemove", "ev-stations-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        map.getCanvas().style.cursor = "pointer";

        // Feature-state hover highlight
        if (hoveredIdRef.current !== null) {
          map.setFeatureState({ source: "ev-stations", id: hoveredIdRef.current }, { hover: false });
        }
        hoveredIdRef.current = f.id as number;
        map.setFeatureState({ source: "ev-stations", id: f.id as number }, { hover: true });

        // Hover tooltip
        const p = f.properties as Record<string, any>;
        const ports = [
          p.l2 > 0 ? `${p.l2} L2` : null,
          p.dc > 0 ? `${p.dc} DC Fast` : null,
        ].filter(Boolean).join(" · ");
        hoverPopup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding:6px 8px;font-family:system-ui,sans-serif;">
              <strong style="font-size:12px;display:block;">${p.name}</strong>
              <span style="font-size:11px;color:#666;">${p.network}${ports ? ` · ${ports}` : ""}</span>
            </div>`)
          .addTo(map);
      });

      map.on("mouseleave", "ev-stations-layer", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredIdRef.current !== null) {
          map.setFeatureState({ source: "ev-stations", id: hoveredIdRef.current }, { hover: false });
          hoveredIdRef.current = null;
        }
        hoverPopup.remove();
      });

      map.on("click", "ev-stations-layer", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        hoverPopup.remove();
        new mapboxgl.Popup({ offset: 16, maxWidth: "280px" })
          .setLngLat(e.lngLat)
          .setHTML(popupHtml(f.properties as Record<string, any>))
          .addTo(map);
      });

      setMapLoaded(true);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapLoaded || !stations.length || !mapRef.current) return;
    const map = mapRef.current;
    (map.getSource("ev-stations") as mapboxgl.GeoJSONSource)?.setData(buildGeoJSON(stations));

    // Fit map to all station points with padding
    const lngs = stations.map(s => s.longitude);
    const lats = stations.map(s => s.latitude);
    const bounds = new mapboxgl.LngLatBounds(
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    );
    map.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 0 });
  }, [stations, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;
    map.setFilter("ev-stations-layer", yearFilter(selectedYear));
  }, [selectedYear, mapLoaded]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Show stations opened through:</span>
          <span className="text-sm font-bold tabular-nums text-primary">{selectedYear}</span>
        </div>
        <Slider
          value={[selectedYear]}
          min={minYear}
          max={CURRENT_YEAR}
          step={1}
          onValueChange={([y]) => onYearChange(y)}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{minYear}</span>
          <span className="text-primary font-medium">
            {visibleCount.toLocaleString()} stations · {visiblePorts.toLocaleString()} ports
          </span>
          <span>{CURRENT_YEAR}</span>
        </div>
      </div>

      <div className="relative">
        <div ref={containerRef} className="h-[420px] rounded-lg" />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10 border border-border space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ background: COLOR_DC }} />
            <span className="text-xs text-muted-foreground">DC Fast Charger</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border border-white shadow-sm" style={{ background: COLOR_L2 }} />
            <span className="text-xs text-muted-foreground">Level 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const EVChargingNetwork = () => {
  const [stations,     setStations]     = useState<EVStation[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [mapToken,     setMapToken]     = useState(false);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    (supabase as any)
      .from("ev_charging_stations")
      .select("id,station_name,latitude,longitude,ev_network,ev_level1_evse_num,ev_level2_evse_num,ev_dc_fast_num,open_date,open_year,street_address,zip")
      .in("status_code", ["E", "T"])
      .order("open_date", { ascending: true, nullsFirst: false })
      .then(({ data, error }: { data: any[] | null; error: any }) => {
        if (error) {
          console.error("ev_charging_stations query error:", error);
          setLoadError(error.message ?? String(error));
        } else {
          setStations((data ?? []) as EVStation[]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if ((window as any).MAPBOX_TOKEN) { setMapToken(true); return; }
    supabase.functions.invoke("get-mapbox-token").then(({ data }) => {
      if (data?.token) {
        (window as any).MAPBOX_TOKEN = data.token;
        setMapToken(true);
      }
    });
  }, []);

  const totalPorts  = stations.reduce((s, st) => s + st.ev_level1_evse_num + st.ev_level2_evse_num + st.ev_dc_fast_num, 0);
  const totalDcFast = stations.reduce((s, st) => s + st.ev_dc_fast_num, 0);
  const networks    = new Set(stations.map(s => s.ev_network).filter(Boolean)).size;
  const minYear     = stations.reduce((m, s) => s.open_year ? Math.min(m, s.open_year) : m, CURRENT_YEAR);

  const visible      = stations.filter(s => !s.open_year || s.open_year <= selectedYear);
  const visiblePorts = visible.reduce((s, st) => s + st.ev_level1_evse_num + st.ev_level2_evse_num + st.ev_dc_fast_num, 0);

  const statCards = [
    { icon: <Zap className="h-4 w-4 text-primary" />,        value: loading ? "—" : totalPorts.toLocaleString(),     label: "Public charging ports",   sub: "Level 1, 2 & DC Fast" },
    { icon: <MapPin className="h-4 w-4 text-primary" />,     value: loading ? "—" : stations.length.toLocaleString(), label: "Station locations",       sub: "across Austin metro" },
    { icon: <Building2 className="h-4 w-4 text-primary" />,  value: loading ? "—" : totalDcFast.toLocaleString(),    label: "DC Fast ports",           sub: "30–350 kW rapid charging" },
    { icon: <TrendingUp className="h-4 w-4 text-primary" />, value: loading ? "—" : networks.toString(),             label: "Networks represented",    sub: "ChargePoint, Tesla & more" },
  ];

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="border border-border/50">
            <CardContent className="pt-4 pb-4 space-y-1.5">
              {s.icon}
              <div className="text-2xl font-bold text-foreground tabular-nums">{s.value}</div>
              <div className="text-xs font-medium text-foreground leading-snug">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/50">
        <CardContent className="pt-5 pb-4">
          {loading ? (
            <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-sm">Loading station data…</span>
            </div>
          ) : loadError ? (
            <div className="h-[480px] flex flex-col items-center justify-center gap-2 text-center px-4">
              <span className="text-sm font-medium text-destructive">Failed to load station data</span>
              <span className="text-xs text-muted-foreground max-w-sm">{loadError}</span>
              <span className="text-xs text-muted-foreground">Check the browser console for details.</span>
            </div>
          ) : stations.length === 0 ? (
            <div className="h-[480px] flex flex-col items-center justify-center gap-2 text-center px-4">
              <span className="text-sm font-medium text-foreground">No station data</span>
              <span className="text-xs text-muted-foreground max-w-sm">
                The <code className="bg-muted px-1 rounded">ev_charging_stations</code> table is empty.
                Run <code className="bg-muted px-1 rounded">ev_stations_seed.sql</code> in the Lovable SQL editor.
              </span>
            </div>
          ) : !mapToken ? (
            <div className="h-[480px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-sm text-muted-foreground">Loading map…</span>
            </div>
          ) : (
            <EVStationMap
              stations={stations}
              selectedYear={selectedYear}
              minYear={minYear || 2010}
              onYearChange={setSelectedYear}
              visibleCount={visible.length}
              visiblePorts={visiblePorts}
            />
          )}
          {!loading && (
            <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t">
              Data: NREL Alternative Fuel Stations API · {stations.length} Austin-area stations
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default EVChargingNetwork;
