import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, TrendingUp, Home, Car, Zap, Building2 } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { evAdoptionSeries } from "@/data/ev-adoption";
import { useSeo } from "@/hooks/use-seo";

// Load assumptions (annual kWh -> average MW: kWh / 8760)
const KWH_PER_NEW_HOME = 10500; // avg TX single-family, all-electric-leaning
const KWH_PER_NEW_COMMERCIAL_UNIT = 45000; // avg for a new commercial permit unit
const KWH_PER_EV = 3500; // avg light-duty EV annual charging
const BASELINE_YEAR = 2020;

// City of Austin baseline peak demand (MW) — reference point only
const BASELINE_PEAK_MW_2020 = 2800;

const kWhToAvgMW = (kwh: number) => kwh / 8760;

type PermitCounts = Record<number, { residential: number; commercial: number }>;

const AUSTIN_PERMITS_ENDPOINT = "https://data.austintexas.gov/resource/3syk-w9eu.json";

async function fetchPermitsByYear(): Promise<PermitCounts> {
  // Aggregate new-construction permits (residential + commercial) issued since BASELINE_YEAR.
  // Uses SoQL grouping to keep payload small.
  const where = `issued_date >= '${BASELINE_YEAR}-01-01T00:00:00' AND work_class in('New','New Construction') AND permit_type_desc in('Building Permit','Commercial Building Permit','Residential Building Permit')`;
  const url =
    `${AUSTIN_PERMITS_ENDPOINT}?$select=date_extract_y(issued_date) AS yr, permit_type_desc, count(*) AS n` +
    `&$where=${encodeURIComponent(where)}&$group=yr,permit_type_desc&$limit=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Permits fetch failed: ${res.status}`);
  const rows: Array<{ yr: string; permit_type_desc: string; n: string }> = await res.json();
  const out: PermitCounts = {};
  for (const r of rows) {
    const y = Number(r.yr);
    if (!out[y]) out[y] = { residential: 0, commercial: 0 };
    const n = Number(r.n) || 0;
    if (/commercial/i.test(r.permit_type_desc)) out[y].commercial += n;
    else out[y].residential += n;
  }
  return out;
}

function evCountAtYearEnd(year: number): number {
  // Pick the latest series entry within the given year, else last available.
  const inYear = evAdoptionSeries.filter((d) => d.date.startsWith(String(year)));
  if (inYear.length) return inYear[inYear.length - 1].austin;
  const before = evAdoptionSeries.filter((d) => Number(d.date.slice(0, 4)) <= year);
  return before.length ? before[before.length - 1].austin : 0;
}

