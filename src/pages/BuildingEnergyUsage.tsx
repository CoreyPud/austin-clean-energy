import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import { ArrowLeft, Building2, Download, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSeo } from "@/hooks/use-seo";
import {
  loadBuildingEnergyCsv,
  stackByYear,
  byPropertyType,
  totals,
  peakMwByYear,
  systemContext,
  AUSTIN_ENERGY_PEAK_MW,
  type BuildingEnergyRow,
} from "@/lib/building-energy";

const PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#8b5cf6", // purple
  "#ef4444", // red
  "#06b6d4", // cyan
];

const nf = new Intl.NumberFormat("en-US");

type SortKey = keyof BuildingEnergyRow;

const BuildingEnergyUsage = () => {
  useSeo({
    title: "Austin Building Energy Usage",
    description:
      "Estimated annual energy load for new Austin building permits, based on ECAD benchmarks and third-party sources.",
  });

  const [rows, setRows] = useState<BuildingEnergyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("est_annual_kwh");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadBuildingEnergyCsv()
      .then((r) => {
        if (!cancelled) {
          setRows(r);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stacked = useMemo(() => stackByYear(rows), [rows]);
  const typeAgg = useMemo(() => byPropertyType(rows), [rows]);
  const kpis = useMemo(() => totals(rows), [rows]);
  const mwSeries = useMemo(() => peakMwByYear(rows), [rows]);
  const ctx = useMemo(() => systemContext(rows), [rows]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av);
      const bs = String(bv);
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const topRows = sortedRows.slice(0, 10);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "est_annual_kwh" || key === "sqft" ? "desc" : "asc");
    }
  };

  const benchmarks = [
    {
      type: "single_family",
      eui: "6.48",
      basis:
        "EIA RECS — avg Texas home: 13,152 kWh/yr / 2,031 sqft (electricity only)",
    },
    {
      type: "residential_other",
      eui: "6.48",
      basis:
        "Proxy: same as single_family (heterogeneous catch-all, no dedicated benchmark)",
    },
    {
      type: "adu_accessory",
      eui: "8.94",
      basis:
        "Texas single_family × 1.38 small-home intensity multiplier (EIA RECS 2020 Table CE3.1)",
    },
    {
      type: "personal_services",
      eui: "14.04",
      basis:
        "ENERGY STAR Portfolio Manager national median — salons, dry cleaning, repair (47.9 kBtu/sqft ÷ 3.412; all-fuel)",
    },
    {
      type: "pool_spa",
      eui: "n/a",
      basis:
        "No conditioned sqft — pumps run ~3,000–5,000 kWh/yr regardless of size",
    },
  ];

  const sources = [
    {
      label: "Austin Open Data energy benchmarking",
      url: "https://data.austintexas.gov/stories/s/Energy-Benchmarking-Data-for-City-Buildings/5sh7-c6he/",
    },
    {
      label: "EIA — Electricity use in homes",
      url: "https://www.eia.gov/energyexplained/electricity/use-of-electricity.php",
    },
    {
      label: "EIA RECS 2020 Table CE3.1",
      url: "https://www.eia.gov/consumption/residential/data/2020/index.php",
    },
    {
      label: "ENERGY STAR Portfolio Manager US National Median Table",
      url: "https://portfoliomanager.energystar.gov/pdf/reference/US%20National%20Median.pdf",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Austin at a Glance
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Building Energy Usage
          </h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Estimated annual electricity load of newly permitted Austin
            buildings, stacked by property type. Estimates blend ECAD
            benchmarks with third-party EUI references.
          </p>
        </div>

        {/* Hero chart */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                Loading energy data…
              </div>
            ) : error ? (
              <div className="h-[320px] flex items-center justify-center text-destructive text-sm">
                {error}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={stacked.data} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    label={{
                      value: "MWh / yr",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                        textAnchor: "middle",
                      },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {stacked.types.map((t, i) => (
                    <Area
                      key={t}
                      type="monotone"
                      dataKey={t}
                      stackId="1"
                      stroke={PALETTE[i % PALETTE.length]}
                      fill={PALETTE[i % PALETTE.length]}
                      fillOpacity={0.55}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak MW chart */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Estimated peak MW added per year
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Rough peak-demand contribution from newly permitted buildings each
              year, converted from annual kWh using a 0.5 load factor. Per-year
              additions, not cumulative.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Loading…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={mwSeries} margin={{ left: 8, right: 12, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      label={{
                        value: "MW (peak)",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                          textAnchor: "middle",
                        },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v.toFixed(2)} MW`, "Peak"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="peak_mw"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Permits", value: nf.format(kpis.permits), sub: "" },
            { label: "Total permitted sqft", value: nf.format(kpis.sqft), sub: "" },
            { label: "Est. annual MWh", value: nf.format(kpis.mwh), sub: "" },
            {
              label: "Top property type",
              value: kpis.topType,
              sub: "",
            },
            {
              label: "Est. peak MW added",
              value: `${ctx.roughPeakMw.toFixed(1)} MW`,
              sub: `${ctx.pctOfSystemPeak.toFixed(2)}% of AE ${nf.format(AUSTIN_ENERGY_PEAK_MW)} MW peak`,
            },
            {
              label: "% of AE annual sales",
              value: `${ctx.pctOfAnnualSales.toFixed(2)}%`,
              sub: "vs. 14 TWh FY2024",
            },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-foreground tabular-nums break-words">
                  {k.value}
                </div>
                {k.sub && (
                  <div className="mt-1 text-xs text-muted-foreground">{k.sub}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>


        {/* By property type */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Estimated load by property type
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer
                width="100%"
                height={Math.max(240, typeAgg.length * 36 + 40)}
              >
                <BarChart
                  data={typeAgg}
                  layout="vertical"
                  margin={{ left: 20, right: 60, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => nf.format(v)}
                  />
                  <YAxis
                    dataKey="property_type"
                    type="category"
                    width={140}
                    tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${nf.format(v)} MWh`, "Est. load"]}
                  />
                  <Bar
                    dataKey="mwh"
                    fill="hsl(var(--primary))"
                    radius={[0, 6, 6, 0]}
                  >
                    <LabelList
                      dataKey="mwh"
                      position="right"
                      formatter={(v: number) => `${nf.format(v)} MWh`}
                      style={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Permit table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-foreground">Permit-level data</h2>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href="/data/building-energy-usage.csv" download>
                <Download className="h-4 w-4" />
                Download CSV
              </a>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {(
                      [
                        ["permit_id", "Permit"],
                        ["issued_date", "Issued"],
                        ["property_type", "Type"],
                        ["sqft", "Sqft"],
                        ["est_annual_kwh", "Est. kWh/yr"],
                        ["permit_class", "Class"],
                      ] as [SortKey, string][]
                    ).map(([key, label]) => (
                      <th
                        key={key}
                        className="px-4 py-3 cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort(key)}
                      >
                        {label}
                        {sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topRows.map((r) => (
                    <tr key={r.permit_id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono text-xs">{r.permit_id}</td>
                      <td className="px-4 py-2 tabular-nums">{r.issued_date}</td>
                      <td className="px-4 py-2">{r.property_type}</td>
                      <td className="px-4 py-2 tabular-nums">{nf.format(r.sqft)}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {nf.format(r.est_annual_kwh)}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {r.permit_class}
                      </td>
                    </tr>
                  ))}
                  {topRows.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No permits loaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(10, sortedRows.length)} of {nf.format(rows.length)} permits — the full
            dataset drives the charts and KPIs above.
          </p>
        </section>

        {/* Methodology */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">How this is calculated</h2>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Formula
              </div>
              <pre className="rounded-md bg-muted/50 border border-border p-4 text-sm font-mono overflow-x-auto">
                estimated_annual_kwh = calculated_eui_kwh_sqft × total_new_add_sqft
              </pre>
              <p className="text-sm text-muted-foreground leading-relaxed">
                EUI (kWh/sqft/yr) is a normalized electricity-use-intensity benchmark.
                Commercial benchmarks come from Austin's ECAD program (median across
                roughly 3,500 reporting properties per <code>property_type</code>, with
                standard IQR outlier trimming). Residential and personal-services use
                types are filled from national/state literature.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Annual kWh → peak MW
              </div>
              <pre className="rounded-md bg-muted/50 border border-border p-4 text-sm font-mono overflow-x-auto">
{`avg_kw      = total_annual_kwh / 8760
peak_mw     = (avg_kw / load_factor) / 1000
load_factor = 0.5   // mixed-use rough assumption`}
              </pre>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Load factor converts average load to a rough peak-demand estimate.
                A 0.5 factor is a mixed-use approximation — adjust if a better
                basis is available. System context: Austin Energy sold ~14 TWh
                in FY2024 and set a record system peak of {nf.format(AUSTIN_ENERGY_PEAK_MW)} MW in
                August 2023.
              </p>
            </CardContent>
          </Card>


          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Literature-based benchmarks
            </h3>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Use type</th>
                      <th className="px-4 py-3">kWh/sqft/yr</th>
                      <th className="px-4 py-3">Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {benchmarks.map((b) => (
                      <tr key={b.type}>
                        <td className="px-4 py-3 font-mono text-xs">{b.type}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold">{b.eui}</td>
                        <td className="px-4 py-3 text-muted-foreground">{b.basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Sources</h3>
            <ul className="space-y-2">
              {sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Known limitations</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm">
                <li>
                  ECAD's EUI is electricity-only, while the ENERGY STAR figure for{" "}
                  <code>personal_services</code> is all-fuel.
                </li>
                <li>
                  ECAD is commercial only; residential numbers come from national/state
                  literature, not Austin-specific measurement.
                </li>
                <li>Median EUI is a benchmark, not a per-project measurement.</li>
                <li>
                  Some ECAD property types have very few observations, making their
                  median less reliable.
                </li>
                <li>
                  The <code>permit_class</code>-based classification deliberately
                  excludes ambiguous/generic codes, trading coverage for confidence.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </section>
      </div>
    </div>
  );
};

export default BuildingEnergyUsage;
