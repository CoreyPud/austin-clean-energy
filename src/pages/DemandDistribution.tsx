import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import PageHeader from "@/components/PageHeader";
import MapTokenLoader from "@/components/MapTokenLoader";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";

type Source = "tcad" | "permit";
const TYPES = [
  { key: "single_family", label: "Single-family homes", color: "#f59e0b" },
  { key: "multifamily", label: "Apartments", color: "#e11d48" },
  { key: "condo", label: "Condos", color: "#a855f7" },
  { key: "commercial", label: "Commercial", color: "#2563eb" },
  { key: "other", label: "Other", color: "#6b7280" },
];
const CELL = 0.005; // ~500 m
const DOT_ZOOM = 13;
const PEAK = 3067;
const colorExpr: any = ["match", ["get", "t"], ...TYPES.flatMap((t) => [t.key, t.color]), "#6b7280"];

const YEAR_OPTS = [
  { v: null, l: "All years" },
  { v: 2021, l: "Last 5 years" },
  { v: 2016, l: "Last 10 years" },
  { v: 2000, l: "Since 2000" },
];

function DemandMap({ source, types, minYear, minKw, onStatus }: {
  source: Source; types: string[]; minYear: number | null; minKw: number;
  onStatus: (s: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const params = useRef({ source, types, minYear, minKw });
  params.current = { source, types, minYear, minKw };
  const seq = useRef(0);

  useEffect(() => {
    mapboxgl.accessToken = (window as any).MAPBOX_TOKEN;
    const m = new mapboxgl.Map({
      container: el.current!, style: "mapbox://styles/mapbox/light-v11",
      center: [-97.74, 30.29], zoom: 10.2,
    });
    map.current = m;
    m.addControl(new mapboxgl.NavigationControl(), "top-right");
    m.on("load", () => {
      m.addSource("grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "grid", type: "fill", source: "grid", maxzoom: DOT_ZOOM,
        paint: {
          "fill-color": ["interpolate", ["linear"], ["get", "mw"],
            0, "#fef9c3", 0.5, "#fde047", 2, "#fb923c", 5, "#ef4444", 15, "#7f1d1d"],
          "fill-opacity": 0.7,
        },
      });
      m.addSource("dots", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "dots", type: "circle", source: "dots", minzoom: DOT_ZOOM,
        paint: {
          "circle-color": colorExpr,
          "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "kw"]], 1, 2, 5, 4, 30, 14, 100, 30],
          "circle-opacity": 0.75, "circle-stroke-width": 0.5, "circle-stroke-color": "#fff",
        },
      });
      const popup = new mapboxgl.Popup({ closeButton: false });
      for (const id of ["grid", "dots"]) {
        m.on("mousemove", id, (e) => {
          const p = e.features?.[0]?.properties as any;
          if (!p) return;
          m.getCanvas().style.cursor = "pointer";
          const lbl = TYPES.find((t) => t.key === p.t)?.label ?? p.t;
          popup.setLngLat(e.lngLat).setHTML(id === "grid"
            ? `<b>${Number(p.mw).toFixed(2)} MW</b> est. peak<br/>${p.n} buildings · mostly ${lbl}`
            : `<b>${lbl}</b><br/>${Number(p.kw).toFixed(1)} kW est. peak${p.y ? `<br/>${source === "permit" ? "Permitted" : "Built"} ${p.y}` : ""}`).addTo(m);
        });
        m.on("mouseleave", id, () => { m.getCanvas().style.cursor = ""; popup.remove(); });
      }
      m.on("moveend", () => loadDots());
      setReady(true);
    });
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGrid() {
    const m = map.current; if (!m) return;
    const p = params.current;
    onStatus("Loading city view…");
    const { data, error } = await supabase.rpc("demand_grid_json" as any, {
      _source: p.source, _types: p.types, _min_year: p.minYear as any, _cell: CELL,
    });
    if (error) { onStatus("Could not load the map data."); return; }
    const h = CELL / 2;
    (m.getSource("grid") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: ((data as any[]) ?? []).map(([lat, lon, mw, n, t]: any) => ({ c: { lat, lon, mw, n, top_type: t } })).map(({ c }: any) => ({
        type: "Feature", properties: { mw: c.mw, n: c.n, t: c.top_type },
        geometry: { type: "Polygon", coordinates: [[[c.lon - h, c.lat - h], [c.lon + h, c.lat - h], [c.lon + h, c.lat + h], [c.lon - h, c.lat + h], [c.lon - h, c.lat - h]]] },
      })),
    });
    onStatus("");
    loadDots();
  }

  async function loadDots() {
    const m = map.current; if (!m) return;
    if (m.getZoom() < DOT_ZOOM) return;
    const b = m.getBounds(); const p = params.current; const my = ++seq.current;
    const { data, error } = await supabase.rpc("demand_points_json" as any, {
      _source: p.source, _types: p.types, _min_year: p.minYear as any, _min_kw: p.minKw,
      _w: b.getWest(), _s: b.getSouth(), _e: b.getEast(), _n: b.getNorth(), _limit: 15000,
    });
    if (my !== seq.current || error) return;
    (m.getSource("dots") as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: ((data as any[]) ?? []).map(([lat, lon, t, kw, y]: any) => ({
        type: "Feature", properties: { t, kw, y },
        geometry: { type: "Point", coordinates: [lon, lat] },
      })),
    });
    onStatus(((data as any[])?.length ?? 0) >= 15000 ? "Showing the 15,000 largest loads here — zoom in for more." : "");
  }

  useEffect(() => { if (ready) loadGrid(); /* eslint-disable-next-line */ }, [ready, source, types.join(), minYear]);
  useEffect(() => { if (ready) loadDots(); /* eslint-disable-next-line */ }, [minKw]);

  return <div ref={el} className="h-[640px] w-full rounded-lg border" />;
}