const LoadGrowth = () => {
  useSeo({
    title: "Austin Load Growth Projections",
    description:
      "How building permits and EV registrations are driving Austin's electric load growth since 2020 — with forward projections built from real-time data.",
  });

  const [permits, setPermits] = useState<PermitCounts | null>(null);
  const [permitError, setPermitError] = useState<string | null>(null);

  useEffect(() => {
    fetchPermitsByYear()
      .then(setPermits)
      .catch((e) => setPermitError(e.message ?? "Failed to load permit data"));
  }, []);

  const currentYear = new Date().getFullYear();
  const historicalYears = useMemo(() => {
    const arr: number[] = [];
    for (let y = BASELINE_YEAR; y <= currentYear; y++) arr.push(y);
    return arr;
  }, [currentYear]);

  const chartData = useMemo(() => {
    // Per-year added load (MW avg) from that year's new permits + net new EVs.
    type Point = {
      year: number;
      newHomesMW: number;
      newCommercialMW: number;
      evsMW: number;
      totalAddedMW: number;
      projection: boolean;
    };

    const historical: Point[] = historicalYears.map((year, i) => {
      const p = permits?.[year] ?? { residential: 0, commercial: 0 };
      const prevYear = historicalYears[i - 1] ?? year - 1;
      const evsThisYear = evCountAtYearEnd(year) - evCountAtYearEnd(prevYear);

      const homeMW = kWhToAvgMW(p.residential * KWH_PER_NEW_HOME);
      const commMW = kWhToAvgMW(p.commercial * KWH_PER_NEW_COMMERCIAL_UNIT);
      const evMW = kWhToAvgMW(Math.max(0, evsThisYear) * KWH_PER_EV);

      return {
        year,
        newHomesMW: +homeMW.toFixed(1),
        newCommercialMW: +commMW.toFixed(1),
        evsMW: +evMW.toFixed(1),
        totalAddedMW: +(homeMW + commMW + evMW).toFixed(1),
        projection: false,
      };
    });

    // Projection: average of last 3 complete years' annual additions, held forward.
    // Skip the current year if permits are still coming in (partial year).
    const complete = historical.filter((h) => h.year < currentYear);
    const last3 = complete.slice(-3);
    if (last3.length >= 1) {
      const avg = (key: "newHomesMW" | "newCommercialMW" | "evsMW") =>
        last3.reduce((s, d) => s + d[key], 0) / last3.length;
      const aH = avg("newHomesMW");
      const aC = avg("newCommercialMW");
      const aE = avg("evsMW");

      for (let i = 1; i <= 5; i++) {
        const year = currentYear + i;
        const newHomesMW = +aH.toFixed(1);
        const newCommercialMW = +aC.toFixed(1);
        const evsMW = +aE.toFixed(1);
        const totalAddedMW = +(newHomesMW + newCommercialMW + evsMW).toFixed(1);
        historical.push({
          year,
          newHomesMW,
          newCommercialMW,
          evsMW,
          totalAddedMW,
          projection: true,
        });
      }
    }

    return historical;
  }, [permits, historicalYears, currentYear]);

  // Use last complete (prior) year as "latest actual" since current year permits are still trickling in.
  const completeActuals = chartData.filter((d) => !d.projection && d.year < currentYear);
  const latestActual = completeActuals.slice(-1)[0];
  const latestProjected = chartData.slice(-1)[0];

  const totalPermitsToDate = permits
    ? Object.values(permits).reduce((s, v) => s + v.residential + v.commercial, 0)
    : null;
  const evsSince2020 = evCountAtYearEnd(currentYear) - evCountAtYearEnd(BASELINE_YEAR);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Austin Load Growth Projections"
        subtitle="Building permits and EV registrations are the two clearest real-time signals of how Austin's electricity demand is growing. This page combines both to estimate how much new load has been added since 2020 — and where it's headed."
        backTo="/"
      />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" /> New construction permits
              </CardDescription>
              <CardTitle className="text-3xl">
                {totalPermitsToDate?.toLocaleString() ?? "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Issued in the City of Austin since {BASELINE_YEAR} (residential + commercial new-build).
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" /> EVs added in Travis County
              </CardDescription>
              <CardTitle className="text-3xl">{evsSince2020.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Net registered light-duty EVs added since {BASELINE_YEAR}.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Load added last full year
              </CardDescription>
              <CardTitle className="text-3xl">
                {latestActual ? `${latestActual.totalAddedMW} MW` : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Avg power from that year's new buildings + EVs ({latestActual?.year ?? "—"}). Peak demand is typically 1.5–2× this.
            </CardContent>
          </Card>
        </section>

        {/* Chart */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">New load added each year, with 5-year projection</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Each bar shows load added <em>in that year alone</em> from new residential permits, new commercial permits, and net new EV registrations — the annual increment planners need to size new generation. The dashed region is a projection extrapolated from recent trends, not a utility forecast.
          </p>

          <Card>
            <CardContent className="pt-6">
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      label={{
                        value: "Added avg load (MW)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <ReferenceLine
                      x={currentYear}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      label={{ value: "Today", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="newHomesMW"
                      stackId="1"
                      name="New homes"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.55}
                    />
                    <Area
                      type="monotone"
                      dataKey="newCommercialMW"
                      stackId="1"
                      name="New commercial"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.55}
                    />
                    <Area
                      type="monotone"
                      dataKey="evsMW"
                      stackId="1"
                      name="EVs"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent))"
                      fillOpacity={0.55}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalAddedMW"
                      name="Total added"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {permitError && (
                <Alert className="mt-4" variant="default">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Permit data temporarily unavailable</AlertTitle>
                  <AlertDescription>
                    Couldn't reach the Austin Open Data permits endpoint ({permitError}). EV-based load
                    is still shown; building contributions will populate on the next successful fetch.
                  </AlertDescription>
                </Alert>
              )}

              {latestActual && latestProjected && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Today ({latestActual.year})
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      +{latestActual.totalAddedMW} MW avg
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ {(latestActual.totalAddedMW * 1.75).toFixed(0)} MW of new peak demand added
                      since {BASELINE_YEAR}.
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Projected {latestProjected.year}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      +{latestProjected.totalAddedMW} MW avg
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If recent growth in permits and EV registrations continues.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Drivers */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" /> New construction
              </CardTitle>
              <CardDescription>Live from City of Austin permits (dataset 3syk-w9eu)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Every issued new-build permit adds recurring electricity demand — a new home averages
                ~{KWH_PER_NEW_HOME.toLocaleString()} kWh/yr, and a new commercial unit averages
                ~{KWH_PER_NEW_COMMERCIAL_UNIT.toLocaleString()} kWh/yr in Central Texas.
              </p>
              <p>
                We aggregate permits by year with <code>work_class = New</code> and building permit
                types, then convert to average MW.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5 text-primary" /> Electric vehicles
              </CardTitle>
              <CardDescription>Travis County registrations (Atlas EV Hub / TxDMV)</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                A typical light-duty EV in Austin adds ~{KWH_PER_EV.toLocaleString()} kWh/yr of
                charging demand. That's small per vehicle, but Travis County has added tens of
                thousands of EVs since {BASELINE_YEAR}.
              </p>
              <p>
                EV load is time-shifted — most charging happens overnight, which softens its peak
                impact but grows shoulder-hour baseload.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Methodology */}
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Methodology &amp; caveats</h2>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>This is a directional estimate, not a utility forecast</AlertTitle>
            <AlertDescription>
              Austin Energy's official load forecast incorporates weather, industrial customers,
              price elasticity, and DER offsets we can't model here. This page shows what's visible
              in <em>public</em> data — permits + EV registrations — to give a real-time sense of
              which way demand is trending.
            </AlertDescription>
          </Alert>

          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Baseline year:</strong> {BASELINE_YEAR}. Load is expressed as{" "}
              <em>added average MW</em> above that baseline.
            </li>
            <li>
              <strong>Homes:</strong> {KWH_PER_NEW_HOME.toLocaleString()} kWh/yr per new residential permit.
            </li>
            <li>
              <strong>Commercial:</strong> {KWH_PER_NEW_COMMERCIAL_UNIT.toLocaleString()} kWh/yr per new
              commercial permit unit (varies widely by use).
            </li>
            <li>
              <strong>EVs:</strong> {KWH_PER_EV.toLocaleString()} kWh/yr per registered light-duty EV.
            </li>
            <li>
              <strong>Projection:</strong> linear extrapolation of the 3-year average change in each
              driver. Not a scenario forecast.
            </li>
            <li>
              <strong>Peak vs average:</strong> peak demand typically runs 1.5–2× average, driven by
              summer afternoon AC load.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default LoadGrowth;
