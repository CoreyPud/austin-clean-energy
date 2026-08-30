import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, DollarSign, Flame, Home, TrendingDown, Scale, Sun, Landmark } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
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
  toComparisonRows,
  fuelsPresent,
  FUEL_META,
  LAYER_LABEL,
  SYSTEM_KEY,
  SYSTEM_META,
  yearTotal,
  yearPerHousehold,
  usd,
  usdCompact,
  type Basis,
  type ComparisonRow,
  type CostLayer,
  type FuelKey,
  type PowerMoneyData,
} from "@/lib/power-money";
import {
  localSolarSeries,
  localBatterySeries,
  localSolarYear,
  batteryUsdPerKwYear,
  amortizedRebateUsdPerMwh,
  LOCAL_RATES,
  LOCAL_SOURCES,
  GAS_PEAKER_USD_PER_KW_YEAR,
} from "@/lib/local-resources";
import {
  toFederalRows,
  FEDERAL_META,
  FEDERAL_ASSUMPTIONS,
  FEDERAL_SOURCES,
  type FederalRow,
} from "@/lib/federal-support";


interface TipRow {
  color: string;
  opacity?: number;
  dashed?: boolean;
  label: string;
  value: string;
}

/**
 * Shared tooltip that shows a colour swatch matching the exact bar segment or line it
 * describes, so a hovered number is unambiguous.
 */
const SwatchTooltip = ({ header, note, rows }: { header: string; note?: string; rows: TipRow[] }) => {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{header}</p>
      <div className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            {r.dashed ? (
              <span
                className="inline-block h-0 w-3 shrink-0 border-t-2 border-dashed"
                style={{ borderColor: r.color, opacity: r.opacity ?? 1 }}
              />
            ) : (
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: r.color, opacity: r.opacity ?? 1 }}
              />
            )}
            <span className="text-muted-foreground">{r.label}</span>
            <span className="ml-auto pl-3 font-medium text-popover-foreground">{r.value}</span>
          </div>
        ))}
      </div>
      {note && <p className="mt-2 max-w-[16rem] text-[11px] leading-snug text-muted-foreground">{note}</p>}
    </div>
  );
};

/** Segment meanings differ for behind-the-meter local solar, so labels are per row. */
const segmentLabels = (row: ComparisonRow | null) =>
  row?.key === "localSolar"
    ? {
        fuel: "Value of Solar bill credit",
        nonFuel: `Rebate, amortized over ${LOCAL_RATES.systemLifeYears} years`,
        system: "System delivery costs (n/a — behind the meter)",
      }
    : {
        fuel: "Fuel / contracted energy",
        nonFuel: "Plant O&M + capital (est.)",
        system: "System delivery costs (est., spread per MWh)",
      };

/** Utility-scale sources plus behind-the-meter local solar, priced the same way. */
const rowsForYear = (data: PowerMoneyData, year: number): ComparisonRow[] => {
  const rows = toComparisonRows(data, year);
  const local = localSolarYear(year);
  const totalMwh = data.years.find((y) => y.year === year)?.totalMwh ?? 0;
  if (local && local.mwh > 0) {
    rows.push({
      key: "localSolar",
      label: "Local solar",
      color: "#f59e0b",
      fuelRate: LOCAL_RATES.vosUsdPerMwh,
      nonFuelRate: amortizedRebateUsdPerMwh(local.year),
      systemRate: 0,
      allInRate: local.usdPerMwh,
      deliveredRate: local.usdPerMwh,
      mwh: local.mwh,
      share: totalMwh > 0 ? local.mwh / totalMwh : 0,
      measured: false,
      contracted: true,
    });
  }
  return rows;
};



