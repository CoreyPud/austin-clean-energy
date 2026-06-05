import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  zipCode: string | null;
}

const RES_TCAD_TYPES = new Set(["single_family", "condo", "multifamily"]);
const COM_TCAD_TYPES = new Set(["commercial"]);
const RES_COM_PERMIT_CLASSES = new Set(["residential", "commercial"]);

const fetchAll = async <T,>(
  table: string,
  columns: string,
  eq?: { col: string; val: string },
): Promise<T[]> => {
  const pageSize = 1000;
  let from = 0;
  const out: T[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = (supabase as any).from(table).select(columns).range(from, from + pageSize - 1);
    if (eq) q = q.eq(eq.col, eq.val);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
};

const ZipSolarAdoptionTrend = ({ zipCode }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [builtRows, setBuiltRows] = useState<Array<{ year: number; property_type: string; built_count: number }>>([]);
  const [solarDates, setSolarDates] = useState<string[]>([]);
  const [austinBuiltRows, setAustinBuiltRows] = useState<Array<{ year: number; property_type: string; built_count: number }>>([]);
  const [austinSolarRows, setAustinSolarRows] = useState<Array<{ year: number; permit_class: string; solar_count: number }>>([]);

  useEffect(() => {
    if (!zipCode) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [built, installs, austinBuilt, austinSolar] = await Promise.all([
          fetchAll<any>("tcad_built_by_year_type_zip", "year, property_type, built_count", {
            col: "zip",
            val: zipCode,
          }),
          fetchAll<any>("solar_installations", "completed_date, issued_date", {
            col: "original_zip",
            val: zipCode,
          }),
          fetchAll<any>("tcad_built_by_year_type_zip", "year, property_type, built_count"),
          fetchAll<any>("solar_permits_by_year_class_zip", "year, permit_class, solar_count"),
        ]);
        if (cancelled) return;
        setBuiltRows(
          built
            .filter((r) => r.year != null)
            .map((r) => ({
              year: Number(r.year),
              property_type: String(r.property_type || "unknown"),
              built_count: Number(r.built_count) || 0,
            })),
        );
        setSolarDates(
          installs
            .map((r: any) => r.completed_date || r.issued_date)
            .filter((d: string | null) => !!d) as string[],
        );
        setAustinBuiltRows(
          austinBuilt
            .filter((r) => r.year != null)
            .map((r) => ({
              year: Number(r.year),
              property_type: String(r.property_type || "unknown"),
              built_count: Number(r.built_count) || 0,
            })),
        );
        setAustinSolarRows(
          austinSolar
            .filter((r) => r.year != null)
            .map((r) => ({
              year: Number(r.year),
              permit_class: String(r.permit_class || "unknown").toLowerCase(),
              solar_count: Number(r.solar_count) || 0,
            })),
        );
      } catch (err) {
        console.error("ZipSolarAdoptionTrend load error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  if (!zipCode) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  const tcadTypeMatches = (pt: string) => RES_TCAD_TYPES.has(pt) || COM_TCAD_TYPES.has(pt);

  // ----- ZIP: quarterly bars -----
  const builtByYear: Record<number, number> = {};
  builtRows.forEach((r) => {
    if (!tcadTypeMatches(r.property_type)) return;
    builtByYear[r.year] = (builtByYear[r.year] || 0) + r.built_count;
  });
  const builtYearsSorted = Object.keys(builtByYear).map(Number).sort((a, b) => a - b);
  const cumulativeBuiltByYear: Record<number, number> = {};
  let runningBuilt = 0;
  builtYearsSorted.forEach((y) => {
    runningBuilt += builtByYear[y];
    cumulativeBuiltByYear[y] = runningBuilt;
  });

  const solarByYQ: Record<string, number> = {};
  solarDates.forEach((d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return;
    const y = dt.getUTCFullYear();
    const q = Math.floor(dt.getUTCMonth() / 3) + 1;
    if (y < 2014) return;
    solarByYQ[`${y}-Q${q}`] = (solarByYQ[`${y}-Q${q}`] || 0) + 1;
  });

  // ----- Austin: annual cumulative % (line) -----
  const austinBuiltByYear: Record<number, number> = {};
  austinBuiltRows.forEach((r) => {
    if (!tcadTypeMatches(r.property_type)) return;
    austinBuiltByYear[r.year] = (austinBuiltByYear[r.year] || 0) + r.built_count;
  });
  const austinBuiltYearsSorted = Object.keys(austinBuiltByYear).map(Number).sort((a, b) => a - b);
  const austinCumulativeBuilt: Record<number, number> = {};
  let runA = 0;
  austinBuiltYearsSorted.forEach((y) => {
    runA += austinBuiltByYear[y];
    austinCumulativeBuilt[y] = runA;
  });
  const austinSolarByYear: Record<number, number> = {};
  austinSolarRows.forEach((r) => {
    if (!RES_COM_PERMIT_CLASSES.has(r.permit_class)) return;
    austinSolarByYear[r.year] = (austinSolarByYear[r.year] || 0) + r.solar_count;
  });

  let lastTotal = 0;
  const presetYears = builtYearsSorted.filter((y) => y <= 2013);
  if (presetYears.length) lastTotal = cumulativeBuiltByYear[presetYears[presetYears.length - 1]];

  let lastAustinTotal = 0;
  const austinPresetYears = austinBuiltYearsSorted.filter((y) => y <= 2013);
  if (austinPresetYears.length) lastAustinTotal = austinCumulativeBuilt[austinPresetYears[austinPresetYears.length - 1]];

  const chartData: Array<{
    label: string;
    year: number;
    quarter: number;
    solar_count: number;
    total_count: number;
    solar_pct: number;
    austin_pct: number;
  }> = [];

  let runningPermits = 0;
  let austinPrevPct = 0;
  for (let y = 2014; y <= currentYear; y++) {
    if (cumulativeBuiltByYear[y] !== undefined) lastTotal = cumulativeBuiltByYear[y];
    if (austinCumulativeBuilt[y] !== undefined) lastAustinTotal = austinCumulativeBuilt[y];

    // Compute Austin end-of-year cumulative pct, then interpolate across quarters
    const austinYearAdd = austinSolarByYear[y] || 0;
    const austinEndCum = (chartData.length > 0
      ? (austinPrevPct / 100) * lastAustinTotal
      : 0) + austinYearAdd;
    const austinEndPct = lastAustinTotal > 0
      ? Math.min(austinEndCum, lastAustinTotal) / lastAustinTotal * 100
      : 0;

    const lastQ = y === currentYear ? currentQuarter : 4;
    for (let q = 1; q <= lastQ; q++) {
      runningPermits += solarByYQ[`${y}-Q${q}`] || 0;
      const solar = Math.min(runningPermits, lastTotal);
      const pct = lastTotal > 0 ? (solar / lastTotal) * 100 : 0;
      // Linear interpolation between prior year-end pct and this year-end pct
      const austinPct = austinPrevPct + (austinEndPct - austinPrevPct) * (q / 4);
      chartData.push({
        label: `${y}-Q${q}`,
        year: y,
        quarter: q,
        solar_count: solar,
        total_count: lastTotal,
        solar_pct: +pct.toFixed(2),
        austin_pct: +austinPct.toFixed(3),
      });
    }
    austinPrevPct = austinEndPct;
  }


  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl">Solar adoption over time in your area</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                ticks={chartData.filter((d) => d.quarter === 1).map((d) => d.label)}
                tickFormatter={(v: string) => v.slice(0, 4)}
              />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d: any = payload[0].payload;
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                        <p className="font-medium text-sm mb-1">
                          Through {d.year} Q{d.quarter} · ZIP {zipCode}
                        </p>
                        <p className="text-sm">
                          <span style={{ color: "hsl(var(--primary))" }}>Your ZIP:</span>{" "}
                          {d.solar_pct.toFixed(2)}%
                        </p>
                        <p className="text-sm">
                          <span style={{ color: "hsl(var(--foreground))" }}>Austin avg:</span>{" "}
                          {d.austin_pct.toFixed(2)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Number(d.solar_count).toLocaleString()} of{" "}
                          {Number(d.total_count).toLocaleString()} properties in ZIP
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="solar_pct" fill="hsl(var(--primary))" name="Your ZIP" />
              <Line
                type="monotone"
                dataKey="austin_pct"
                stroke="#86efac"
                strokeWidth={3}
                dot={false}
                name="Austin average"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Sources: City of Austin solar permits (2014–present, ZIP bars by completion quarter; Austin line annual) and TCAD property records.
        </p>
      </CardContent>
    </Card>
  );
};

export default ZipSolarAdoptionTrend;
