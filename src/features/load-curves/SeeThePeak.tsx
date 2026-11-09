import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Download, Info, ArrowUpDown } from "lucide-react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { results, scenKey, timeLabel, type Controller, type LoadCurveData, type Size } from "./model";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const kw = (n: number) => Math.round(n).toLocaleString();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GREY = "hsl(var(--muted-foreground))";
const GREEN = "hsl(var(--primary))";
const AMBER = "hsl(var(--accent))";
type View = "peak_day" | "summer_weekday" | "monthly";
type SortKey = "name" | "peak" | "redKw" | "redPct" | "savings" | "perKw";

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-accent/50 bg-accent/10 p-3 text-sm">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /><span>{children}</span>
    </div>
  );
}

export default function SeeThePeak() {
  const [data, setData] = useState<LoadCurveData | null>(null);
  const [missing, setMissing] = useState(false);
  const [type, setType] = useState("largeoffice");
  const [peak, setPeak] = useState(668);
  const [size, setSize] = useState<Size>(10);
  const [ctrl, setCtrl] = useState<Controller>("perfect");
  const [rate, setRate] = useState(15.35);
  const [view, setView] = useState<View>("peak_day");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "perKw", dir: -1 });
  const chartRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/data/load_curves.json")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: LoadCurveData) => {
        setData(d);
        const first = d.buildings.largeoffice ? "largeoffice" : Object.keys(d.buildings)[0];
        setType(first);
        setPeak(d.buildings[first].median_peak_kw);
      })
      .catch(() => setMissing(true));
  }, []);

  const b = data?.buildings[type];
  const r = useMemo(() => (b ? results(b, peak, size, ctrl, rate, data!.meta.battery_hours) : null), [b, peak, size, ctrl, rate, data]);

  const series = useMemo(() => {
    if (!b || !r || view === "monthly") return [];
    const s = b.scen[scenKey(size, ctrl)];
    return b.base[view].map((v, i) => {
      const without = v * r.scale, withB = s[view][i] * r.scale;
      return { i, t: timeLabel(i), without, with: withB, discharge: without > withB ? [withB, without] : null, charge: withB > without ? [without, withB] : null };
    });
  }, [b, r, view, size, ctrl]);

  const compare = useMemo(() => {
    if (!data) return [];
    const rows = Object.entries(data.buildings).map(([key, bt]) => {
      const x = results(bt, bt.median_peak_kw, size, ctrl, rate, data.meta.battery_hours);
      const s = bt.scen[scenKey(size, ctrl)];
      return { key, name: bt.name, peak: bt.median_peak_kw, redKw: x.reductionKw, redPct: x.reductionPct, savings: x.annualSavings, perKw: x.savingsPerBatteryKw,
        spark: bt.base.summer_weekday.filter((_, i) => i % 4 === 0).map((v, i) => ({ a: v, b: s.summer_weekday[i * 4] })) };
    });
    return rows.sort((a, z) => (a[sort.key] < z[sort.key] ? -1 : a[sort.key] > z[sort.key] ? 1 : 0) * sort.dir);
  }, [data, size, ctrl, rate, sort]);

  if (missing) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-4">
        <Link to="/austin-at-a-glance#grid-tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Austin at a Glance</Link>
        <h1 className="text-3xl font-bold">See the Peak</h1>
        <Warn>The building load-curve data file has not been added yet, so this tool can't show any curves. No estimates are shown until the real data is loaded.</Warn>
      </div>
    );
  }
  if (!data || !b || !r) return <div className="container mx-auto px-4 py-16 text-muted-foreground">Loading building load curves…</div>;

  const types = Object.entries(data.buildings).sort((a, z) => a[1].name.localeCompare(z[1].name));
  const peakDate = new Date(b.peak_day + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const downloadPng = async () => {
    if (!chartRef.current) return;
    const url = await toPng(chartRef.current, { backgroundColor: "white" });
    const a = document.createElement("a"); a.href = url; a.download = `see-the-peak-${type}-${view}.png`; a.click();
  };
  const downloadCsv = () => {
    const lines = view === "monthly"
      ? ["month,kw_without,kw_with,cost_without,cost_with,savings", ...r.monthly.map((m, i) => [MONTHS[i], m.kwBefore.toFixed(2), m.kwAfter.toFixed(2), m.before.toFixed(2), m.after.toFixed(2), m.savings.toFixed(2)].join(","))]
      : ["time,kw_without,kw_with", ...series.map((p) => `${p.t},${p.without.toFixed(2)},${p.with.toFixed(2)}`)];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = `see-the-peak-${type}-${view}.csv`; a.click();
  };
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }));
  const viewPeakBefore = view === "monthly" ? r.peakBefore : Math.max(...series.map((p) => p.without));
  const viewPeakAfter = view === "monthly" ? r.peakAfter : Math.max(...series.map((p) => p.with));

  return (
    <div ref={topRef} className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <Link to="/austin-at-a-glance#grid-tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Austin at a Glance</Link>
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">See the Peak</h1>
        <p className="text-muted-foreground mt-2">How a battery changes when a building draws power from the grid, and what that does to the demand charge.</p>
      </header>

      <Card className="lg:sticky lg:top-2 z-20">
        <CardContent className="p-4 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label>Building type</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setPeak(data.buildings[v].median_peak_kw); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map(([k, t]) => <SelectItem key={k} value={k}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Badge variant="secondary" className="font-normal text-xs whitespace-normal">About {b.buildings_100kw_plus.toLocaleString()} buildings of this type in Travis County have a peak of 100 kW or more. Typical peak: {kw(b.median_peak_kw)} kW.</Badge>
          </div>
          <div className="space-y-1">
            <Label>Building peak, kW</Label>
            <Input type="number" min={20} max={3000} value={peak} onChange={(e) => setPeak(Math.min(3000, Math.max(20, Number(e.target.value) || 20)))} />
            <Slider min={20} max={3000} step={1} value={[peak]} onValueChange={([v]) => setPeak(v)} />
            <p className="text-xs text-muted-foreground">Your building's highest 15-minute demand</p>
          </div>
          <div className="space-y-1">
            <Label>Battery size</Label>
            <ToggleGroup type="single" value={String(size)} onValueChange={(v) => v && setSize(Number(v) as Size)} className="justify-start">
              <ToggleGroupItem value="10" variant="outline" size="sm">10% of peak</ToggleGroupItem>
              <ToggleGroupItem value="20" variant="outline" size="sm">20% of peak</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{kw(r.batteryKw)} kW / {kw(r.batteryKwh)} kWh</p>
          </div>
          <div className="space-y-1">
            <Label>Battery control</Label>
            <ToggleGroup type="single" value={ctrl} onValueChange={(v) => v && setCtrl(v as Controller)} className="justify-start flex-wrap">
              <ToggleGroupItem value="perfect" variant="outline" size="sm" className="text-xs">Perfect forecast (best case)</ToggleGroupItem>
              <ToggleGroupItem value="forecast" variant="outline" size="sm" className="text-xs">Simple forecast (typical)</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">Real savings depend on the control software. A simple rule that guesses tomorrow's peak from last week saves far less than a battery that knows the day ahead.</p>
          </div>
          <div className="space-y-1">
            <Label>Demand charge, $/kW-month</Label>
            <Input type="number" step={0.01} min={0} value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value) || 0))} />
            <p className="text-xs text-muted-foreground">Austin Energy Secondary Voltage 2: $10.32 demand charge plus $5.03 regulatory charge. Check your bill.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="peak_day">Worst summer day</TabsTrigger>
              <TabsTrigger value="summer_weekday">Typical summer weekday</TabsTrigger>
              <TabsTrigger value="monthly">Every month</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadPng}><Download className="h-4 w-4 mr-1" />Download this chart as PNG</Button>
            <Button size="sm" variant="outline" onClick={downloadCsv}><Download className="h-4 w-4 mr-1" />Download the numbers as CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="h-[380px] bg-card" role="img" aria-label={`${b.name} demand: peak ${kw(viewPeakBefore)} kW without a battery, ${kw(viewPeakAfter)} kW with a battery.`}>
            <ResponsiveContainer width="100%" height="100%">
              {view === "monthly" ? (
                <BarChart data={r.monthly.map((m, i) => ({ month: MONTHS[i], ...m }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, "auto"]} unit=" kW" width={70} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const m = payload[0].payload;
                    return <div className="rounded border bg-popover p-2 text-xs shadow"><p className="font-medium">{label}</p><p>Without: {kw(m.kwBefore)} kW · {usd(m.before)}</p><p>With: {kw(m.kwAfter)} kW · {usd(m.after)}</p><p className="font-medium">Savings: {usd(m.savings)}</p></div>;
                  }} />
                  <Legend />
                  <Bar dataKey="kwBefore" name="Without battery" fill={GREY} />
                  <Bar dataKey="kwAfter" name="With battery" fill={GREEN} />
                </BarChart>
              ) : (
                <ComposedChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="i" type="number" domain={[0, 95]} ticks={[0, 12, 24, 36, 48, 60, 72, 84]} tickFormatter={(i) => timeLabel(i).replace(":00", "")} />
                  <YAxis domain={[0, "auto"]} unit=" kW" width={70} />
                  <ReferenceArea x1={64} x2={76} fill={AMBER} fillOpacity={0.08} label={{ value: "Approx. Austin Energy system peak", position: "insideTop", fontSize: 11 }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return <div className="rounded border bg-popover p-2 text-xs shadow"><p className="font-medium">{p.t}</p><p>Without: {p.without.toFixed(1)} kW</p><p>With: {p.with.toFixed(1)} kW</p><p>Difference: {(p.without - p.with).toFixed(1)} kW</p></div>;
                  }} />
                  <Area dataKey="without" name="Without battery" stroke={GREY} fill={GREY} fillOpacity={0.25} isAnimationActive={false} />
                  <Area dataKey="discharge" name="Battery discharging" stroke="none" fill={AMBER} fillOpacity={0.6} isAnimationActive={false} />
                  <Area dataKey="charge" name="Battery charging" stroke="none" fill="hsl(var(--secondary))" fillOpacity={0.8} isAnimationActive={false} />
                  <Line dataKey="with" name="With battery" stroke={GREEN} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <ReferenceLine y={viewPeakBefore} stroke={GREY} strokeDasharray="5 4" label={{ value: `Peak without ${kw(viewPeakBefore)} kW`, position: "insideTopRight", fontSize: 11 }} />
                  <ReferenceLine y={viewPeakAfter} stroke={GREEN} strokeDasharray="5 4" label={{ value: `Peak with ${kw(viewPeakAfter)} kW`, position: "insideBottomRight", fontSize: 11 }} />
                  <Legend />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            {view === "peak_day" && <>Worst summer day in the weather data: {peakDate}. Times are standard time (add an hour for daylight time).</>}
            {view === "summer_weekday" && <>Average of all summer weekdays (June to September).</>}
            {view === "monthly" && <>Highest 15-minute demand in each month; hover a month for its demand-charge cost.</>}
            {view !== "monthly" && (
              <UiTooltip>
                <TooltipTrigger aria-label="About the shaded 4 to 7 pm band"><Info className="h-3.5 w-3.5" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">The utility's own peak usually comes around 5 to 6 pm, later than most buildings' peak. Check ERCOT's published peak hours.</TooltipContent>
              </UiTooltip>
            )}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <p className="text-lg font-medium">A {kw(r.batteryKw)} kW battery cuts this {b.name.toLowerCase()}'s peak by {kw(r.reductionKw)} kW ({r.reductionPct.toFixed(1)}%) and saves about {usd(r.annualSavings)} a year in demand charges.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ["Highest demand", `${kw(r.peakBefore)} kW to ${kw(r.peakAfter)} kW`, `${r.reductionPct.toFixed(1)}% lower`],
            ["Demand charges per year", `${usd(r.costBefore)} to ${usd(r.costAfter)}`, `You save ${usd(r.annualSavings)} a year`],
            ["Savings per battery kW", `${usd(r.savingsPerBatteryKw)}`, "per kW of battery per year"],
            ["Demand at 5 pm (typical summer weekday)", `${kw(r.kw5pmBefore)} kW to ${kw(r.kw5pmAfter)} kW`, "This is closer to when Austin Energy's own system peaks. If the number barely changes, the battery is helping your bill more than the utility's peak, unless it is programmed to also hold charge for the late afternoon."],
            ["Annual electricity use", `${kw(r.annualKwh)} kWh`, "The battery shifts when you draw power; it does not reduce how much you use."],
          ].map(([k, v, c]) => (
            <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-bold text-primary mt-1">{v}</p><p className="text-xs text-muted-foreground mt-1">{c}</p></CardContent></Card>
          ))}
        </div>
        {ctrl === "perfect" && <Warn>Best case. This assumes the battery knows the day ahead.</Warn>}
        {r.annualSavings < 500 && <Warn>At these settings the battery saves very little. The control software matters more than the battery size.</Warn>}
        <Warn>Based on Texas-wide average building profiles. Your building will differ. Demand charges are Austin Energy rates published in 2026 and may change.</Warn>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compare all building types</CardTitle>
          <p className="text-sm text-muted-foreground">Best candidates: buildings where a good controller cuts the peak by the most dollars per kW of battery. Each row uses that type's typical peak and the battery size and control selected above.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left">
                {([["name", "Building type"], ["peak", "Typical peak kW"], ["redKw", "Peak reduction kW"], ["redPct", "Peak reduction %"], ["savings", "Annual savings $"], ["perKw", "Savings per battery kW"]] as [SortKey, string][]).map(([k, l]) => (
                  <th key={k} className="p-2"><button onClick={() => sortBy(k)} className="inline-flex items-center gap-1 hover:text-foreground">{l}<ArrowUpDown className="h-3 w-3" /></button></th>
                ))}
                <th className="p-2">Summer weekday</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.key} className={`border-t cursor-pointer hover:bg-muted/50 ${row.key === type ? "bg-muted" : ""}`}
                  onClick={() => { setType(row.key); setPeak(row.peak); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
                  <td className="p-2 font-medium">{row.name}</td>
                  <td className="p-2">{kw(row.peak)}</td>
                  <td className="p-2">{row.redKw.toFixed(1)}</td>
                  <td className="p-2">{row.redPct.toFixed(1)}%</td>
                  <td className="p-2">{usd(row.savings)}</td>
                  <td className="p-2">{usd(row.perKw)}</td>
                  <td className="p-2 w-32 h-10">
                    <ResponsiveContainer width="100%" height={32}>
                      <LineChart data={row.spark}><Line dataKey="a" stroke={GREY} dot={false} strokeWidth={1} isAnimationActive={false} /><Line dataKey="b" stroke={GREEN} dot={false} strokeWidth={1.5} isAnimationActive={false} /></LineChart>
                    </ResponsiveContainer>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
        <p>Load shapes: ComStock Texas commercial building profiles (NLR, formerly NREL), state average, weather year 2012. Building counts and typical peaks: Travis Central Appraisal District 2026 improvement data matched to building types. Estimates only; not engineering or financial advice.</p>
        <p>All math runs in your browser. No data is stored or sent.</p>
      </footer>
    </div>
  );
}
