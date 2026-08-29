import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, DollarSign, Flame, Home, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { useSeo } from "@/hooks/use-seo";
import {
  loadPowerMoney,
  toChartRows,
  toRateRows,
  fuelsPresent,
  FUEL_META,
  usd,
  usdCompact,
  type Basis,
  type FuelKey,
  type PowerMoneyData,
} from "@/lib/power-money";

const PowerMoney = () => {
  useSeo({
    title: "Power Money: What Austin Pays for Each Fuel",
    description:
      "How many dollars Austin Energy customers spend on coal, gas, nuclear, wind and solar each year — system totals and per household, built from EIA fuel cost and generation data.",
  });

  const [data, setData] = useState<PowerMoneyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<Basis>("total");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    loadPowerMoney()
      .then((d) => {
        setData(d);
        const full = [...d.years].reverse().find((y) => !y.partial);
        setSelectedYear((full ?? d.years[d.years.length - 1])?.year ?? null);
      })
      .catch((e) => setError(e?.message ?? "Failed to load data"));
  }, []);

  const fuels = useMemo<FuelKey[]>(() => (data ? fuelsPresent(data) : []), [data]);
  const chartRows = useMemo(() => (data ? toChartRows(data, basis) : []), [data, basis]);
  const rateRows = useMemo(() => (data ? toRateRows(data) : []), [data]);

  const latestFull = useMemo(
    () => (data ? [...data.years].reverse().find((y) => !y.partial) ?? null : null),
    [data],
  );
  const detail = useMemo(
    () => data?.years.find((y) => y.year === selectedYear) ?? null,
    [data, selectedYear],
  );

  const peakYear = useMemo(() => {
    if (!data) return null;
    return data.years.filter((y) => !y.partial).reduce((a, b) => (b.totalUsd > a.totalUsd ? b : a));
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Power Money"
        subtitle="What Austin Energy customers spend on each fuel source, every year since 2001. Fuel and contracted energy cost only — not your whole bill."
      />

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Data unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!data && !error && <p className="text-muted-foreground">Loading fuel spending data…</p>}

        {data && (
          <>
            {/* Headline numbers */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Fuel &amp; energy spend {latestFull?.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{latestFull ? usdCompact(latestFull.totalUsd) : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latestFull ? `${Math.round(latestFull.totalMwh).toLocaleString()} MWh generated or contracted` : ""}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Home className="h-4 w-4" /> Per household {latestFull?.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{latestFull ? usd(latestFull.perHouseholdUsd) : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Residential share of fuel cost, per customer, for the year
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Flame className="h-4 w-4" /> Most expensive year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{peakYear?.year ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {peakYear ? `${usdCompact(peakYear.totalUsd)} — ${usd(peakYear.perHouseholdUsd)} per household` : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dollars by fuel by year */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Dollars by fuel source, by year</CardTitle>
                    <CardDescription>
                      {basis === "total"
                        ? "Total Austin Energy fuel and contracted energy cost"
                        : "Residential share of that cost, per customer"}{" "}
                      · 2001–{data.years[data.years.length - 1]?.year}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={basis === "total" ? "default" : "outline"}
                      onClick={() => setBasis("total")}
                    >
                      Total system $
                    </Button>
                    <Button
                      size="sm"
                      variant={basis === "household" ? "default" : "outline"}
                      onClick={() => setBasis("household")}
                    >
                      Per household $
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartRows}
                      onClick={(e) => {
                        const y = e?.activePayload?.[0]?.payload?.year;
                        if (typeof y === "number") setSelectedYear(y);
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => (basis === "total" ? usdCompact(Number(v)) : usd(Number(v)))}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => [
                          basis === "total" ? usd(Number(v)) : usd(Number(v), 2),
                          FUEL_META[name as FuelKey]?.label ?? name,
                        ]}
                        labelFormatter={(l) => `Year ${l}`}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend
                        formatter={(name) => FUEL_META[name as FuelKey]?.label ?? name}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {fuels.map((f) => (
                        <Bar key={f} dataKey={f} stackId="a" fill={FUEL_META[f].color} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Click a year to load its detail below. Years marked <strong>*</strong> are partial — EIA data runs
                  through {data.lastPeriod ?? "the latest reported month"}. Wind, solar, nuclear and biomass dollars are
                  contracted-cost estimates, not reported fuel purchases (see methodology).
                </p>
              </CardContent>
            </Card>

            {/* Effective cost per MWh */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" /> Effective cost per MWh
                </CardTitle>
                <CardDescription>
                  What each fuel actually cost per megawatt-hour of energy delivered. Gas volatility — including the 2021
                  winter storm spike — shows up here first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rateRows}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        formatter={(v: number, name: string) => [
                          `$${Number(v).toFixed(2)}/MWh`,
                          FUEL_META[name as FuelKey]?.label ?? name,
                        ]}
                        labelFormatter={(l) => `Year ${l}`}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend
                        formatter={(name) => FUEL_META[name as FuelKey]?.label ?? name}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {fuels.map((f) => (
                        <Line
                          key={f}
                          type="monotone"
                          dataKey={f}
                          stroke={FUEL_META[f].color}
                          strokeWidth={2}
                          strokeDasharray={["wind", "solar", "nuclear", "biomass", "hydro"].includes(f) ? "5 4" : undefined}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Dashed lines are contracted-rate assumptions, so they are flat by construction. Solid lines are derived
                  from reported fuel costs and move with the market.
                </p>
              </CardContent>
            </Card>

            {/* Year detail */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Year detail{detail ? `: ${detail.year}` : ""}</CardTitle>
                    <CardDescription>
                      {detail
                        ? `${usdCompact(detail.totalUsd)} total · ${usd(detail.perHouseholdUsd)} per household · ${detail.resCustomers.toLocaleString()} residential customers`
                        : "Select a year"}
                    </CardDescription>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedYear ?? ""}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    aria-label="Select year"
                  >
                    {data.years.map((y) => (
                      <option key={y.year} value={y.year}>
                        {y.year}
                        {y.partial ? " (partial)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {detail && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">Fuel</th>
                          <th className="py-2 pr-4 font-medium text-right">MWh</th>
                          <th className="py-2 pr-4 font-medium text-right">Dollars</th>
                          <th className="py-2 pr-4 font-medium text-right">$/MWh</th>
                          <th className="py-2 pr-4 font-medium text-right">Share of spend</th>
                          <th className="py-2 font-medium">Basis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuels
                          .filter((f) => detail.fuels[f])
                          .sort((a, b) => (detail.fuels[b]!.totalUsd) - (detail.fuels[a]!.totalUsd))
                          .map((f) => {
                            const row = detail.fuels[f]!;
                            return (
                              <tr key={f} className="border-b last:border-0">
                                <td className="py-2 pr-4">
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className="inline-block h-2.5 w-2.5 rounded-sm"
                                      style={{ backgroundColor: FUEL_META[f].color }}
                                    />
                                    {FUEL_META[f].label}
                                  </span>
                                </td>
                                <td className="py-2 pr-4 text-right">{Math.round(row.mwh).toLocaleString()}</td>
                                <td className="py-2 pr-4 text-right">{usd(row.totalUsd)}</td>
                                <td className="py-2 pr-4 text-right">
                                  {row.usdPerMwh === null ? "—" : `$${row.usdPerMwh.toFixed(2)}`}
                                </td>
                                <td className="py-2 pr-4 text-right">
                                  {detail.totalUsd > 0 ? `${((row.totalUsd / detail.totalUsd) * 100).toFixed(1)}%` : "—"}
                                </td>
                                <td className="py-2 text-xs text-muted-foreground">
                                  {row.measured ? "Reported fuel cost" : "Contracted-rate estimate"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Methodology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" /> How this is calculated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>This is not your electric bill</AlertTitle>
                  <AlertDescription>
                    These figures cover fuel and contracted energy cost only. They exclude transmission and
                    distribution, debt service, staffing, plant O&amp;M, customer programs and the General Fund
                    transfer. Total spend here will not equal Austin Energy revenue or any customer's bill.
                  </AlertDescription>
                </Alert>

                <div>
                  <h2 className="font-semibold text-foreground mb-1">Sources</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Generation and heat input:</strong> EIA Form 923 via the{" "}
                      <code>electricity/facility-fuel</code> API — monthly net generation (MWh) and fuel consumption
                      (MMBtu) for every Austin Energy owned, co-owned and contracted plant, 2001–present.
                    </li>
                    <li>
                      <strong>Fuel prices:</strong> EIA{" "}
                      <code>electricity/electric-power-operational-data</code> API — Texas electric-utility average cost
                      of fuels per MMBtu, monthly by fuel, 2001–present.
                    </li>
                    <li>
                      <strong>Ownership shares:</strong> Austin Energy's ownership and PPA share of each plant (for
                      example 36% of Fayette coal, 16% of the South Texas Project), the same shares used by the fuel-mix
                      chart on this site.
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="font-semibold text-foreground mb-1">Calculation</h2>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto text-foreground">
{`fuel dollars = heat input (MMBtu) x Texas cost per MMBtu x AE ownership share
per household = annual total x residential share of sales (${Math.round(
  data.assumptions.residentialShareOfSales * 100,
)}%) / residential customers`}
                  </pre>
                </div>

                <div>
                  <h2 className="font-semibold text-foreground mb-1">What is estimated</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      EIA reports no fuel cost for nuclear, wind, solar, hydro or biomass. Those fuels use documented
                      contracted energy-cost assumptions, shown separately as "contracted-rate estimate" and drawn with
                      dashed lines:{" "}
                      {Object.entries(data.assumptions.contractedUsdPerMwh)
                        .filter(([, s]) => s.some(([, v]) => v > 0))
                        .map(([fuel, schedule]) => (
                          <span key={fuel}>
                            {FUEL_META[fuel as FuelKey]?.label ?? fuel}{" "}
                            {schedule.map(([y, v]) => `$${v}/MWh from ${y}`).join(", ")};{" "}
                          </span>
                        ))}
                    </li>
                    <li>
                      Residential customer counts come from Austin Energy annual reports, interpolated between reported
                      years, and the residential share of retail sales is held at{" "}
                      {Math.round(data.assumptions.residentialShareOfSales * 100)}%. Per-household figures are therefore
                      approximate.
                    </li>
                    <li>
                      A plant-fuel with generation but no reported heat input or price appears as "—" rather than being
                      filled with a guess. Small units are sometimes omitted from EIA fuel reporting, which understates
                      totals slightly.
                    </li>
                    <li>
                      The most recent year is partial — data runs through {data.lastPeriod ?? "the latest reported month"}.
                    </li>
                  </ul>
                </div>

                <p className="text-xs">
                  Data snapshot generated {new Date(data.generated).toLocaleDateString()} by{" "}
                  <code>scripts/eia_fuel_costs.py</code>.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default PowerMoney;
