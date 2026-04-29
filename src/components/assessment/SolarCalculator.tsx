import { useMemo, useState, Fragment } from "react";
import EnvironmentalImpactCard from "@/components/assessment/EnvironmentalImpactCard";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BillUpload from "@/components/assessment/BillUpload";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Battery } from "lucide-react";
import {
  MONTHS,
  MONTHLY_SOLAR_PROFILE,
  AUSTIN_ENERGY_SOLAR_REBATE,
  DEFAULT_PRODUCTION_PER_KW,
  CalcInputs,
  buildYearModel,
  buildThirtyYearModel,
  calculateAustinEnergyUsageBill,
  billToMonthlyKwh,
  austinInstallCost,
} from "@/lib/solar-model";

interface Props {
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    annualProductionKwh: number;
    sunshineHours: number;
  };
  recommendedSystemKw: number;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const LOAN_RATES = [0, 5, 7, 10, 15, 20, 25, 30];

const SolarCalculator = ({ solarInsights, recommendedSystemKw }: Props) => {
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const productionPerKw = solarInsights.annualProductionKwh > 0 && maxKw > 0
    ? Math.round(solarInsights.annualProductionKwh / maxKw)
    : DEFAULT_PRODUCTION_PER_KW;

  const [monthlyBill, setMonthlyBill] = useState(150);
  const [systemKw, setSystemKw] = useState(Math.min(recommendedSystemKw, maxKw));
  const [batteryKwh, setBatteryKwh] = useState(0);
  const [loanTermYears, setLoanTermYears] = useState(0);
  const [loanRate, setLoanRate] = useState(6);
  const [billMode, setBillMode] = useState<"estimate" | "upload">("estimate");
  const [uploadedKwh, setUploadedKwh] = useState<number[] | null>(null);

  const annualUsageKwh = uploadedKwh
    ? uploadedKwh.reduce((s, v) => s + v, 0)
    : billToMonthlyKwh(monthlyBill) * 12;

  const inputs: CalcInputs = useMemo(() => ({
    annualUsageKwh,
    systemKw,
    batteryKwh,
    loanTermYears,
    loanInterestRate: loanRate / 100,
    productionPerKw,
    monthlyUsageKwh: uploadedKwh ?? undefined,
  }), [annualUsageKwh, systemKw, batteryKwh, loanTermYears, loanRate, productionPerKw, uploadedKwh]);

  const installCost = useMemo(
    () => Math.max(0, austinInstallCost(systemKw, batteryKwh) - AUSTIN_ENERGY_SOLAR_REBATE),
    [systemKw, batteryKwh],
  );

  const yearOne = useMemo(() => buildYearModel(inputs, 0), [inputs]);
  const thirtyYear = useMemo(() => buildThirtyYearModel(inputs, installCost), [inputs, installCost]);
  const avgMonthlyWithSolar = yearOne.billWithSolar / 12;
  const avgMonthlyWithoutSolar = yearOne.billWithoutSolar / 12;

  // Chart data
  const billComparisonData = yearOne.monthlyRows.map(r => ({
    month: r.month,
    "Without solar": Math.round(r.billWithoutSolar),
    "With solar": Math.round(r.billWithSolar),
  }));

  const energyBalanceData = yearOne.monthlyRows.map((r, i) => ({
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
      <Card className="border-2 border-primary/20 shadow-md">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-[260px_1fr] gap-8">

          {/* ── Inputs ── */}
          <div className="space-y-6">

            {/* Bill input toggle */}
            <div>
              <div className="flex rounded-md border overflow-hidden text-xs mb-3">
                <button
                  className={`flex-1 py-1.5 font-medium transition-colors ${billMode === "estimate" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setBillMode("estimate")}
                >
                  Estimate
                </button>
                <button
                  className={`flex-1 py-1.5 font-medium transition-colors ${billMode === "upload" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  onClick={() => setBillMode("upload")}
                >
                  Upload bill
                </button>
              </div>

              {billMode === "estimate" ? (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Monthly electricity bill</span>
                    <span className="font-semibold">${monthlyBill}</span>
                  </div>
                  <Slider
                    min={50} max={600} step={10}
                    value={[monthlyBill]}
                    onValueChange={([v]) => setMonthlyBill(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$50</span><span>$600</span>
                  </div>
                </>
              ) : (
                <BillUpload
                  onResult={(kwh) => {
                    setUploadedKwh(kwh);
                  }}
                />
              )}
            </div>

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
                <span>{maxKw.toFixed(0)} kW max roof</span>
              </div>
            </div>

            {/* Battery */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Battery className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                <span className="text-muted-foreground flex-1">Battery storage</span>
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

            {/* Financing */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Loan term</span>
                <span className="font-semibold">{loanTermYears === 0 ? "Cash" : `${loanTermYears} yr`}</span>
              </div>
              <Slider
                min={0} max={30} step={5}
                value={[loanTermYears]}
                onValueChange={([v]) => setLoanTermYears(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Cash</span><span>30 yr</span>
              </div>
              {loanTermYears > 0 && (
                <div className="mt-3">
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
              )}
            </div>

            {/* Summary stats */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <StatRow label="Install cost" value={fmt$(installCost)} sub="after $2,500 rebate" />
              <StatRow label="Annual savings" value={fmt$(yearOne.savings)} highlight />
              <StatRow
                label="Monthly bill"
                value={fmt$(avgMonthlyWithSolar)}
                sub={`was ${fmt$(avgMonthlyWithoutSolar)}`}
              />
              <StatRow
                label="Payback"
                value={thirtyYear.paybackYear ? `${thirtyYear.paybackYear} yrs` : "> 30 yrs"}
              />
              <StatRow
                label="30-yr net"
                value={fmt$(thirtyYear.cumulativeByYear.at(-1)?.cumulative ?? 0)}
                highlight
              />
            </div>
          </div>

          {/* ── Charts ── */}
          <Tabs defaultValue="bills">
            <TabsList className="mb-4 w-full grid grid-cols-3">
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="30yr">30-year</TabsTrigger>
              <TabsTrigger value="energy">Energy</TabsTrigger>
            </TabsList>

            <TabsContent value="bills">
              <p className="text-xs text-muted-foreground mb-3">Monthly bill: with vs. without solar</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={billComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: number) => `$${v}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Without solar" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="With solar" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="30yr">
              <p className="text-xs text-muted-foreground mb-3">Cumulative net savings over 30 years</p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt$(v)} />
                  <Area
                    type="monotone"
                    dataKey="Net savings"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.15)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {thirtyYear.paybackYear && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  System pays for itself in year {thirtyYear.paybackYear}
                </p>
              )}
            </TabsContent>

            <TabsContent value="energy">
              <p className="text-xs text-muted-foreground mb-3">Monthly solar production vs. your consumption (kWh)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={energyBalanceData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
                  <Tooltip formatter={(v: number) => `${Math.round(v)} kWh`} />
                  <Legend />
                  <Bar dataKey="Production" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
                  <Bar dataKey="Consumption" fill="hsl(var(--muted-foreground) / 0.4)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </div>

      </CardContent>
    </Card>
    <EnvironmentalImpactCard annualSolarKwh={yearOne.solarTotal} />
    </Fragment>
  );
};

const StatRow = ({
  label, value, sub, highlight,
}: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right">
      <span className={`font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}>
        {value}
      </span>
      {sub && <span className="block text-[10px] text-muted-foreground">{sub}</span>}
    </span>
  </div>
);

export default SolarCalculator;