const PowerMoney = () => {
  useSeo({
    title: "Power Money: What Austin Pays for Each Fuel",
    description:
      "How many dollars Austin Energy customers spend on coal, gas, nuclear, wind and solar each year — system totals and per household, built from EIA fuel cost and generation data.",
  });

  const [data, setData] = useState<PowerMoneyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [basis, setBasis] = useState<Basis>("total");
  const [layer, setLayer] = useState<CostLayer>("fuel");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const [federalYear, setFederalYear] = useState<number | null>(null);
  const [totalCostYear, setTotalCostYear] = useState<number | null>(null);



  useEffect(() => {
    loadPowerMoney()
      .then((d) => {
        setData(d);
        const full = [...d.years].reverse().find((y) => !y.partial);
        const year = (full ?? d.years[d.years.length - 1])?.year ?? null;
        setSelectedYear(year);
        setCompareYear(year);
        setFederalYear(year);
        setTotalCostYear(year);


      })
      .catch((e) => setError(e?.message ?? "Failed to load data"));
  }, []);

  // Utility-scale sources plus local rooftop solar, which Austin Energy pays for through
  // the Value of Solar credit and rebates instead of fuel and plant costs.
  const compareRows = useMemo<ComparisonRow[]>(() => {
    if (!data || compareYear === null) return [];
    const rows = toComparisonRows(data, compareYear);
    const local = localSolarYear(compareYear);
    const totalMwh = data.years.find((y) => y.year === compareYear)?.totalMwh ?? 0;
    if (local && local.mwh > 0) {
      rows.push({
        key: "localSolar",
        label: "Local solar",
        color: "#f59e0b",
        fuelRate: LOCAL_RATES.vosUsdPerMwh,
        nonFuelRate: amortizedRebateUsdPerMwh(local.year),
        systemRate: 0,
        allInRate: local.usdPerMwh,
        deliveredRate: local.usdPerMwh,
        mwh: local.mwh,
        share: totalMwh > 0 ? local.mwh / totalMwh : 0,
        measured: false,
        contracted: true,
      });
    }
    return rows.sort((a, b) => a.deliveredRate - b.deliveredRate);
  }, [data, compareYear]);

  // Federal support behind the same megawatt-hours, for its own year selector.
  const federalRows = useMemo<FederalRow[]>(() => {
    if (!data || federalYear === null) return [];
    const rows = toComparisonRows(data, federalYear).map((r) => ({
      key: r.key,
      label: r.label,
      color: r.color,
      mwh: r.mwh,
      deliveredRate: r.deliveredRate,
    }));
    const local = localSolarYear(federalYear);
    if (local && local.mwh > 0) {
      rows.push({
        key: "localSolar",
        label: "Local solar",
        color: "#f59e0b",
        mwh: local.mwh,
        deliveredRate: local.usdPerMwh,
      });
    }
    return toFederalRows(rows, federalYear);
  }, [data, federalYear]);

  const federalSummary = useMemo(() => {
    if (!data || federalYear === null || federalRows.length === 0) return null;
    const y = data.years.find((r) => r.year === federalYear);
    if (!y) return null;
    const totalUsd = federalRows.reduce((s, r) => s + r.totalUsd, 0);
    const households = y.resCustomers / data.assumptions.residentialShareOfSales;
    return {
      totalUsd,
      perHouseholdUsd: households > 0 ? totalUsd / households : 0,
      partial: y.partial,
    };
  }, [data, federalYear, federalRows]);

  // Combined cost: what Austin Energy paid plus what federal taxpayers carried.
  const totalCostRows = useMemo<TotalCostRow[]>(
    () =>
      !data || totalCostYear === null
        ? []
        : toTotalCostRows(rowsForYear(data, totalCostYear), totalCostYear),
    [data, totalCostYear],
  );

  const totalCostSummary = useMemo(() => {
    if (!data || totalCostYear === null || totalCostRows.length === 0) return null;
    const y = data.years.find((r) => r.year === totalCostYear);
    if (!y) return null;
    const combinedUsd = totalCostRows.reduce((s, r) => s + r.combinedTotalUsd, 0);
    const federalUsd = totalCostRows.reduce((s, r) => s + r.federalTotalUsd, 0);
    const households = y.resCustomers / data.assumptions.residentialShareOfSales;
    return {
      combinedUsd,
      federalUsd,
      aeUsd: combinedUsd - federalUsd,
      taxpayerShare: combinedUsd > 0 ? federalUsd / combinedUsd : 0,
      perHouseholdUsd: households > 0 ? combinedUsd / households : 0,
      partial: y.partial,
    };
  }, [data, totalCostYear, totalCostRows]);



  const localSolar = useMemo(() => localSolarSeries(), []);
  const localBattery = useMemo(() => localBatterySeries(), []);
  const batteryRate = useMemo(() => batteryUsdPerKwYear(), []);



  const fuels = useMemo<FuelKey[]>(() => (data ? fuelsPresent(data) : []), [data]);
  const chartRows = useMemo(() => (data ? toChartRows(data, basis, layer) : []), [data, basis, layer]);
  const rateRows = useMemo(() => (data ? toRateRows(data, layer) : []), [data, layer]);
  // Fuel oil runs $150–$350/MWh on a rounding-error amount of energy; including it
  // flattens every other fuel, so the rate chart leaves it out (still in the table).
  const rateFuels = useMemo<FuelKey[]>(() => fuels.filter((f) => f !== "oil"), [fuels]);

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
    return data.years
      .filter((y) => !y.partial)
      .reduce((a, b) => (yearTotal(b, layer) > yearTotal(a, layer) ? b : a));
  }, [data, layer]);

  // Full system cost per MWh, the closest this page gets to an all-in cost of service.
  const systemRate = useMemo(() => {
    if (!latestFull || latestFull.fullSystemUsd === null || latestFull.totalMwh <= 0) return null;
    return latestFull.fullSystemUsd / latestFull.totalMwh;
  }, [latestFull]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Power Money"
        subtitle="What Austin Energy customers spend on each fuel source, every year since 2001 — fuel, plant O&M and capital, and system costs, layer by layer. Still not identical to your bill."
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> {LAYER_LABEL[layer]} {latestFull?.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {latestFull ? usdCompact(yearTotal(latestFull, layer)) : "—"}
                  </p>
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
                  <p className="text-3xl font-bold">
                    {latestFull ? usd(yearPerHousehold(latestFull, layer)) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Residential share of the selected cost layers, per customer, for the year
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
                    {peakYear
                      ? `${usdCompact(yearTotal(peakYear, layer))} — ${usd(yearPerHousehold(peakYear, layer))} per household`
                      : ""}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" /> All-in cost per MWh {latestFull?.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{systemRate ? `$${systemRate.toFixed(0)}` : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fuel + plant + system cost per MWh. Austin Energy's average residential rate is roughly
                    $110–$130/MWh, so this is the cost side of that price, not the price itself.
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
                        ? `Total Austin Energy cost — ${LAYER_LABEL[layer].toLowerCase()}`
                        : `Residential share of that cost, per customer — ${LAYER_LABEL[layer].toLowerCase()}`}{" "}
                      · 2001–{data.years[data.years.length - 1]?.year}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">Cost layers:</span>
                  {(["fuel", "plant", "system"] as CostLayer[]).map((l) => (
                    <Button
                      key={l}
                      size="sm"
                      variant={layer === l ? "secondary" : "ghost"}
                      className="text-xs"
                      onClick={() => setLayer(l)}
                    >
                      {LAYER_LABEL[l]}
                    </Button>
                  ))}
                </div>
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
                        cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const rows: TipRow[] = payload
                            .filter((p) => Number(p.value) > 0)
                            .reverse()
                            .map((p) => ({
                              color: String(p.color ?? p.fill ?? "#888"),
                              label:
                                p.dataKey === SYSTEM_KEY
                                  ? SYSTEM_META.label
                                  : FUEL_META[p.dataKey as FuelKey]?.label ?? String(p.dataKey),
                              value: basis === "total" ? usd(Number(p.value)) : usd(Number(p.value), 2),
                            }));
                          return <SwatchTooltip header={`Year ${label}`} rows={rows} />;
                        }}
                      />

                      <Legend
                        formatter={(name) =>
                          name === SYSTEM_KEY ? SYSTEM_META.label : FUEL_META[name as FuelKey]?.label ?? name
                        }
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {fuels.map((f) => (
                        <Bar key={f} dataKey={f} stackId="a" fill={FUEL_META[f].color} />
                      ))}
                      {layer === "system" && (
                        <Bar dataKey={SYSTEM_KEY} stackId="a" fill={SYSTEM_META.color} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {layer === "fuel" &&
                    "Fuel purchases and contracted energy price only — no plant O&M, capital or grid costs."}
                  {layer === "plant" &&
                    "Adds estimated variable O&M, fixed O&M and capital / debt service for Austin Energy's owned units. PPA resources carry no separate non-fuel cost because their contract price is all-in."}
                  {layer === "system" &&
                    `Adds system costs that cannot be attributed to a fuel — transmission and distribution, ERCOT congestion, ancillary and administrative charges, customer service and the General Fund transfer. Available from ${data.assumptions.systemCosts.startYear} onward; earlier years show fuel and plant costs only.`}{" "}
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
                  What each fuel cost per megawatt-hour of energy generated or contracted — not a retail or all-in
                  price. Excludes transmission, distribution, congestion and other grid charges. Gas volatility —
                  including the 2021 winter storm spike — shows up here first.
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
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const rows: TipRow[] = payload
                            .filter((p) => typeof p.value === "number")
                            .map((p) => ({
                              color: String(p.color ?? p.stroke ?? "#888"),
                              dashed: ["wind", "solar", "nuclear", "biomass", "hydro"].includes(String(p.dataKey)),
                              label: FUEL_META[p.dataKey as FuelKey]?.label ?? String(p.dataKey),
                              value: `$${Number(p.value).toFixed(2)}/MWh`,
                            }));
                          return <SwatchTooltip header={`Year ${label}`} rows={rows} />;
                        }}
                      />

                      <Legend
                        formatter={(name) => FUEL_META[name as FuelKey]?.label ?? name}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      {rateFuels.map((f) => (
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
                  Currently showing{" "}
                  {layer === "fuel" ? "fuel and contracted energy cost only" : "fuel plus estimated plant O&M and capital"}
                  , following the cost-layer selector above. Dashed lines are contracted-rate assumptions, so they are
                  flat by construction. Solid lines are derived
                  from reported fuel costs and move with the market. Fuel oil is left off this chart — it costs
                  $150–$350/MWh but supplies a rounding error of energy, so it would flatten everything else. It is still
                  in the table below.
                </p>

              </CardContent>
            </Card>

            {/* Side-by-side all-in cost per source */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" /> Compare sources side by side
                    </CardTitle>
                    <CardDescription>
                      Delivered cost per megawatt-hour for every source Austin Energy used in {compareYear ?? "—"} —
                      fuel or contract price, plus plant O&amp;M and capital, plus system delivery costs.
                    </CardDescription>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={compareYear ?? ""}
                    onChange={(e) => setCompareYear(Number(e.target.value))}
                    aria-label="Comparison year"
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
                <div style={{ height: Math.max(220, compareRows.length * 54 + 60) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareRows} layout="vertical" margin={{ left: 8, right: 64 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={92}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = (payload[0]?.payload ?? null) as ComparisonRow | null;
                          if (!row) return null;
                          const names = segmentLabels(row);
                          // Bottom-up so the rows read in the same order as the stacked segments.
                          const rows: TipRow[] = [
                            { key: "fuelRate", color: row.color, label: names.fuel },
                            { key: "nonFuelRate", color: row.color, opacity: 0.4, label: names.nonFuel },
                            { key: "systemRate", color: SYSTEM_META.color, label: names.system },
                          ]
                            .map((s) => ({
                              ...s,
                              raw: Number(payload.find((p) => p.dataKey === s.key)?.value ?? 0),
                            }))
                            .filter((s) => s.raw > 0)
                            .map((s) => ({
                              color: s.color,
                              opacity: s.opacity,
                              label: s.label,
                              value: `$${s.raw.toFixed(2)}/MWh`,
                            }));
                          return (
                            <SwatchTooltip
                              header={`${row.label} — $${row.deliveredRate.toFixed(2)}/MWh · ${Math.round(
                                row.mwh,
                              ).toLocaleString()} MWh (${(row.share * 100).toFixed(1)}% of generation)`}
                              note={
                                row.key === "localSolar"
                                  ? "Customers own and maintain rooftop systems, so no O&M or capital is charged here, and the power never crosses the grid."
                                  : undefined
                              }
                              rows={rows}
                            />
                          );
                        }}
                      />
                      <Legend
                        formatter={(name) =>
                          name === "fuelRate"
                            ? "Energy payment (fuel, contract, or bill credit)"
                            : name === "nonFuelRate"
                              ? "Plant O&M + capital, or amortized rebate"
                              : "System delivery costs (est.)"
                        }
                        wrapperStyle={{ fontSize: 12 }}
                      />

                      <Bar dataKey="fuelRate" stackId="rate" fill="#64748b" radius={[0, 0, 0, 0]}>
                        {compareRows.map((r) => (
                          <Cell key={r.key} fill={r.color} />
                        ))}
                      </Bar>
                      <Bar dataKey="nonFuelRate" stackId="rate" fill="#cbd5e1">
                        {compareRows.map((r) => (
                          <Cell key={r.key} fill={r.color} fillOpacity={0.4} />
                        ))}
                      </Bar>
                      <Bar dataKey="systemRate" stackId="rate" fill={SYSTEM_META.color} radius={[0, 3, 3, 0]}>
                        <LabelList
                          dataKey="deliveredRate"
                          position="right"
                          formatter={(v: number) => `$${Number(v).toFixed(0)}`}
                          style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {compareRows.map((r) => (
                    <span key={r.key}>
                      <span className="font-medium text-foreground">{r.label}</span>{" "}
                      {Math.round(r.mwh).toLocaleString()} MWh · {(r.share * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Honest take: this is the closest apples-to-apples comparison the public data supports, but the
                  segments do not mean the same thing for every source. Wind, solar, biomass and hydro come through
                  power purchase agreements — the contract price is already all-in, so they carry no separate plant
                  segment and their rate is a documented assumption rather than a reported cost. Gas, coal and nuclear
                  show reported fuel cost plus modeled O&amp;M and capital / debt service at NREL-range rates, not
                  Austin Energy's books. The system segment — transmission, distribution, ERCOT congestion,
                  ancillary services and administration — genuinely cannot be attributed to one source, so it is
                  spread evenly over every megawatt-hour generated
                  {compareRows.length > 0 && compareRows[0].systemRate > 0
                    ? ` ($${compareRows[0].systemRate.toFixed(2)}/MWh in ${compareYear})`
                    : ""}
                  ; it shifts every bar by the same amount and does not change the ranking. Cheap per MWh does not mean
                  large: check the MWh and share figures, and remember that a source supplying a rounding error of
                  energy (fuel oil, most years) can look extreme either way.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Local solar is the one bar whose segments mean something different. Austin Energy does not own,
                  operate or maintain these systems — customers do, out of their own pockets — so no O&amp;M or
                  capital cost is charged to it. Its two segments are the money the utility actually pays out: the
                  Value of Solar bill credit of {(LOCAL_RATES.vosUsdPerMwh / 10).toFixed(2)}&cent;/kWh, and the
                  up-front rebate spread over a {LOCAL_RATES.systemLifeYears}-year system life. There is no system
                  delivery segment because rooftop power never crosses the transmission or distribution system.
                  Program administration and permitting review are internal Austin Energy overhead that already sits
                  inside the system-cost layer above, so they are not counted again here.
                </p>


              </CardContent>
            </Card>

            {/* Who else paid: federal support by source */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5" /> Who else paid: federal support by source
                    </CardTitle>
                    <CardDescription>
                      Everything above is what Austin Energy paid. This is what federal taxpayers carried for the
                      same megawatt-hours in {federalYear ?? "—"}, through production and investment tax credits and
                      fuel-specific tax provisions.
                    </CardDescription>
                  </div>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={federalYear ?? ""}
                    onChange={(e) => setFederalYear(Number(e.target.value))}
                    aria-label="Federal support year"
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
                {federalSummary && (
                  <div className="grid gap-4 sm:grid-cols-2 mb-5">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Federal support behind Austin Energy's supply, {federalYear}
                        {federalSummary.partial ? " (partial year)" : ""}
                      </p>
                      <p className="text-2xl font-bold">{usdCompact(federalSummary.totalUsd)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tax credits and tax provisions claimed by the developers, PPA counterparties and homeowners
                        who supply or offset this load — not money that passes through Austin Energy.
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">Per residential household equivalent</p>
                      <p className="text-2xl font-bold">
                        {usd(federalSummary.perHouseholdUsd, 2)}
                        <span className="text-sm font-normal text-muted-foreground">/yr</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        The same total spread across Austin Energy's residential customers, using the residential
                        share of sales — for scale only, since federal support is funded nationally.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ height: Math.max(220, federalRows.length * 54 + 60) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={federalRows} layout="vertical" margin={{ left: 8, right: 72 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const row = (payload[0]?.payload ?? null) as FederalRow | null;
                          if (!row) return null;
                          const rows: TipRow[] = [
                            {
                              color: FEDERAL_META.color,
                              label: "Federal tax credits and provisions (solid bar)",
                              value: `$${row.statutoryRate.toFixed(2)}/MWh`,
                            },
                          ];
                          if (row.broaderBand > 0)
                            rows.push({
                              color: FEDERAL_META.color,
                              opacity: 0.3,
                              label: `Broader estimates, up to (pale end of bar)`,
                              value: `$${row.broaderHigh.toFixed(2)}/MWh`,
                            });
                          rows.push({
                            color: row.color,
                            label: "What Austin Energy paid (other chart above)",
                            value: `$${row.deliveredRate.toFixed(2)}/MWh`,
                          });
                          return (
                            <SwatchTooltip
                              header={`${row.label} — ${usdCompact(row.totalUsd)} of federal support on ${Math.round(
                                row.mwh,
                              ).toLocaleString()} MWh`}
                              note={`${row.what}. ${
                                row.basis === "statutory"
                                  ? "Credit rate written into the tax code."
                                  : "Analyst estimate, not an agency-published per-MWh figure."
                              }`}
                              rows={rows}
                            />
                          );
                        }}
                      />
                      <Legend
                        formatter={(name) =>
                          name === "statutoryRate"
                            ? "Federal tax credits and provisions ($/MWh)"
                            : "Broader estimates (range, weaker attribution)"
                        }
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="statutoryRate" stackId="fed" fill={FEDERAL_META.color} />
                      <Bar dataKey="broaderBand" stackId="fed" fill={FEDERAL_META.color} fillOpacity={0.3} radius={[0, 3, 3, 0]}>
                        <LabelList
                          dataKey="statutoryRate"
                          position="right"
                          formatter={(v: number) =>
                            Number(v) >= 5 ? `$${Number(v).toFixed(0)}/MWh` : `$${Number(v).toFixed(2)}/MWh`
                          }
                          style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3">Source</th>
                        <th className="py-2 pr-3 text-right">Federal $/MWh</th>
                        <th className="py-2 pr-3 text-right">Broader range</th>
                        <th className="py-2 pr-3 text-right">MWh</th>
                        <th className="py-2 pr-3 text-right">Federal $ total</th>
                        <th className="py-2 pr-3 text-right">AE paid $/MWh</th>
                        <th className="py-2">Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {federalRows.map((r) => (
                        <tr key={r.key} className="border-b last:border-0">
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: r.color }}
                              />
                              {r.label}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-right font-medium">${r.statutoryRate.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-right text-muted-foreground">
                            ${r.broaderLow.toFixed(2)}–${r.broaderHigh.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right">{Math.round(r.mwh).toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right">{usdCompact(r.totalUsd)}</td>
                          <td className="py-2 pr-3 text-right">${r.deliveredRate.toFixed(2)}</td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {r.basis === "statutory" ? "Statutory credit rate" : "Modeled estimate"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-muted-foreground space-y-2 mt-4">
                  <p>
                    <span className="font-medium text-foreground">How to read the bars.</span> The solid teal segment
                    is federal support that can be tied to this generation: the Section 45/45Y production tax credit
                    for wind, the Section 48 investment tax credit for utility-scale solar, the Section 25D credit for
                    rooftop solar, the Section 45U nuclear credit from 2024, and fuel-specific provisions plus
                    accelerated depreciation for gas and coal. The pale teal extension is the{" "}
                    <span className="font-medium text-foreground">broader-estimate band</span> — the top of a
                    published range rather than a number anyone has measured. Each source's own color appears in the
                    tooltip next to what Austin Energy paid, matching the comparison chart above.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Austin Energy claims none of this.</span> A
                    municipal utility is tax-exempt, so it cannot take a tax credit. The value goes to the private
                    developers and power-purchase counterparties who own the wind and solar farms, and to homeowners
                    who install rooftop systems. It reaches Austin indirectly, as a lower contract price or a lower
                    install price — which is exactly why the utility-scale wind and solar contract prices in the
                    charts above are as low as they are.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Fossil bars are the weak part.</span> Intangible
                    drilling costs, percentage depletion and the rest are upstream provisions that accrue to
                    producers, not per-megawatt-hour payments to a power plant. Converting them to $/MWh of Austin
                    Energy gas or coal generation means dividing national tax-expenditure totals by national
                    generation, which is defensible as an order of magnitude and nothing more. Broader fossil
                    estimates that include foreign tax treatment and federal R&amp;D do not convert cleanly to
                    $/MWh at all, so the high end of those bands is deliberately conservative rather than the
                    headline numbers advocacy groups publish.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Capital credits are levelized, not billed.</span>{" "}
                    The ITC and 25D are one-time credits on construction cost, so turning them into $/MWh requires
                    assumptions: $
                    {FEDERAL_ASSUMPTIONS.utilityPvCapexUsdPerKw.toLocaleString()}/kW utility PV capex at a{" "}
                    {(FEDERAL_ASSUMPTIONS.utilityPvCapacityFactor * 100).toFixed(0)}% capacity factor, $
                    {FEDERAL_ASSUMPTIONS.residentialPvUsdPerWatt.toFixed(2)}/W residential installs at{" "}
                    {FEDERAL_ASSUMPTIONS.residentialYieldKwhPerKwYear.toLocaleString()} kWh/kW-yr, a{" "}
                    {FEDERAL_ASSUMPTIONS.lifeYears}-year life and a{" "}
                    {(FEDERAL_ASSUMPTIONS.discountRate * 100).toFixed(0)}% real discount rate. Change the
                    assumptions and the solar bars move.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">What is not here.</span> Hydro, biomass and fuel oil
                    are dropped because no defensible per-MWh federal figure exists for them in this mix. State and
                    local incentives are excluded. Health and climate externalities are excluded too — that is a
                    different question and is not being smuggled into these bars. Note also that the residential
                    credit ended for systems placed in service after December 31, 2025, and new wind and solar
                    credits are being phased out under the 2025 tax law, so recent years are not a guide to future
                    ones.
                  </p>
                  <div>
                    <p className="font-medium text-foreground mb-1">Sources</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {FEDERAL_SOURCES.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                          >
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local solar and batteries */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" /> Local solar and batteries
                </CardTitle>
                <CardDescription>
                  What Austin Energy pays for resources sitting on customers' roofs and in their garages, priced
                  the same way as the plants above.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Local solar, cost to Austin Energy</p>
                    <p className="text-2xl font-bold">
                      ${(LOCAL_RATES.vosUsdPerMwh + amortizedRebateUsdPerMwh(2026)).toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground">/MWh</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Value of Solar bill credit ({(LOCAL_RATES.vosUsdPerMwh / 10).toFixed(2)}&cent;/kWh) plus the
                      rebate amortized over {LOCAL_RATES.systemLifeYears} years. No O&amp;M or capital — customers own
                      and maintain their own equipment — and no delivery cost.
                    </p>

                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Local batteries, capacity cost</p>
                    <p className="text-2xl font-bold">
                      ${batteryRate.toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground">/kW-yr</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Versus about ${GAS_PEAKER_USD_PER_KW_YEAR}/kW-yr of fixed O&amp;M and capital recovery for a
                      gas peaker.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Local fleet today</p>
                    <p className="text-2xl font-bold">
                      {(localSolar[localSolar.length - 1].cumulativeKw / 1000).toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground"> MW solar</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Plus {localBattery[localBattery.length - 1].cumulativeBatteries.toLocaleString()} permitted
                      batteries, roughly {localBattery[localBattery.length - 1].dispatchMw.toFixed(1)} MW of
                      dispatchable capacity.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3">Year</th>
                        <th className="py-2 pr-3 text-right">Solar MW (cum.)</th>
                        <th className="py-2 pr-3 text-right">Est. MWh</th>
                        <th className="py-2 pr-3 text-right">Solar credits</th>
                        <th className="py-2 pr-3 text-right">Solar rebates</th>
                        <th className="py-2 pr-3 text-right">Batteries (cum.)</th>
                        <th className="py-2 pr-3 text-right">Battery program</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localSolar.map((s, i) => {
                        const b = localBattery[i];
                        return (
                          <tr key={s.year} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">
                              {s.year}
                              {s.partial ? "*" : ""}
                            </td>
                            <td className="py-2 pr-3 text-right">{(s.cumulativeKw / 1000).toFixed(1)}</td>
                            <td className="py-2 pr-3 text-right">{Math.round(s.mwh).toLocaleString()}</td>
                            <td className="py-2 pr-3 text-right">{usdCompact(s.vosUsd)}</td>
                            <td className="py-2 pr-3 text-right">{usdCompact(s.rebateUsd)}</td>
                            <td className="py-2 pr-3 text-right">{b.cumulativeBatteries.toLocaleString()}</td>
                            <td className="py-2 pr-3 text-right">{usdCompact(b.totalUsd)}</td>
                            <td className="py-2 text-right font-medium">
                              {usdCompact(s.totalUsd + b.totalUsd)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs text-muted-foreground space-y-2">
                  <p>
                    Honest take: these are modeled numbers, not Austin Energy's books. Capacity and battery counts
                    come from City of Austin issued solar permits, so battery counts are a floor — only permits whose
                    description mentions storage are counted, and permits missing a capacity value undercount MW.
                    Generation is estimated at {LOCAL_RATES.yieldKwhPerKwYear.toLocaleString()} kWh per installed kW
                    per year, a PVWatts-class figure for Austin, not metered output. The current Value of Solar rate
                    is applied to every year rather than the historical rate for that year, so early-year credits are
                    approximate. Rebates are counted at ${LOCAL_RATES.residentialRebateUsd.toLocaleString()} per
                    project from 2018 (when the current rebate program started) and $
                    {LOCAL_RATES.residentialRebateUsdCurrent.toLocaleString()} from 2026, applied to all permits
                    including commercial projects that actually receive capacity-based or Standard Offer payments
                    instead. The battery figure combines the ${LOCAL_RATES.batteryRebateUsd} Power Partner rebate with
                    an assumed ${LOCAL_RATES.batteryAnnualPaymentUsd}/year performance payment and{" "}
                    {LOCAL_RATES.batteryDispatchKw} kW of dispatchable output per battery; Austin Energy does not
                    publish the performance formula, so that piece is an estimate.
                  </p>
                  <p>* Partial year — permits through the latest available month.</p>
                  <p>
                    Sources:{" "}
                    {LOCAL_SOURCES.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 ? " · " : ""}
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
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
                        ? `${usdCompact(yearTotal(detail, layer))} total · ${usd(yearPerHousehold(detail, layer))} per household · ${detail.resCustomers.toLocaleString()} residential customers`
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
                          <th className="py-2 pr-4 font-medium text-right">Fuel $</th>
                          <th className="py-2 pr-4 font-medium text-right">Plant O&amp;M + capital $</th>
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
                                  {row.nonFuelUsd > 0 ? usd(row.nonFuelUsd) : "—"}
                                </td>
                                <td className="py-2 pr-4 text-right">
                                  {(layer === "fuel" ? row.usdPerMwh : row.usdPerMwhWithNonFuel) === null
                                    ? "—"
                                    : `$${(layer === "fuel" ? row.usdPerMwh! : row.usdPerMwhWithNonFuel!).toFixed(2)}`}
                                </td>
                                <td className="py-2 pr-4 text-right">
                                  {yearTotal(detail, layer) > 0
                                    ? `${((layer === "fuel" ? row.totalUsd : row.totalWithNonFuelUsd) / yearTotal(detail, layer) * 100).toFixed(1)}%`
                                    : "—"}
                                </td>
                                <td className="py-2 text-xs text-muted-foreground">
                                  {row.measured ? "Reported fuel cost" : "Contracted-rate estimate"}
                                </td>
                              </tr>
                            );
                          })}
                        {layer === "system" && detail.systemCostsUsd !== null && (
                          <tr className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-sm"
                                  style={{ backgroundColor: SYSTEM_META.color }}
                                />
                                {SYSTEM_META.label}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-right">—</td>
                            <td className="py-2 pr-4 text-right">—</td>
                            <td className="py-2 pr-4 text-right">{usd(detail.systemCostsUsd)}</td>
                            <td className="py-2 pr-4 text-right">—</td>
                            <td className="py-2 pr-4 text-right">
                              {`${((detail.systemCostsUsd / yearTotal(detail, "system")) * 100).toFixed(1)}%`}
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">Budget-derived estimate</td>
                          </tr>
                        )}
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
                    The default view covers fuel and contracted energy cost only. The cost-layer selector adds estimated
                    plant O&amp;M and capital, then system costs such as transmission, distribution, congestion and
                    administration. Even at the full-system layer these are modeled costs, not billed revenue, so no
                    figure here equals an actual customer bill or Austin Energy's audited revenue.
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
                  <h2 className="font-semibold text-foreground mb-1">Cost layers</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Layer 1 — fuel and contracted energy.</strong> Reported fuel purchases for coal, gas and
                      oil; contracted $/MWh for resources with no reported fuel price.
                    </li>
                    <li>
                      <strong>Layer 2 — plant O&amp;M and capital.</strong> Variable O&amp;M per MWh plus fixed O&amp;M
                      and capital / debt service per kW-year on Austin Energy's owned capacity, at NREL Annual
                      Technology Baseline rate levels. Contracted wind, solar, biomass and hydro get none: a PPA price
                      is all-in, so adding O&amp;M on top would double count.
                    </li>
                    <li>
                      <strong>Layer 3 — system costs.</strong> Transmission and distribution, ERCOT congestion,
                      ancillary and administrative charges, customer service, general administration and the General
                      Fund transfer. These cannot honestly be split by fuel — allocating wires or congestion to "coal"
                      versus "solar" would be invented precision — so they appear as one gray segment. Derived from
                      Austin Energy approved-budget requirement minus power-supply cost, interpolated between anchor
                      years, from {data.assumptions.systemCosts.startYear} onward.
                    </li>
                  </ul>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-1 pr-3 font-medium">Fuel</th>
                          <th className="py-1 pr-3 font-medium text-right">Variable O&amp;M $/MWh</th>
                          <th className="py-1 pr-3 font-medium text-right">Fixed O&amp;M $/kW-yr</th>
                          <th className="py-1 pr-3 font-medium text-right">Capital $/kW-yr</th>
                          <th className="py-1 font-medium text-right">AE owned MW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.assumptions.nonFuel.rates)
                          .filter(
                            ([k, r]) =>
                              r.varOmUsdPerMwh > 0 ||
                              (data.assumptions.nonFuel.ownedCapacityMw[k] ?? 0) > 0,
                          )
                          .map(([k, r]) => (
                            <tr key={k} className="border-b last:border-0">
                              <td className="py-1 pr-3">{FUEL_META[k as FuelKey]?.label ?? k}</td>
                              <td className="py-1 pr-3 text-right">${r.varOmUsdPerMwh.toFixed(2)}</td>
                              <td className="py-1 pr-3 text-right">${r.fixedOmUsdPerKwYr.toFixed(0)}</td>
                              <td className="py-1 pr-3 text-right">${r.capitalUsdPerKwYr.toFixed(0)}</td>
                              <td className="py-1 text-right">
                                {(data.assumptions.nonFuel.ownedCapacityMw[k] ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs">{data.assumptions.nonFuel.source}</p>
                  <p className="mt-1 text-xs">{data.assumptions.systemCosts.source}</p>
                </div>

                <div>
                  <h2 className="font-semibold text-foreground mb-1">Calculation</h2>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto text-foreground">
{`fuel dollars    = heat input (MMBtu) x Texas cost per MMBtu x AE ownership share
plant dollars   = MWh x variable O&M $/MWh
                + AE owned kW x (fixed O&M + capital) $/kW-yr
system dollars  = AE budget requirement - power supply cost   (not split by fuel)
per household   = layer total x residential share of sales (${Math.round(
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
                      Plant O&amp;M, capital and system costs are rate-based estimates, not Austin Energy's reported
                      line items. Fixed and system costs are prorated for the partial year. They are the right order of
                      magnitude for comparing fuels, not an audited accounting.
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
