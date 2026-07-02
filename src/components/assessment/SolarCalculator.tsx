import { useMemo, useState, Fragment } from "react";
import { ChevronDown } from "lucide-react";
import EnvironmentalImpactCard from "@/components/assessment/EnvironmentalImpactCard";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  DEFAULT_PRODUCTION_PER_KW,
  CalcInputs,
  buildYearModel,
  buildThirtyYearModel,
  buildSsoModel,
  austinEnergyRebate,
  AUSTIN_ENERGY_RATES,
} from "@/lib/solar-model";

interface Props {
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    annualProductionKwh: number;
    sunshineHours: number;
    carbonOffsetKgPerMwh?: number | null;
  };
  annualUsageKwh: number;
  uploadedKwh?: number[] | null;
  propertyType: string;
  systemKw: number;
  batteryKwh: number;
  billingMode?: "vos" | "sso";
  costPerW: number;
  onCostPerWChange: (v: number) => void;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const SolarCalculator = ({ solarInsights, annualUsageKwh, uploadedKwh, propertyType, systemKw, batteryKwh, billingMode = "vos", costPerW, onCostPerWChange }: Props) => {
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const productionPerKw = solarInsights.annualProductionKwh > 0 && maxKw > 0
    ? Math.round(solarInsights.annualProductionKwh / maxKw)
    : DEFAULT_PRODUCTION_PER_KW;

  const [showMethodology, setShowMethodology] = useState(false);
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
    ? "after $0.70/W rebate (up to 100 kW)"
    : propertyType === "non-profit"
    ? "after $1.00/W rebate (up to 200 kW)"
    : propertyType === "multi-family"
    ? "no rebate (virtual metering)"
    : "after $4,000 rebate";

  const grossCost = systemKw * costPerKw + batteryKwh * 1000;
  const installCost = useMemo(
    () => Math.max(0, grossCost - rebate),
    [grossCost, rebate],
  );

  const yearOne = useMemo(() => buildYearModel(inputs, 0), [inputs]);
  const thirtyYear = useMemo(() => buildThirtyYearModel(inputs, installCost), [inputs, installCost]);
  // SSO installs don't qualify for the AE Solar PV rebate (separate programs)
  const sso = useMemo(() => buildSsoModel(systemKw, productionPerKw, grossCost), [systemKw, productionPerKw, grossCost]);

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

  const cumulativeData = (billingMode === "sso" ? sso.cumulativeByYear : thirtyYear.cumulativeByYear).map(d => ({
    year: `Year ${d.year}`,
    "Net savings": d.cumulative,
  }));

  return (
    <Fragment>
      {/* ── The Money ── */}
      <div id="section-money" className="flex items-end gap-3 pt-2 scroll-mt-52">
        <h2 className="text-xl font-bold text-foreground leading-tight">The Money</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-secondary/30 via-border to-transparent" />
      </div>
      <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
        <CardContent className="relative p-6 space-y-6">

          {/* Install cost breakdown + slider */}
          <div id="section-install" className="grid grid-cols-2 gap-6 border-b pb-6 scroll-mt-52">
            <div className="pt-2">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-5xl md:text-6xl font-bold text-foreground tabular-nums">
                  {fmt$(billingMode === "sso" ? grossCost : installCost)}
                </span>
                <span className="text-base text-muted-foreground font-medium">
                  {billingMode === "sso" ? "gross install cost" : "net install cost"}
                </span>
              </div>
              {billingMode === "sso" ? (
                <p className="text-xs text-muted-foreground">AE Solar PV rebate does not apply to Standard Offer installs</p>
              ) : rebate > 0 ? (
                <p className="text-xs text-muted-foreground">
                  <span className="text-muted-foreground">{fmt$(grossCost)}</span>
                  <span className="mx-1">gross –</span>
                  <span className="text-emerald-700">{fmt$(rebate)}</span>
                  <span className="ml-1">
                    {propertyType === "commercial" ? "$0.70/W rebate (up to 100 kW)"
                      : propertyType === "non-profit" ? "$1.00/W rebate (up to 200 kW)"
                      : "Austin Energy rebate"}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {propertyType === "multi-family" ? "no rebate (virtual metering)" : fmt$(grossCost) + " gross"}
                </p>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Cost per watt</span>
                <span className="font-semibold">${costPerW.toFixed(2)}/W</span>
              </div>
              <Slider
                min={1.5} max={5.0} step={0.05}
                value={[costPerW]}
                onValueChange={([v]) => onCostPerWChange(v)}
              />
            </div>
          </div>

          {/* Yearly savings / annual revenue hero */}
          <div id="section-savings" className="border-b pb-6 scroll-mt-52 pt-2">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <span className="text-5xl md:text-6xl font-bold tabular-nums text-emerald-700">
                {billingMode === "sso" ? fmt$(sso.annualRevenue) : fmt$(yearOne.savings)}
              </span>
              <span className="text-base text-muted-foreground font-medium">
                {billingMode === "sso" ? "annual revenue" : "yearly savings"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {billingMode === "sso"
                ? `Based on ${(sso.rate * 100).toFixed(2)}¢ Standard Offer rate`
                : `Based on ${(AUSTIN_ENERGY_RATES.vosRate * 100).toFixed(1)}¢ Value of Solar rate`}
            </p>
          </div>

          {/* Financing — VoS only */}
          {billingMode === "vos" && (
            <div className="pt-4">
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
                      <span className="font-semibold">{loanTermYears} year</span>
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
          )}

          {/* Monthly chart — bill comparison (VoS) or monthly revenue (SSO) */}
          <div>
            {billingMode === "sso" ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Monthly SSO revenue</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sso.monthlyRevenue} barGap={2} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={48} />
                    <Tooltip formatter={(v: number) => `$${v}`} />
                    <Bar dataKey="revenue" name="SSO revenue" fill="#047857" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-2">Monthly bill: with vs. without solar</p>
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
              </>
            )}
          </div>

          {/* 30-year cumulative — bar chart */}
          <div id="section-payback" className="scroll-mt-52">
            {(() => {
              const net25 = billingMode === "sso"
                ? (sso.cumulativeByYear[24]?.cumulative ?? 0)
                : (thirtyYear.cumulativeByYear[24]?.cumulative ?? 0);
              const grossRevenue = net25 + installCost;
              return (
                <div className="mb-4 pt-2">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className={`text-5xl md:text-6xl font-bold tabular-nums ${net25 >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {fmt$(net25)}
                    </span>
                    <span className="text-base text-muted-foreground font-medium">25 year {billingMode === "sso" ? "net" : "savings"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-emerald-700">{fmt$(grossRevenue)}</span>
                    <span className="mx-1">{billingMode === "sso" ? "revenue –" : "savings –"}</span>
                    <span className="text-red-700">{fmt$(installCost)}</span>
                    <span className="ml-1">install costs</span>
                  </p>
                </div>
              );
            })()}
            <p className="text-sm text-muted-foreground mb-3">{billingMode === "sso" ? "Cumulative net revenue over 30 years" : "Cumulative net savings over 30 years"}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt$(v)} />
                <Bar dataKey="Net savings" radius={[3, 3, 0, 0]}>
                  {cumulativeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry["Net savings"] >= 0 ? "#047857" : "#b91c1c"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {(billingMode === "sso" ? sso.paybackYear : thirtyYear.paybackYear) && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                System pays for itself in year {billingMode === "sso" ? sso.paybackYear : thirtyYear.paybackYear}
              </p>
            )}
          </div>

          {/* How did we calculate this */}
          <div className="border-t pt-3">
            <button
              onClick={() => setShowMethodology(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMethodology ? "rotate-180" : ""}`} />
              How did we calculate this?
            </button>

            {showMethodology && (
              <div className="mt-3 space-y-3 text-xs text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground/70 mb-0.5">Your bill model</p>
                  <p>We calculate your Austin Energy bill using their actual 2025 tiered rate structure, including all per-kWh charges and the $16.50 fixed monthly customer charge. Your solar panels are credited at Austin Energy's Value of Solar rate ($0.126/kWh). Because of this, and because the fixed charge applies regardless of how much solar you produce, your bill won't drop to zero even with a large system.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground/70 mb-0.5">Install cost</p>
                  <p>The default $2.95/W comes from Berkeley Lab's 2024 Tracking the Sun report for Austin residential installs. Use the slider to match quotes you actually receive — costs vary meaningfully by installer and system design.</p>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* ── Impact heading ── */}
      <div className="flex items-end gap-3 pt-2 scroll-mt-52">
        <h2 className="text-xl font-bold text-foreground leading-tight">Impact of going Solar</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-border to-transparent" />
      </div>

      {/* ── Solar Production vs. Consumption (kWh) ── */}
      <Card id="section-production" className="border-2 border-primary/20 shadow-md scroll-mt-52">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">Monthly solar production vs. your consumption (kWh)</p>
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

      <EnvironmentalImpactCard annualSolarKwh={yearOne.solarTotal} carbonOffsetKgPerMwh={solarInsights.carbonOffsetKgPerMwh} />
    </Fragment>
  );
};

export default SolarCalculator;
