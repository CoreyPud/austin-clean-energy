import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, Rectangle, Pane, useMap } from "react-leaflet";
import type { Map as LeafletMap, LatLngBoundsExpression } from "leaflet";
import { svg } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Moon, Sun, Plus, Minus, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type Filters, type Priority, type Site, type Substation, type ZipGrowth, PRIORITY_INFO,
  filterSites, filtersFromParams, filtersToParams, nearestSubstation, parseSites, parseSubstations, parseZips, percentileBounds, siteStats,
} from "./data";

const AUSTIN: [number, number] = [30.3, -97.73];
const TABLE_LIMIT = 150;
const fmt = (v: number, d = 0) => v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

function useColors(ref: React.RefObject<HTMLDivElement>, theme: string) {
  const [c, setC] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    const v = (k: string) => `hsl(${cs.getPropertyValue(k).trim()})`;
    setC({ 1: v("--rfp-p1"), 2: v("--rfp-p2"), 3: v("--rfp-p3"), 4: v("--rfp-p4"), heat: v("--rfp-heat"), substation: v("--foreground"), surface: v("--background") });
  }, [ref, theme]);
  return c;
}

function MapRef({ onReady }: { onReady: (m: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => onReady(map), [map, onReady]);
  return null;
}

export default function BatterySiteMap() {
  const [params, setParams] = useSearchParams();
  const f = useMemo(() => filtersFromParams(params), [params]);
  const update = (patch: Partial<Filters>) => setParams(filtersToParams({ ...f, ...patch }, params), { replace: true });

  const [sites, setSites] = useState<Site[]>([]);
  const [zips, setZips] = useState<ZipGrowth[]>([]);
  const [subs, setSubs] = useState<Substation[] | null>(null);
  const [subError, setSubError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeat, setShowHeat] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showSubs, setShowSubs] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const [dark, setDark] = useState<boolean>(!!systemDark);
  const root = useRef<HTMLDivElement>(null);
  const colors = useColors(root, dark ? "dark" : "light");
  const substationRenderer = useMemo(() => svg({ pane: "substations" }), []);

  useEffect(() => {
    Promise.all([fetch("/data/rfp-2026-sites.csv").then((r) => r.text()), fetch("/data/rfp-2026-zip-growth.csv").then((r) => r.text())])
      .then(([s, z]) => { setSites(parseSites(s)); setZips(parseZips(z)); })
      .catch(() => setError("The site data could not be loaded."));
    fetch("/data/substations.csv").then((r) => {
      if (!r.ok) throw new Error("Substations unavailable");
      return r.text();
    }).then((t) => {
      const parsed = parseSubstations(t);
      if (!parsed) throw new Error("Invalid substation data");
      setSubs(parsed);
    }).catch(() => setSubError(true));
  }, []);

  const filtered = useMemo(() => filterSites(sites, f), [sites, f]);
  const stats = useMemo(() => siteStats(filtered, f.ratio), [filtered, f.ratio]);
  const bounds = useMemo(() => percentileBounds(sites), [sites]);
  const maxGwh = useMemo(() => Math.max(1, ...zips.map((z) => z.gwhAll)), [zips]);
  const zipOptions = useMemo(() => {
    const m = new Map<string, boolean>();
    sites.forEach((s) => m.set(s.zip, (m.get(s.zip) ?? false) || s.highGrowth));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sites]);
  const drawOrder = useMemo(() => [...filtered].sort((a, b) => b.priority - a.priority), [filtered]);

  useEffect(() => { if (map && bounds) map.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] }); }, [map, bounds]);
  const resetView = () => bounds && map?.fitBounds(bounds as LatLngBoundsExpression, { padding: [20, 20] });
  const focus = (s: Site) => { setSelected(s.id); map?.setView([s.lat, s.lon], 16); };

  const radius = (s: Site) => { const r = 3 + Math.sqrt(s.solarKw) * 0.6; return s.priority === 4 ? Math.min(r, 9) : Math.min(r, 22); };
  const togglePriority = (p: Priority, on: boolean) => update({ priorities: on ? [...new Set([...f.priorities, p])] : f.priorities.filter((x) => x !== p) });

  return (
    <div ref={root} className={`rfp-2026 ${dark ? "dark" : ""} bg-[hsl(var(--rfp-surface))] text-foreground min-h-screen`}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">RFP 2026</p>
            <h1 className="text-2xl md:text-3xl font-semibold">Austin Battery Priority Site Map</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">Candidate Austin buildings where a battery could pair with existing or new rooftop solar, ranked by existing solar and new electric load permitted in each ZIP since 2020.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDark(!dark)} aria-label="Toggle dark mode">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Sites shown", fmt(stats.count)],
            ["Solar MW (DC)", fmt(stats.solarMw, 1)],
            ["Battery MW (est.)", fmt(stats.batteryMw, 1)],
            ["Battery MW on existing solar (est.)", `${fmt(stats.existingBatteryMw, 1)}`, `${fmt(stats.existingCount)} sites`],
          ].map(([label, value, sub]) => (
            <div key={label} className="bg-card border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="rfp-num text-2xl font-semibold">{value}</p>
              {sub && <p className="rfp-num text-xs text-muted-foreground">{sub}</p>}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Battery figures are estimates: solar kW × the battery ratio ({f.ratio.toFixed(2)}) set in the filters.</p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col lg:flex-row gap-4">
          <aside className="lg:w-[290px] shrink-0 bg-card border rounded-md p-4 space-y-5 text-sm">
            <div className="space-y-2">
              <p className="font-semibold">Priority</p>
              {([1, 2, 3, 4] as Priority[]).map((p) => (
                <label key={p} className="flex gap-2 items-start cursor-pointer">
                  <Checkbox checked={f.priorities.includes(p)} onCheckedChange={(v) => togglePriority(p, !!v)} className="mt-0.5" />
                  <span><span className="inline-block h-2.5 w-2.5 rounded-full mr-1.5" style={{ background: colors[p] }} /><span className="font-medium">{PRIORITY_INFO[p].label}</span><span className="block text-xs text-muted-foreground">{PRIORITY_INFO[p].desc}</span></span>
                </label>
              ))}
            </div>
            <label className="flex gap-2 items-center cursor-pointer"><Checkbox checked={f.highOnly} onCheckedChange={(v) => update({ highOnly: !!v })} />Top 12 growth ZIPs only</label>
            <div className="space-y-2">
              <Label>Minimum solar size: <span className="rfp-num">{fmt(f.minKw)} kW</span></Label>
              <Slider min={0} max={1000} step={25} value={[f.minKw]} onValueChange={([v]) => update({ minKw: v })} />
            </div>
            <div className="space-y-2">
              <Label>ZIP code</Label>
              <Select value={f.zip || "all"} onValueChange={(v) => update({ zip: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All ZIPs</SelectItem>{zipOptions.map(([z, hi]) => <SelectItem key={z} value={z}>{z}{hi ? " · top growth" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="rfp-q">Search name or address</Label><Input id="rfp-q" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder="e.g. Lamar" /></div>
            <div className="space-y-2 border-t pt-4">
              <p className="font-semibold">Battery sizing</p>
              <Label>Battery kW as a share of solar kW: <span className="rfp-num">{f.ratio.toFixed(2)}</span></Label>
              <Slider min={0.25} max={1} step={0.05} value={[f.ratio]} onValueChange={([v]) => update({ ratio: Math.round(v * 100) / 100 })} />
              <p className="text-xs text-muted-foreground">Placeholder. A 2-hour battery at half the solar size can fill from midday solar and cover the evening peak.</p>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="font-semibold">Layers</p>
              <label className="flex gap-2 items-center cursor-pointer"><Checkbox checked={showHeat} onCheckedChange={(v) => setShowHeat(!!v)} />New-load heat by ZIP</label>
              <label className="flex gap-2 items-center cursor-pointer"><Checkbox checked={showLabels} onCheckedChange={(v) => setShowLabels(!!v)} />Label top growth ZIPs</label>
              <label className="flex gap-2 items-center cursor-pointer"><Checkbox checked={showSubs} disabled={!subs} onCheckedChange={(v) => setShowSubs(!!v)} />Substations{subs ? ` (${subs.length})` : ""}</label>
              {subError && <p className="text-xs text-destructive">Substation locations could not be loaded. Please reload to retry.</p>}
              <p className="text-xs text-muted-foreground">The supplied substation list has best-guess ZIPs, not coordinates. Squares show estimated areas, not actual substation locations. Proximity is estimated from those areas, not a serving feeder or available capacity.</p>
              <p className="text-xs text-muted-foreground">ZIP growth is a proxy for where load is growing. It is not feeder or transformer loading.</p>
            </div>
            <div className="border-t pt-4 space-y-3 text-xs text-muted-foreground">
              <div><p className="font-semibold text-foreground text-sm">How the ranking works</p><p>Sites sort by priority, then by the ZIP's new load since 2020 (GWh), then by solar size.</p></div>
              <div><p className="font-semibold text-foreground text-sm">Interconnection still decides</p><p>Two AISD schools (Mendez and Widen) were dropped from a DOE solar project for insufficient interconnection, so every site needs a feeder check.</p></div>
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="relative h-[480px] lg:h-[640px] border rounded-md overflow-hidden">
              <MapContainer center={AUSTIN} zoom={11} preferCanvas zoomControl={false} className="h-full w-full">
                <MapRef onReady={setMap} />
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {showHeat && colors.heat && zips.map((z) => {
                  const k = Math.sqrt(z.gwhAll / maxGwh);
                  return <Circle key={`h${z.zip}`} center={[z.lat, z.lon]} radius={600 + 2600 * k} pathOptions={{ stroke: false, fillColor: colors.heat, fillOpacity: 0.08 + 0.3 * k }} interactive={false} />;
                })}
                {showLabels && zips.filter((z) => z.high).map((z) => (
                  <CircleMarker key={`l${z.zip}`} center={[z.lat, z.lon]} radius={0} pathOptions={{ opacity: 0 }} interactive={false}>
                    <Tooltip permanent direction="center" className="rfp-zip-label">{z.zip}</Tooltip>
                  </CircleMarker>
                ))}
                <Pane name="substations" className="z-[450]">
                  {showSubs && colors.substation && subs?.map((s, i) => {
                    const d = s.approx ? 0.003 : s.capacityKva == null ? 0.00065 : 0.00065 + Math.min(0.002, Math.sqrt(s.capacityKva) / 100000);
                    return <Rectangle key={`s${i}-${dark}`} renderer={substationRenderer} pane="substations" bounds={[[s.lat - d, s.lon - d], [s.lat + d, s.lon + d]]} pathOptions={{ color: colors.substation, fillColor: colors.surface, weight: 2, fillOpacity: s.approx ? 0.15 : 0.85, dashArray: s.approx ? "4 3" : undefined }}>
                      <Tooltip sticky direction="top"><div className="text-xs space-y-0.5 max-w-[240px] whitespace-normal"><p className="font-semibold">{s.name}{s.approx ? " (estimated area)" : ""}</p><p>Voltage: {s.voltageKv == null ? "Not reported" : `${fmt(s.voltageKv)} kV`}</p><p>Buses: {s.buses || "Not reported"}</p><p>Best-guess ZIPs: {s.zipGuesses || "Not reported"}</p><p>Capacity: {s.capacityKva == null ? "Not reported" : `${fmt(s.capacityKva)} kVA`}</p>{s.approx && <><p>{s.positionMethod}</p><p>ZIPs used for position: {s.positionZips}</p></>}<p>Actual location and available capacity unverified.</p></div></Tooltip>
                    </Rectangle>;
                  })}
                </Pane>
                {colors[1] && drawOrder.map((s) => {
                  const c = colors[s.priority];
                  const sel = s.id === selected;
                  return (
                    <CircleMarker key={`${s.id}-${dark}`} center={[s.lat, s.lon]} radius={sel ? radius(s) + 4 : radius(s)}
                      eventHandlers={{ click: () => setSelected(s.id) }}
                      pathOptions={{
                        color: sel ? "hsl(var(--foreground))" : c, weight: sel ? 3 : s.approx ? 1.5 : 1,
                        fillColor: c, fillOpacity: s.approx ? 0.12 : s.priority === 4 ? 0.35 : 0.75, opacity: s.priority === 4 ? 0.6 : 0.95,
                      }}>
                      <Tooltip>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold">{s.name}</p>
                          <p>{s.address}</p>
                          <p>{s.category} · P{s.priority}</p>
                          <p>Solar {fmt(s.solarKw, 1)} kW · Battery {fmt(s.solarKw * f.ratio, 1)} kW (est.)</p>
                          <p>ZIP {s.zip}: {fmt(s.zipGwh, 1)} GWh new load{s.zipRank ? ` · rank ${s.zipRank}` : ""}</p>
                          {s.approx && <p className="italic">Position estimated from ZIP center</p>}
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
              <div className="absolute top-2 right-2 z-[500] flex flex-col gap-1">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => map?.zoomIn()} aria-label="Zoom in"><Plus className="h-4 w-4" /></Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => map?.zoomOut()} aria-label="Zoom out"><Minus className="h-4 w-4" /></Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={resetView} aria-label="Reset view"><RotateCcw className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground bg-card border rounded-md p-3">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" /><span className="inline-block h-4 w-4 rounded-full bg-muted-foreground" />Dot size = solar kW</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border-2 border-muted-foreground" />Hollow = position estimated from ZIP center</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-16 rounded-sm" style={{ background: `linear-gradient(to right, transparent, ${colors.heat})` }} />Heat = ZIP new load since 2020 (low → high)</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 border-2 border-dashed border-foreground bg-background" />Dashed square = estimated substation area; not an actual location</span>
            </div>
          </div>
        </div>

        <section className="bg-card border rounded-md">
          <div className="flex items-center justify-between p-3 border-b">
            <h2 className="font-semibold">Ranked sites</h2>
            <p className="text-xs text-muted-foreground">Showing top {fmt(Math.min(TABLE_LIMIT, filtered.length))} of {fmt(filtered.length)}</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="sticky top-0 bg-card z-10 text-xs text-muted-foreground">
                <tr className="border-b text-left">
                  <th className="p-2">Priority</th><th className="p-2">Site</th><th className="p-2">Address</th><th className="p-2">ZIP</th>
                  <th className="p-2 text-right">Solar kW</th><th className="p-2 text-right">Battery kW (est.)</th><th className="p-2 text-right">ZIP new load GWh</th><th className="p-2">Type</th>
                  <th className="p-2">Nearest substation area (estimated)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, TABLE_LIMIT).map((s) => {
                  const near = nearestSubstation(s, subs);
                  return (
                    <tr key={s.id} onClick={() => focus(s)} className={`border-b cursor-pointer hover:bg-muted/50 ${s.id === selected ? "bg-muted" : ""}`}>
                      <td className="p-2"><span className="rfp-num text-xs font-semibold px-2 py-0.5 rounded-full text-background" style={{ background: colors[s.priority] }}>P{s.priority}</span></td>
                      <td className="p-2 font-medium">{s.name}</td>
                      <td className="p-2">{s.address}{s.approx && <span className="text-muted-foreground"> (est.)</span>}</td>
                      <td className="p-2 rfp-num">{s.zip}</td>
                      <td className="p-2 rfp-num text-right">{fmt(s.solarKw, 1)}</td>
                      <td className="p-2 rfp-num text-right">{fmt(s.solarKw * f.ratio, 1)}</td>
                      <td className="p-2 rfp-num text-right">{fmt(s.zipGwh, 1)}</td>
                      <td className="p-2 text-xs text-muted-foreground">{s.category}</td>
                      <td className="p-2 text-xs min-w-[230px]">{near ? <><span className="font-medium">{near.sub.name} · {near.sub.voltageKv == null ? "Voltage not reported" : `${fmt(near.sub.voltageKv)} kV`}</span><span className="block rfp-num">{fmt(near.km, 1)} km (est.){s.approx ? " · site at ZIP center" : ""}</span><span className="block">Buses: {near.sub.buses || "Not reported"}</span><span className="block">Best-guess ZIPs: {near.sub.zipGuesses || "Not reported"}</span><span className="block text-muted-foreground">{near.sub.capacityKva == null ? "Capacity not reported" : `${fmt(near.sub.capacityKva)} kVA`}</span></> : subError ? "Unavailable" : "Loading…"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-muted-foreground">Sources: City of Austin issued construction permits (estimated annual kWh by permit, ZIP totals), Austin solar permit export (commercial solar with stated kW), AISD solar sheets, Roof Revenue rooftop estimates. Solar kW for potential sites is DC. All sizing and growth figures are screening estimates, not Austin Energy feeder data.</p>
        <p className="text-xs text-muted-foreground">Substations: <a className="underline" href="/data/rfp-2026-substations-supplied.csv" target="_blank" rel="noopener noreferrer">User-supplied voltage, buses, and Best-Guess ZIP list</a> (20 records). Positions average available ZIP centers from the supplied growth file; LAKEWAY uses candidate-site coordinates in its guessed ZIPs because those ZIP centers are unavailable. Some guessed ZIPs lack centers and are omitted from position estimates. All substation positions and proximity distances are estimates, not verified locations. Capacity is not supplied; 138 kV is voltage, not hosting capacity.</p>
      </div>
    </div>
  );
}