export default function DemandDistribution() {
  useSeo({
    title: "Demand Distribution | Austin Clean Energy",
    description: "Map of where Austin's estimated electricity demand sits, by building type and size.",
  });
  const [source, setSource] = useState<Source>("tcad");
  const [types, setTypes] = useState<string[]>(TYPES.map((t) => t.key));
  const [minYear, setMinYear] = useState<number | null>(null);
  const [minKw, setMinKw] = useState(0);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState<{ ptype: string; mw: number; n: number }[]>([]);

  useEffect(() => {
    supabase.rpc("demand_summary", { _source: source, _types: types, _min_year: minYear as any })
      .then(({ data }) => setSummary((data as any) ?? []));
  }, [source, types.join(), minYear]);

  const total = useMemo(() => summary.reduce((s, r) => s + Number(r.mw), 0), [summary]);
  const toggle = (k: string) => setTypes((t) => t.includes(k) ? (t.length > 1 ? t.filter((x) => x !== k) : t) : [...t, k]);
  const nf = new Intl.NumberFormat("en-US");

  return (
    <>
      <PageHeader title="Demand Distribution"
        subtitle="Where Austin's electricity demand sits. Zoomed out, squares add up all demand in each half-kilometer; zoom in to see each building, sized by load and colored by type." />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant={source === "tcad" ? "default" : "outline"} onClick={() => setSource("tcad")}>Today's buildings</Button>
          <Button size="sm" variant={source === "permit" ? "default" : "outline"} onClick={() => setSource("permit")}>New since 2020 (permits)</Button>
          <span className="mx-2 h-6 w-px bg-border" />
          <select className="border rounded-md h-9 px-2 bg-background text-sm" aria-label="Year filter"
            value={minYear ?? ""} onChange={(e) => setMinYear(e.target.value ? Number(e.target.value) : null)}>
            {YEAR_OPTS.map((o) => <option key={o.l} value={o.v ?? ""}>{o.l}{source === "tcad" && o.v ? " (year built)" : ""}</option>)}
          </select>
          <label className="text-sm flex items-center gap-2">Min load
            <select className="border rounded-md h-9 px-2 bg-background" value={minKw} onChange={(e) => setMinKw(Number(e.target.value))} aria-label="Minimum load">
              {[0, 5, 25, 100, 500].map((v) => <option key={v} value={v}>{v ? `${v} kW+` : "Any"}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.filter((t) => source === "tcad" || t.key !== "condo").map((t) => (
            <button key={t.key} onClick={() => toggle(t.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${types.includes(t.key) ? "bg-card" : "opacity-40"}`}>
              <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />{t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="relative">
            <MapTokenLoader className="h-[640px]">
              <DemandMap source={source} types={types} minYear={minYear} minKw={minKw} onStatus={setStatus} />
            </MapTokenLoader>
            {status && <div className="absolute top-3 left-3 bg-card/95 border rounded px-3 py-1 text-sm shadow">{status}</div>}
          </div>
          <aside className="border rounded-lg p-4 bg-card space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Estimated peak demand shown</div>
              <div className="text-3xl font-bold">{nf.format(Math.round(total))} MW</div>
              <div className="text-muted-foreground">vs. {nf.format(PEAK)} MW Austin Energy record peak (Aug 2023)</div>
            </div>
            <table className="w-full">
              <tbody>
                {summary.sort((a, b) => b.mw - a.mw).map((r) => {
                  const t = TYPES.find((x) => x.key === r.ptype);
                  return (
                    <tr key={r.ptype} className="border-t">
                      <td className="py-1"><span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ background: t?.color }} />{t?.label ?? r.ptype}</td>
                      <td className="text-right">{nf.format(Math.round(r.mw))} MW</td>
                      <td className="text-right text-muted-foreground">{nf.format(r.n)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground">Squares: total MW per ~500 m cell (yellow → dark red). Dots appear at neighborhood zoom.</p>
          </aside>
        </div>

        <section className="text-sm text-muted-foreground space-y-2 border-t pt-4">
          <h2 className="text-base font-semibold text-foreground">How the load is estimated</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Homes: 13,152 kWh/yr each (EIA RECS Texas average); condos at 65% of that per unit.</li>
            <li>Apartments, commercial and other: building footprint × electricity-use benchmark (16.9, 14.8 and 6.5 kWh/sq ft/yr), the same benchmarks used on Building Demand Growth.</li>
            <li>Peak kW = annual kWh ÷ 8,760 hours ÷ 0.5 load factor.</li>
            <li><b>Today's buildings</b> uses Travis Central Appraisal District parcels. Footprint is used, not floor area, so tall buildings are undercounted, while large commercial parcels may be overcounted. About 270,000 parcels with no building type are left out.</li>
            <li>The total is a sum of each building's own peak. Buildings don't all peak at the same moment, so it runs well above the actual system peak — use it to compare places, not as a system forecast.</li>
            <li><b>New since 2020</b> uses City of Austin building permits; 16,263 of 22,177 permits were matched to a map location through the City's issued-permits dataset, the rest are not shown.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
