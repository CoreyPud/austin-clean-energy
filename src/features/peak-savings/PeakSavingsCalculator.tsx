import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Copy, Download } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { calculate, defaultsFor, effective, MEASURE_LABELS, utilityCashFlow, utilityView, type Inputs, type MeasureType } from "./model";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number | null) => (n === null ? "—" : `${(n * 100).toFixed(1)}%`);

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-md border border-accent/50 bg-accent/10 p-3 text-sm text-foreground">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-accent-foreground" />
      <span>{children}</span>
    </div>
  );
}

function Field({ label, help, value, onChange, step = 1, min = 0, max, readOnly, placeholder }: {
  label: string; help?: string; value: number | null; onChange?: (v: number) => void; step?: number; min?: number; max?: number; readOnly?: boolean; placeholder?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number" inputMode="decimal" step={step} min={min} max={max} readOnly={readOnly}
        value={value === null || Number.isNaN(value) ? "" : value}
        onChange={(e) => {
          if (!onChange) return;
          let v = e.target.value === "" ? 0 : Number(e.target.value);
          if (v < min) v = min;
          if (max !== undefined && v > max) v = max;
          onChange(v);
        }}
        className={readOnly ? "bg-muted" : undefined}
      />
      {placeholder && <p className="text-xs text-muted-foreground italic">Typical placeholder, replace with your quote.</p>}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

export default function PeakSavingsCalculator() {
  const [inp, setInp] = useState<Inputs>(defaultsFor("lighting"));
  const set = <K extends keyof Inputs>(k: K) => (v: Inputs[K]) => setInp((p) => ({ ...p, [k]: v }));
  const eff = effective(inp);
  const r = useMemo(() => calculate(inp), [inp]);
  const isBattery = inp.type === "battery";
  const tp = r.thirdParty;

  const sensitivity = useMemo(() => [0.8, 1, 1.2].map((cf) => ({ cf, cells: [25, 50, 75, 100].map((c) => calculate(inp, { capturePct: c, costFactor: cf })) })), [inp]);

  const [u, setU] = useState({ kw: 1000, rate: 65, loss: 6, customers: 500000 });
  const uv = utilityView(u.kw, u.rate, u.loss, u.customers);
  const ucf = utilityCashFlow(uv.annual, inp);

  const sentence = tp
    ? `With third-party ownership, you keep about ${usd(r.year1Net)} in year 1 and ${usd(r.totalSavings)} over ${inp.life} years, with no upfront cost.`
    : r.payback !== null
      ? `At your inputs, this pays back in ${r.payback} year${r.payback === 1 ? "" : "s"} with an IRR of ${pct(r.irr)} and an NPV of ${usd(r.npv)}.`
      : `At your inputs, this does not pay back. To reach a ${inp.discountPct}% return you would need about ${usd(r.neededExtra)} more per year in savings.`;

  const chartData = [{ year: 0, net: -r.netCost, cumulative: -r.netCost }, ...r.rows.map((x) => ({ year: x.year, net: x.net, cumulative: x.cumulative }))];
  const drivers = [
    { name: "Demand-charge savings", value: r.year1Demand },
    { name: "Energy savings", value: r.year1Energy },
    { name: tp ? "Payment to owner" : "Operating cost", value: -(tp ? r.rows[0].payment : r.year1Om) },
  ];

  const copy = async () => {
    const text = [
      `Peak Savings Calculator — ${MEASURE_LABELS[inp.type]}`,
      sentence,
      `Net upfront cost: ${usd(r.netCost)}`,
      `IRR: ${tp ? "Not applicable" : r.irr === null ? "Does not pay back" : pct(r.irr)}`,
      `NPV: ${usd(r.npv)}`,
      `Payback: ${r.payback ?? "Does not pay back within the life"}`,
      `Year-1 net savings: ${usd(r.year1Net)}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Results copied");
  };
  const csv = () => {
    const lines = ["year,demand_savings,energy_savings,operating_cost,payment_to_owner,net_cash_flow,cumulative", `0,0,0,0,0,${-r.netCost},${-r.netCost}`,
      ...r.rows.map((x) => [x.year, x.demand, x.energy, x.om, x.payment, x.net, x.cumulative].map((v) => (typeof v === "number" ? v.toFixed(2) : v)).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    a.download = "peak-savings-cash-flow.csv";
    a.click();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <Link to="/austin-at-a-glance#grid-tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Austin at a Glance
      </Link>
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Peak Savings Calculator</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">Estimate the return on cutting your building's electric peak with efficiency, demand response or a battery. Austin Energy commercial rates.</p>
      </header>

      <Tabs defaultValue="owner">
        <TabsList>
          <TabsTrigger value="owner">Building owner</TabsTrigger>
          <TabsTrigger value="utility">Utility view (Austin Energy)</TabsTrigger>
        </TabsList>

        <TabsContent value="owner" className="mt-4">
          <div className="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">1. What are you doing?</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <ToggleGroup type="single" value={inp.type} onValueChange={(v) => v && setInp(defaultsFor(v as MeasureType))} className="flex flex-wrap justify-start gap-1">
                    {(Object.keys(MEASURE_LABELS) as MeasureType[]).map((t) => (
                      <ToggleGroupItem key={t} value={t} variant="outline" size="sm" className="text-xs">{MEASURE_LABELS[t]}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <button className="text-xs underline text-muted-foreground" onClick={() => setInp(defaultsFor(inp.type))}>Reset to defaults</button>
                  {isBattery && (
                    <ToggleGroup type="single" value={inp.thirdParty ? "tp" : "buy"} onValueChange={(v) => v && set("thirdParty")(v === "tp")} className="justify-start">
                      <ToggleGroupItem value="buy" variant="outline" size="sm">I buy it</ToggleGroupItem>
                      <ToggleGroupItem value="tp" variant="outline" size="sm">Third party owns it (shared savings)</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">2. Your building and bill</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <Field label="Demand charge, $/kW-month" step={0.01} value={inp.demandCharge} onChange={set("demandCharge")} help="Austin Energy's published SV2 demand rate. Large customers pay a different rate: check your bill." />
                  <Field label="Regulatory charge, $/kW-month" step={0.01} value={inp.regulatoryCharge} onChange={set("regulatoryCharge")} help="Austin Energy's pass-through for transmission and ERCOT costs, billed per kW." />
                  <p className="sm:col-span-2 text-sm font-medium">Total demand-related charge: ${r.D.toFixed(2)} per kW-month</p>
                  <Field label="Energy rate, $/kWh" step={0.0001} value={inp.energyRate} onChange={set("energyRate")} help="Check your bill; the PSA changes each year." />
                  <Field label="Months the measure lowers your billed peak, %" max={100} value={inp.capturePct} onChange={set("capturePct")} help="Your bill is set by your highest 15-minute peak each month. A measure only saves money in months where it lowers that peak." />
                  <Field label="Annual increase in rates, %" step={0.1} max={15} value={inp.rateEscPct} onChange={set("rateEscPct")} />
                  <Field label="My building's peak kW (optional)" value={inp.buildingPeakKw} onChange={(v) => set("buildingPeakKw")(v || null)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">3. The measure</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <Field label="kW removed from monthly peak" step={0.1} value={Number(eff.kwRemoved.toFixed(2))} onChange={isBattery ? undefined : set("kwRemoved")} readOnly={isBattery} placeholder={!isBattery} />
                  <Field label="kWh saved per year" value={inp.kwhSaved} onChange={set("kwhSaved")} placeholder />
                  <Field label="Upfront cost, $" value={Math.round(eff.upfront)} onChange={isBattery ? undefined : set("upfront")} readOnly={isBattery || tp} placeholder={!isBattery} />
                  <Field label="Rebate or incentive, $" value={inp.rebate} onChange={set("rebate")} />
                  {!tp && <Field label="Federal tax credit, %" max={100} value={inp.creditPct} onChange={set("creditPct")} help="Storage credits are assumed available; confirm with your tax adviser." />}
                  <Field label={inp.type === "dr" ? "Annual program cost, $/yr" : "Annual operating cost, $/yr"} value={inp.om} onChange={set("om")} placeholder />
                  <Field label="Annual loss of savings (degradation), %" step={0.1} max={100} value={inp.degPct} onChange={set("degPct")} />
                  <Field label="Life, years" min={1} max={40} value={inp.life} onChange={set("life")} />
                  <Field label="Discount rate for NPV, %" step={0.1} max={100} value={inp.discountPct} onChange={set("discountPct")} />
                  <Field label="Annual increase in operating cost, %" step={0.1} max={15} value={inp.omEscPct} onChange={set("omEscPct")} />
                </CardContent>
              </Card>

              {isBattery && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">4. Battery size</CardTitle></CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <Field label="Battery power, kW" value={inp.batteryKw} onChange={(v) => setInp((p) => ({ ...p, batteryKw: v, om: Math.round(44 * v) }))} />
                    <Field label="Duration, hours" step={0.5} value={inp.batteryHours} onChange={set("batteryHours")} />
                    <Field label="Installed cost, $/kWh" value={inp.costPerKwh} onChange={set("costPerKwh")} />
                    {tp && <Field label="Share of savings paid to owner, %" max={100} value={inp.sharePct} onChange={set("sharePct")} />}
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Shave per battery kW: {inp.shave.toFixed(2)}</Label>
                      <Slider min={0.1} max={0.8} step={0.01} value={[inp.shave]} onValueChange={([v]) => set("shave")(v)} />
                      <p className="text-xs text-muted-foreground">In a test on Texas commercial building profiles, a battery sized at 10 percent of building peak cut 0.5 to 0.8 kW per battery kW with perfect forecasting but only 0.0 to 0.3 with a simple rule. Good dispatch software is what decides your savings.</p>
                      <p className="text-sm font-medium">kW removed from your monthly peak: {eff.kwRemoved.toFixed(1)} kW</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-lg font-medium text-foreground">{sentence}</p>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {(tp
                  ? [["IRR", "Not applicable: no upfront cost"], ["Total over life", usd(r.totalSavings)], ["Payment to owner, year 1", usd(r.rows[0].payment)], ["Net annual savings to you, year 1", usd(r.year1Net)]]
                  : [["IRR", r.irr === null || r.payback === null && r.irr === null ? "Does not pay back" : pct(r.irr)], ["NPV", usd(r.npv)], ["Payback (years)", r.payback === null ? "Does not pay back within the life" : String(r.payback)], ["Year-1 net savings", usd(r.year1Net)]]
                ).map(([k, v]) => (
                  <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-xl font-bold text-primary mt-1 break-words">{v}</p></CardContent></Card>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <p>Year-1 demand savings: <strong>{usd(r.year1Demand)}</strong></p>
                <p>Year-1 energy savings: <strong>{usd(r.year1Energy)}</strong></p>
                <p>Net total gain: <strong>{usd(r.netGain)}</strong></p>
              </div>

              <div className="space-y-2">
                {isBattery && inp.shave > 0.6 && <Warn>A shave above 0.6 needs perfect forecasting. Treat results above that as a best case.</Warn>}
                {inp.capturePct > 90 && <Warn>Few buildings lower their peak in nearly every month.</Warn>}
                {inp.buildingPeakKw && eff.kwRemoved > 0.3 * inp.buildingPeakKw && <Warn>That is a large share of your peak; check the estimate with your installer.</Warn>}
                <Warn>Demand charges here are Austin Energy rates published in 2026 and may change. A pending Texas PUC rule (replacing 4CP with 12CP) may change how transmission costs are allocated. Check your bill.</Warn>
              </div>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Cash flow by year</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copy}><Copy className="h-4 w-4 mr-1" />Copy results</Button>
                    <Button size="sm" variant="outline" onClick={csv}><Download className="h-4 w-4 mr-1" />Download CSV</Button>
                  </div>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => usd(v)} labelFormatter={(l) => `Year ${l}`} />
                      <Bar dataKey="net" name="Net cash flow">
                        {chartData.map((d) => <Cell key={d.year} fill={d.net < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />)}
                      </Bar>
                      <Line dataKey="cumulative" name="Cumulative" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">What drives your result (year 1)</CardTitle></CardHeader>
                <CardContent className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={drivers} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" tickFormatter={(v) => usd(v)} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => usd(v)} />
                      <Bar dataKey="value">{drivers.map((d) => <Cell key={d.name} fill={d.value < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {!tp && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Sensitivity: IRR by capture and upfront cost</CardTitle></CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-muted-foreground"><th className="text-left p-2">Upfront cost</th>{[25, 50, 75, 100].map((c) => <th key={c} className="p-2 text-right">{c}% capture</th>)}</tr></thead>
                      <tbody>
                        {sensitivity.map((row) => (
                          <tr key={row.cf} className="border-t">
                            <td className="p-2">{row.cf * 100}% of entered</td>
                            {row.cells.map((c, i) => <td key={i} className="p-2 text-right">{c.payback === null ? "—" : pct(c.irr)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}

              <Accordion type="single" collapsible>
                <AccordionItem value="how">
                  <AccordionTrigger>How this is calculated</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Each year's savings = (kW removed × total demand charge × 12 months × capture %) + (kWh saved × energy rate), grown by the rate increase and reduced by degradation each year.</p>
                    <p>Operating cost grows by its own annual increase. Net upfront cost = upfront × (1 − tax credit) − rebate.</p>
                    <p>IRR is the discount rate at which the cash flows sum to zero (solved by bisection). NPV discounts each year at your discount rate. Payback is the first year cumulative cash flow reaches zero.</p>
                    <p>For a battery, kW removed = battery kW × shave, and upfront cost = kW × hours × $/kWh. With third-party ownership you pay no upfront cost and share the stated percent of savings with the owner.</p>
                    <p>If it does not pay back, the extra savings needed = net cost × capital recovery factor (discount rate, life) + year-1 operating cost − year-1 savings.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="utility" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Value of cutting Austin Energy's summer peaks</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="kW reduced at the four summer peaks" value={u.kw} onChange={(v) => setU({ ...u, kw: v })} />
              <Field label="Transmission rate, $/kW-year" value={u.rate} onChange={(v) => setU({ ...u, rate: v })} help="Rough 2024 estimate: about $5.1 billion transmission cost spread over about 80 GW of peak load; replace with the current rate." />
              <Field label="Line-loss gross-up, %" max={100} value={u.loss} onChange={(v) => setU({ ...u, loss: v })} />
              <Field label="Austin Energy customers" value={u.customers} onChange={(v) => setU({ ...u, customers: v })} help="Approximation, replace." />
            </CardContent>
          </Card>
          <p className="text-lg font-medium">{(u.kw / 1000).toLocaleString()} MW cut at the four peaks is worth about {usd(uv.annual)} a year to Austin Energy, or about {(uv.perCustomer * 100).toFixed(0)} cents per customer.</p>
          <p className="text-sm text-muted-foreground">The four-coincident-peak charge counts one 15-minute system peak in each of June through September and sets the next calendar year's transmission charges. A proposed 12CP rule would use monthly peaks in all 12 months.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Upfront cost (from owner tab)", usd(ucf.netCost)], ["IRR", ucf.irr === null ? "Does not pay back" : pct(ucf.irr)], ["NPV", usd(ucf.npv)], ["Payback (years)", ucf.payback === null ? "Does not pay back" : String(ucf.payback)]].map(([k, v]) => (
              <Card key={k}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-xl font-bold text-primary mt-1">{v}</p></CardContent></Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">The IRR block uses the same cost, life and escalation fields as the Building owner tab, with savings set to the utility's annual value above.</p>
        </TabsContent>
      </Tabs>

      <footer className="border-t pt-4 text-xs text-muted-foreground space-y-1">
        <p>Estimates only, not financial, tax or engineering advice. Costs and savings are placeholders until you have quotes. Rates: Austin Energy commercial rate schedule (Secondary Voltage 2). Peak-shaving behavior: modeled on Texas commercial building load profiles.</p>
        <p>No data is stored or sent anywhere.</p>
      </footer>
    </div>
  );
}
