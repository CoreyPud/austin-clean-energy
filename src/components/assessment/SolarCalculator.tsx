import { useMemo, useState, Fragment } from "react";
import EnvironmentalImpactCard from "@/components/assessment/EnvironmentalImpactCard";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { PiggyBank, Coins } from "lucide-react";
import {
  DEFAULT_PRODUCTION_PER_KW,
  CalcInputs,
  buildYearModel,
  buildThirtyYearModel,
  austinEnergyRebate,
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
  propertyType: string;
  systemKw: number;
  batteryKwh: number;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const SolarCalculator = ({ solarInsights, annualUsageKwh, uploadedKwh, propertyType, systemKw, batteryKwh }: Props) => {
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const productionPerKw = solarInsights.annualProductionKwh > 0 && maxKw > 0
    ? Math.round(solarInsights.annualProductionKwh / maxKw)
    : DEFAULT_PRODUCTION_PER_KW;

  const [costPerW, setCostPerW] = useState(2.95);
  const costPerKw = costPerW * 1000;
  const [financeMode, setFinanceMode] = useState<"cash" | "finance">("cash");
  const [loanTermYears, setLoanTermYears] = useState(20);
  const [loanRate, setLoanRate] = useState(6);

  const effectiveLoanTerm = financeMode === "cash" ? 0 : loanTermYears;

  const inputs: CalcInputs = useMemo(() => ({
    annualUsageKwh,
    systemKw,
    batteryKwh,
    loanTermYears: effectiveLoanTerm,
    loanInterestRate: loanRate / 100,
    productionPerKw,
    monthlyUsageKwh: uploadedKwh ?? undefined,
  }), [annualUsageKwh, systemKw, batteryKwh, effectiveLoanTerm, loanRate, productionPerKw, uploadedKwh]);

  const rebate = useMemo(() => austinEnergyRebate(systemKw, propertyType), [systemKw, propertyType]);
  const rebateLabel = propertyType === "commercial"
    ? "after $0.50/W rebate"
    : propertyType === "non-profit"
    ? "after $0.70/W rebate"
    : propertyType === "multi-family"
    ? "no rebate (virtual metering)"
    : "after $2,500 rebate";

  const installCost = useMemo(
    () => Math.max(0, systemKw * costPerKw + batteryKwh * 1000 - rebate),
    [systemKw, batteryKwh, costPerKw, rebate],
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
      {/* ── The Money ── */}
      <div className="flex items-end gap-3 pt-2">
        <h2 className="text-xl font-bold text-foreground leading-tight">The Money</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-border to-transparent" />
      </div>
      <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
        <Coins className="absolute top-4 right-4 h-5 w-5 text-secondary/20" aria-hidden />
        <PiggyBank className="absolute bottom-6 right-6 h-6 w-6 text-secondary/15" aria-hidden />
        <CardContent className="relative p-6 space-y-6">

          {/* Summary chips — top KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <MoneyChip label="Install cost" value={fmt$(installCost)} sub={rebateLabel} />
            <MoneyChip label="25-yr net" value={fmt$(thirtyYear.cumulativeByYear[24]?.cumulative ?? 0)} highlight />
            <MoneyChip
              label="Payback"
              value={thirtyYear.paybackYear ? `${thirtyYear.paybackYear} yrs` : "> 30 yrs"}
            />
          </div>

          {/* Savings hero */}
          <div className="border-t pt-4">
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
              <span className="font-semibold">${costPerW.toFixed(2)}/W</span>
            </div>
            <Slider
              min={1.5} max={5.0} step={0.05}
              value={[costPerW]}
              onValueChange={([v]) => setCostPerW(v)}
            />
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
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Monthly bill comparison — bar chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Monthly bill: with vs. without solar</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={billComparisonData} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={48} />
                <Tooltip formatter={(v: number) => `$${v}`} />
                <Legend />
                <Bar dataKey="Without solar" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="With solar" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 30-year cumulative — bar chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Cumulative net savings over 30 years</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt$(v)} />
                <Bar dataKey="Net savings" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {thirtyYear.paybackYear && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                System pays for itself in year {thirtyYear.paybackYear}
              </p>
            )}
          </div>

        </CardContent>
      </Card>

      {/* ── Solar Production vs. Consumption (kWh) ── */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Monthly solar production vs. your consumption (kWh)</p>
            <span className="text-xs font-semibold tabular-nums">
              {yearOne.billWithoutSolar > 0
                ? `${Math.round((yearOne.savings / yearOne.billWithoutSolar) * 100)}% bill offset`
                : "—"}
            </span>
          </div>
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
        </CardContent>
      </Card>

      <EnvironmentalImpactCard annualSolarKwh={yearOne.solarTotal} />
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
