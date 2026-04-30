import { useMemo, useState, useEffect, Fragment } from "react";
import EnvironmentalImpactCard from "@/components/assessment/EnvironmentalImpactCard";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { PiggyBank, Coins } from "lucide-react";
import {
  AUSTIN_ENERGY_SOLAR_REBATE,
  DEFAULT_PRODUCTION_PER_KW,
  CalcInputs,
  buildYearModel,
  buildThirtyYearModel,
} from "@/lib/solar-model";

interface Props {
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    annualProductionKwh: number;
    sunshineHours: number;
  };
  annualUsageKwh: number;
  uploadedKwh?: number[] | null;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const SolarCalculator = ({ solarInsights, annualUsageKwh, uploadedKwh }: Props) => {
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const productionPerKw = solarInsights.annualProductionKwh > 0 && maxKw > 0
    ? Math.round(solarInsights.annualProductionKwh / maxKw)
    : DEFAULT_PRODUCTION_PER_KW;

  const [batteryKwh, setBatteryKwh] = useState(0);
  const [costPerKw, setCostPerKw] = useState(2950);
  const [financeMode, setFinanceMode] = useState<"cash" | "finance">("cash");
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [loanRate, setLoanRate] = useState(6);

  const effectiveLoanTerm = financeMode === "cash" ? 0 : loanTermYears;

  const recommendedSystemKw = useMemo(() => productionPerKw > 0
    ? Math.round(Math.min(Math.max(annualUsageKwh / productionPerKw, 2), maxKw) * 2) / 2
    : Math.min(4, maxKw),
  [annualUsageKwh, productionPerKw, maxKw]);

  const [systemKw, setSystemKw] = useState(recommendedSystemKw);

  useEffect(() => {
    setSystemKw(recommendedSystemKw);
  }, [recommendedSystemKw]);

  const inputs: CalcInputs = useMemo(() => ({
    annualUsageKwh,
    systemKw,
    batteryKwh,
    loanTermYears: effectiveLoanTerm,
    loanInterestRate: loanRate / 100,
    productionPerKw,
    monthlyUsageKwh: uploadedKwh ?? undefined,
  }), [annualUsageKwh, systemKw, batteryKwh, effectiveLoanTerm, loanRate, productionPerKw, uploadedKwh]);

  const installCost = useMemo(
    () => Math.max(0, systemKw * costPerKw + batteryKwh * 1000 - AUSTIN_ENERGY_SOLAR_REBATE),
    [systemKw, batteryKwh, costPerKw],
  );

  const yearOne = useMemo(() => buildYearModel(inputs, 0), [inputs]);
  const thirtyYear = useMemo(() => buildThirtyYearModel(inputs, installCost), [inputs, installCost]);

  const billComparisonData = yearOne.monthlyRows.map(r => ({
    month: r.month,
    "Without solar": Math.round(r.billWithoutSolar),
    "With solar": Math.round(r.billWithSolar),
  }));

  const energyBalanceData = yearOne.monthlyRows.map(r => ({
    month: r.month,
    "Production": Math.round(r.solar),
    "Consumption": Math.round(r.usage),
  }));

  const cumulativeData = thirtyYear.cumulativeByYear.map(d => ({
    year: `Yr ${d.year}`,
    "Net savings": d.cumulative,
  }));

  return (
    <Fragment>
      {/* ── Run the Numbers: system size + battery + energy chart ── */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardContent className="pt-6 space-y-6">
          {/* Sliders */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* System size */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">System size</span>
                <span className="font-semibold">{systemKw.toFixed(1)} kW</span>
              </div>
              <Slider
                min={1} max={Math.max(maxKw, 16)} step={0.5}
                value={[systemKw]}
                onValueChange={([v]) => setSystemKw(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 kW</span>
                <span>{maxKw.toFixed(0)} kW max</span>
              </div>
            </div>

            {/* Battery */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Battery storage</span>
                <span className="font-semibold">{batteryKwh === 0 ? "None" : `${batteryKwh} kWh`}</span>
              </div>
              <Slider
                min={0} max={30} step={5}
                value={[batteryKwh]}
                onValueChange={([v]) => setBatteryKwh(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>None</span><span>30 kWh</span>
              </div>
            </div>
          </div>

          {/* Energy balance chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Monthly solar production vs. your consumption (kWh)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={energyBalanceData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${Math.round(v)} kWh`} />
                <Legend />
                <Bar dataKey="Production" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Consumption" fill="hsl(var(--muted-foreground) / 0.4)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <EnvironmentalImpactCard annualSolarKwh={yearOne.solarTotal} />

      {/* ── The Money ── */}
      <div className="flex items-end gap-3 pt-2">
        <h2 className="text-xl font-bold text-foreground leading-tight">The Money</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-border to-transparent" />
      </div>
      <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
        <Coins className="absolute top-4 right-4 h-5 w-5 text-secondary/20" aria-hidden />
        <PiggyBank className="absolute bottom-6 right-6 h-6 w-6 text-secondary/15" aria-hidden />
        <CardContent className="relative p-6 space-y-6">

          {/* Savings hero */}
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-5xl md:text-6xl font-bold text-secondary tabular-nums">
                {fmt$(yearOne.savings)}
              </span>
              <span className="text-lg text-muted-foreground font-medium">/ year saved</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Estimated annual reduction in your Austin Energy bill.
            </p>
          </div>

          {/* Install cost */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Install cost</span>
              <span className="font-semibold">${costPerKw.toLocaleString()}/kW</span>
            </div>
            <Slider
              min={1500} max={5000} step={50}
              value={[costPerKw]}
              onValueChange={([v]) => setCostPerKw(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$1,500/kW</span><span>$5,000/kW</span>
            </div>
          </div>

          {/* Financing */}
          <div className="border-t pt-4">
            <Tabs value={financeMode} onValueChange={(v) => setFinanceMode(v as "cash" | "finance")}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-muted-foreground shrink-0">Financing</span>
                <TabsList className="h-7">
                  <TabsTrigger value="cash" className="text-xs px-3 h-6">Cash</TabsTrigger>
                  <TabsTrigger value="finance" className="text-xs px-3 h-6">Finance</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="finance" className="mt-0 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Loan term</span>
                    <span className="font-semibold">{loanTermYears} yr</span>
                  </div>
                  <Slider
                    min={5} max={30} step={5}
                    value={[loanTermYears]}
                    onValueChange={([v]) => setLoanTermYears(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>5 yr</span><span>30 yr</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Interest rate</span>
                    <span className="font-semibold">{loanRate}%</span>
                  </div>
                  <Slider
                    min={3} max={12} step={0.5}
                    value={[loanRate]}
                    onValueChange={([v]) => setLoanRate(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3%</span><span>12%</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Monthly bill comparison */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Monthly bill: with vs. without solar</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={billComparisonData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillWithout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="fillWith" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={48} />
                <Tooltip formatter={(v: number) => `$${v}`} />
                <Legend />
                <Area type="monotone" dataKey="Without solar" stroke="hsl(var(--secondary))" strokeWidth={2} fill="url(#fillWithout)" dot={false} />
                <Area type="monotone" dataKey="With solar" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#fillWith)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 30-year cumulative chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Cumulative net savings over 30 years</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt$(v)} />
                <Area
                  type="monotone"
                  dataKey="Net savings"
                  stroke="hsl(var(--secondary))"
                  fill="hsl(var(--secondary) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            {thirtyYear.paybackYear && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                System pays for itself in year {thirtyYear.paybackYear}
              </p>
            )}
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-2">
            <MoneyChip label="Install cost" value={fmt$(installCost)} sub="after $2,500 rebate" />
            <MoneyChip label="25-yr net" value={fmt$(thirtyYear.cumulativeByYear[24]?.cumulative ?? 0)} highlight />
            <MoneyChip
              label="Payback"
              value={thirtyYear.paybackYear ? `${thirtyYear.paybackYear} yrs` : "> 30 yrs"}
            />
          </div>
        </CardContent>
      </Card>
    </Fragment>
  );
};

const MoneyChip = ({
  label, value, sub, highlight,
}: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) => (
  <div className={`px-3 py-2 rounded-lg border bg-background/70 ${highlight ? "border-secondary/40 ring-1 ring-secondary/20" : ""}`}>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className={`text-lg font-bold tabular-nums ${highlight ? "text-secondary" : "text-foreground"}`}>{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

export default SolarCalculator;
