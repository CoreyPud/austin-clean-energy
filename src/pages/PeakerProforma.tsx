import { useMemo, useState } from "react";
import { Info, Copy, Check, Flame, DollarSign, TrendingUp, Percent, Factory } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RTooltip, Legend,
  CartesianGrid, AreaChart, Area, ReferenceLine,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

type Inputs = {
  mw: number; capexKw: number; cf: number; deg: number; heatRate: number; fuel: number; fuelEsc: number;
  price: number; priceEsc: number; ancillary: number; fom: number; vom: number; debtShare: number;
  interest: number; wacc: number; life: number; decom: number; tax: number; loanTerm: number;
};

const DEFAULTS: Inputs = {
  mw: 200, capexKw: 1350, cf: 12, deg: 0.5, heatRate: 9500, fuel: 3.25, fuelEsc: 2.5, price: 135, priceEsc: 2,
  ancillary: 35, fom: 22, vom: 5.5, debtShare: 60, interest: 7, wacc: 8.5, life: 40, decom: 15_000_000, tax: 21, loanTerm: 15,
};

type Ctl = { key: keyof Inputs; label: string; min: number; max: number; step: number; fmt: (v: number) => string };
const fmtUsd = (v: number, d = 2) => `$${v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const GROUPS: { title: string; ctls: Ctl[] }[] = [
  { title: "Plant", ctls: [
    { key: "mw", label: "Plant capacity", min: 50, max: 500, step: 10, fmt: (v) => `${v} MW` },
    { key: "capexKw", label: "CapEx", min: 800, max: 4000, step: 10, fmt: (v) => `${fmtUsd(v, 0)} /kW` },
    { key: "cf", label: "Capacity factor", min: 2, max: 30, step: 0.5, fmt: (v) => `${v.toFixed(1)}%` },
    { key: "deg", label: "Output degradation", min: 0, max: 2, step: 0.05, fmt: (v) => `${v.toFixed(2)}% /yr` },
    { key: "heatRate", label: "Heat rate", min: 8000, max: 12000, step: 100, fmt: (v) => `${v.toLocaleString()} BTU/kWh` },
    { key: "life", label: "Plant life", min: 10, max: 60, step: 1, fmt: (v) => `${v} yrs` },
    { key: "decom", label: "Decommissioning cost", min: 0, max: 50_000_000, step: 500_000, fmt: (v) => `$${(v / 1e6).toFixed(1)}M` },
  ]},
  { title: "Fuel & market", ctls: [
    { key: "fuel", label: "Base fuel price", min: 1.5, max: 10, step: 0.05, fmt: (v) => `${fmtUsd(v)} /MMBtu` },
    { key: "fuelEsc", label: "Fuel escalator", min: 0, max: 8, step: 0.1, fmt: (v) => `${v.toFixed(1)}% /yr` },
    { key: "price", label: "Realized energy price", min: 40, max: 300, step: 1, fmt: (v) => `${fmtUsd(v)} /MWh` },
    { key: "priceEsc", label: "Price escalator", min: 0, max: 5, step: 0.1, fmt: (v) => `${v.toFixed(1)}% /yr` },
    { key: "ancillary", label: "Ancillary services", min: 0, max: 100, step: 1, fmt: (v) => `${fmtUsd(v)} /kW-yr` },
  ]},
  { title: "Operating costs", ctls: [
    { key: "fom", label: "Fixed O&M", min: 5, max: 60, step: 0.5, fmt: (v) => `${fmtUsd(v)} /kW-yr` },
    { key: "vom", label: "Variable O&M", min: 0, max: 20, step: 0.25, fmt: (v) => `${fmtUsd(v)} /MWh` },
  ]},
  { title: "Financing & tax", ctls: [
    { key: "debtShare", label: "Debt share", min: 0, max: 90, step: 1, fmt: (v) => `${v}% debt / ${100 - v}% equity` },
    { key: "interest", label: "Interest rate", min: 2, max: 14, step: 0.1, fmt: (v) => `${v.toFixed(1)}%` },
    { key: "loanTerm", label: "Loan term", min: 5, max: 40, step: 1, fmt: (v) => `${v} yrs` },
    { key: "wacc", label: "WACC / discount rate", min: 3, max: 15, step: 0.1, fmt: (v) => `${v.toFixed(1)}%` },
    { key: "tax", label: "Corporate tax rate", min: 0, max: 40, step: 0.5, fmt: (v) => `${v.toFixed(1)}%` },
  ]},
];
function npv(rate: number, cfs: number[]) {
  return cfs.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
}
function dnpv(rate: number, cfs: number[]) {
  return cfs.reduce((s, cf, t) => s - (t * cf) / Math.pow(1 + rate, t + 1), 0);
}
/** Newton-Raphson with secant fallback; null when no real root found. */
function irr(cfs: number[]): number | null {
  if (!cfs.some((c) => c > 0) || !cfs.some((c) => c < 0)) return null;
  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = npv(r, cfs), d = dnpv(r, cfs);
    if (!isFinite(f) || !isFinite(d) || d === 0) break;
    const next = r - f / d;
    if (next <= -0.99) break;
    if (Math.abs(next - r) < 1e-9) return next;
    r = next;
  }
  let a = -0.9, b = 1.0;
  for (let i = 0; i < 200; i++) {
    const fa = npv(a, cfs), fb = npv(b, cfs);
    if (fb === fa) break;
    const c = b - (fb * (b - a)) / (fb - fa);
    if (!isFinite(c) || c <= -0.99) break;
    if (Math.abs(c - b) < 1e-9) return c;
    a = b; b = c;
  }
  return null;
}
function pmt(rate: number, n: number, pv: number) {
  return rate === 0 ? pv / n : (pv * rate) / (1 - Math.pow(1 + rate, -n));
}

function model(i: Inputs) {
  const L = i.life, tax = i.tax / 100, wacc = i.wacc / 100, ir = i.interest / 100;
  const capex = i.mw * 1000 * i.capexKw;
  const mwhBase = i.mw * 8760 * (i.cf / 100);
  const dep = capex / L;
  const debt = capex * (i.debtShare / 100);
  const equity = capex - debt;
  const payment = debt > 0 ? pmt(ir, i.loanTerm, debt) : 0;
  let bal = debt;
  const rows = [];
  let totalFuel = 0, totalOm = 0, totalInterest = 0, totalTaxes = 0, totalMwh = 0;
  let pvFuel = 0, pvOm = 0, pvInterest = 0, pvTaxes = 0;
  for (let y = 1; y <= L; y++) {
    const pE = Math.pow(1 + i.priceEsc / 100, y - 1);
    const fE = Math.pow(1 + i.fuelEsc / 100, y - 1);
    const mwh = mwhBase * Math.pow(1 - i.deg / 100, y - 1);
    const energyRev = mwh * i.price * pE;
    const ancRev = i.mw * 1000 * i.ancillary * pE;
    const revenue = energyRev + ancRev;
    const fuel = ((mwh * i.heatRate) / 1000) * i.fuel * fE;
    const fixedOm = i.mw * 1000 * i.fom;
    const varOm = mwh * i.vom;
    const om = fixedOm + varOm;
    const ebitda = revenue - fuel - om;
    const interest = y <= i.loanTerm ? bal * ir : 0;
    const principal = y <= i.loanTerm ? payment - interest : 0;
    bal = Math.max(0, bal - principal);
    const ebt = ebitda - dep - interest;
    const taxes = Math.max(0, ebt * tax);
    const netIncome = ebt - taxes;
    const fcff = ebitda * (1 - tax) + dep * tax;
    const decom = y === L ? i.decom : 0;
    const projectCf = fcff - decom;
    const leveredCf = ebitda - interest - principal - taxes - decom;
    const df = Math.pow(1 + wacc, y);
    totalFuel += fuel; totalOm += om; totalInterest += interest; totalTaxes += taxes; totalMwh += mwh;
    pvFuel += fuel / df; pvOm += om / df; pvInterest += interest / df; pvTaxes += taxes / df;
    rows.push({ year: y, mwh, energyRev, ancRev, revenue, fuel, fixedOm, varOm, om, ebitda, dep, interest, principal, debtService: interest + principal, ebt, taxes, netIncome, fcff, projectCf, leveredCf });
  }
  const cf0 = -capex - i.decom / Math.pow(1 + wacc, L);
  const projectCfs = [cf0, ...rows.map((r) => r.projectCf)];
  const equityCfs = [-equity, ...rows.map((r) => r.leveredCf)];
  let cum = cf0, payback: number | null = null;
  const cumulative = [{ year: 0, cumulative: cf0 / 1e6 }];
  rows.forEach((r) => {
    const prev = cum;
    cum += r.projectCf;
    if (payback === null && prev < 0 && cum >= 0) payback = r.year - 1 + -prev / r.projectCf;
    cumulative.push({ year: r.year, cumulative: cum / 1e6 });
  });
  const totalCostNominal = capex + totalFuel + totalOm + totalInterest + totalTaxes + i.decom;
  const totalCostPv = capex + pvFuel + pvOm + pvInterest + pvTaxes + i.decom / Math.pow(1 + wacc, L);
  return {
    capex, rows, cumulative, payback,
    npv: npv(wacc, projectCfs), projectIrr: irr(projectCfs), equityIrr: debt >= capex ? null : irr(equityCfs),
    totalCostNominal, totalCostPv, costPerMwh: totalMwh > 0 ? totalCostNominal / totalMwh : null,
  };
}

const m = (v: number) => (v / 1e6).toFixed(2);
const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);

function Kpi({ label, value, tip, icon: Icon, tone }: { label: string; value: string; tip: string; icon: typeof Info; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span>
        <Tooltip>
          <TooltipTrigger aria-label={`About ${label}`}><Info className="h-3.5 w-3.5" /></TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
        </Tooltip>
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function CostStrip({ nominal, pv, perMwh, life, wacc, deg }: { nominal: number; pv: number; perMwh: number | null; life: number; wacc: number; deg: number }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Factory className="h-3.5 w-3.5" />Total cost of ownership, {life} years</span>
        <Tooltip>
          <TooltipTrigger aria-label="About total cost of ownership"><Info className="h-3.5 w-3.5" /></TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Every dollar the plant costs over its life: build cost, fuel, fixed and variable O&amp;M, loan interest, income taxes,
            and one decommissioning charge. Loan principal is left out because the build cost is already counted in full.
            Fuel and variable O&amp;M fall as output declines at {deg.toFixed(2)}% per year.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">${m(nominal)}M</div>
          <div className="mt-1 text-xs text-muted-foreground">As paid, in the dollars of each year</div>
        </div>
        <div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">${m(pv)}M</div>
          <div className="mt-1 text-xs text-muted-foreground">In today's dollars, discounted at {wacc}% WACC</div>
        </div>
        <div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{perMwh === null ? "n/a" : `$${perMwh.toFixed(2)}`} /MWh</div>
          <div className="mt-1 text-xs text-muted-foreground">All-in cost per MWh delivered over the plant life</div>
        </div>
      </div>
    </section>
  );
}

export default function PeakerProforma() {
  useSeo({
    title: "Gas Peaker Proforma: ERCOT South / Austin",
    description: "Interactive 40-year financial model for a natural gas peaker plant in ERCOT South: IRR, NPV, equity IRR, EBITDA and payback.",
  });
  const [inp, setInp] = useState<Inputs>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const r = useMemo(() => model(inp), [inp]);
  const y1 = r.rows[0];
  const irrTone = (v: number | null) => (v === null ? "bad" : v > 0.1 ? "good" : undefined);

  const barData = r.rows.map((x) => ({
    year: x.year, Revenue: +m(x.revenue), Fuel: -+m(x.fuel), "O&M": -+m(x.om), "Debt service": -+m(x.debtService),
    EBITDA: +m(x.ebitda), "Cash after debt": +m(x.ebitda - x.debtService),
  }));

  const copyCsv = async () => {
    const head = ["Year", "Gen (MWh)", "Revenue ($M)", "Fuel ($M)", "O&M ($M)", "EBITDA ($M)", "Debt Service ($M)", "Net Income ($M)", "FCFF ($M)"];
    const lines = r.rows.map((x) => [x.year, Math.round(x.mwh), m(x.revenue), m(x.fuel), m(x.om), m(x.ebitda), m(x.debtService), m(x.netIncome), m(x.fcff)].join(","));
    await navigator.clipboard.writeText([head.join(","), ...lines].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <PageHeader title="Gas Peaker Proforma" subtitle="A 40-year financial model for a new natural gas peaker in ERCOT South / Austin. Move the sliders to test the assumptions." />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-16 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 rounded-lg border border-border bg-card p-4 h-fit lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Assumptions</h2>
            <Button variant="ghost" size="sm" onClick={() => setInp(DEFAULTS)}>Reset</Button>
          </div>
          {GROUPS.map((g) => (
            <section key={g.title} className="space-y-4 border-t border-border pt-4">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{g.title}</h3>
              {g.ctls.map((c) => (
                <div key={c.key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="tabular-nums text-primary">{c.fmt(inp[c.key])}</span>
                  </div>
                  <Slider min={c.min} max={c.max} step={c.step} value={[inp[c.key]]}
                    onValueChange={([v]) => setInp((s) => ({ ...s, [c.key]: v }))} aria-label={c.label} />
                </div>
              ))}
            </section>
          ))}
        </aside>

        <main className="space-y-6 min-w-0">
          <CostStrip nominal={r.totalCostNominal} pv={r.totalCostPv} perMwh={r.costPerMwh} life={inp.life} wacc={inp.wacc} deg={inp.deg} />

          <div className="grid gap-3 grid-cols-2 xl:grid-cols-5">
            <Kpi label="Project IRR" value={pct(r.projectIrr)} icon={Percent} tone={irrTone(r.projectIrr)}
              tip="Unlevered IRR on Year 0 CapEx (plus discounted decommissioning) and after-tax FCFF. Green when above 10%." />
            <Kpi label="Project NPV" value={`$${m(r.npv)}M`} icon={DollarSign} tone={r.npv >= 0 ? "good" : "bad"}
              tip={`Sum of unlevered cash flows discounted at the ${inp.wacc}% WACC.`} />
            <Kpi label="Equity IRR" value={pct(r.equityIrr)} icon={TrendingUp} tone={irrTone(r.equityIrr)}
              tip={`Levered return on the ${100 - inp.debtShare}% equity outlay, after ${inp.loanTerm}-year debt service (PMT) and taxes.`} />
            <Kpi label="Year 1 EBITDA" value={`$${m(y1.ebitda)}M`} icon={Flame} tone={y1.ebitda >= 0 ? undefined : "bad"}
              tip="Energy + ancillary revenue minus fuel, fixed O&M and variable O&M in the first operating year." />
            <Kpi label="Total CapEx" value={`$${m(r.capex)}M`} icon={Factory}
              tip="Plant capacity × 1,000 × CapEx per kW. Depreciated straight-line over plant life." />
          </div>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Revenue vs. cost, {inp.life} years ($M)</h2>
            <p className="text-xs text-muted-foreground mb-3">Costs shown below zero, including {inp.loanTerm}-year loan payments (interest + principal). EBITDA is revenue minus fuel and O&M; "Cash after debt" also subtracts loan payments.</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={barData} stackOffset="sign">
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", color: "hsl(var(--popover-foreground))" }} formatter={(v: number) => `$${Math.abs(v).toFixed(2)}M`} labelFormatter={(l) => `Year ${l}`} />
                  <Legend />
                  <Bar dataKey="Revenue" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="Fuel" stackId="a" fill="hsl(var(--destructive))" />
                  <Bar dataKey="O&M" stackId="a" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="Debt service" stackId="a" fill="hsl(var(--accent))" />
                  <Line dataKey="EBITDA" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                  <Line dataKey="Cash after debt" stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="font-semibold">Cumulative unlevered free cash flow ($M)</h2>
            <p className="text-xs text-muted-foreground mb-3">
              {r.payback !== null ? `Payback in about ${r.payback.toFixed(1)} years.` : `No payback within ${inp.life} years.`}
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={r.cumulative}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", color: "hsl(var(--popover-foreground))" }} formatter={(v: number) => `$${v.toFixed(2)}M`} labelFormatter={(l) => `Year ${l}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--foreground))" />
                  {r.payback !== null && <ReferenceLine x={Math.ceil(r.payback)} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Payback", fill: "hsl(var(--primary))", fontSize: 12 }} />}
                  <Area dataKey="cumulative" name="Cumulative FCF" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Annual proforma</h2>
              <Button variant="outline" size="sm" onClick={copyCsv}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}{copied ? "Copied" : "Copy to CSV"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="text-muted-foreground text-xs border-b border-border">
                  <tr>{["Year", "Gen (MWh)", "Revenue ($M)", "Fuel ($M)", "O&M ($M)", "EBITDA ($M)", "Debt Service ($M)", "Net Income ($M)", "FCFF ($M)"].map((h) => <th key={h} className="py-2 px-2 text-right first:text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {r.rows.map((x) => (
                    <tr key={x.year} className="border-b border-border/50">
                      <td className="py-1.5 px-2">{x.year}</td>
                      <td className="px-2 text-right">{Math.round(x.mwh).toLocaleString()}</td>
                      <td className="px-2 text-right">{m(x.revenue)}</td>
                      <td className="px-2 text-right">{m(x.fuel)}</td>
                      <td className="px-2 text-right">{m(x.om)}</td>
                      <td className="px-2 text-right">{m(x.ebitda)}</td>
                      <td className={`px-2 text-right ${x.debtService > 0 ? "" : "text-muted-foreground"}`}>{m(x.debtService)}</td>
                      <td className={`px-2 text-right ${x.netIncome < 0 ? "text-destructive" : ""}`}>{m(x.netIncome)}</td>
                      <td className="px-2 text-right">{m(x.fcff)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            Illustrative model, not investment advice. Default assumptions are user-supplied planning values, not Austin Energy figures.
            Energy and ancillary revenue escalate with the price escalator; fuel escalates with the fuel escalator; O&M is held flat.
            Final-year cash flow subtracts decommissioning cost; Year 0 also includes its present value, as specified.
            Annual generation declines at the output-degradation rate you set, applied to energy only: fixed O&M and ancillary
            services stay charged on nameplate capacity. The total cost of ownership counts the build cost once and
            decommissioning once, and excludes loan principal so the same plant is not paid for twice.
          </p>
        </main>
      </div>
    </div>
  );
}
