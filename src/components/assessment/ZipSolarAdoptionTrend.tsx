import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const fetchAllByZip = async <T,>(
  table: string,
  columns: string,
  zip: string,
  zipCol = "zip",
): Promise<T[]> => {
  const pageSize = 1000;
  let from = 0;
  const out: T[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(columns)
      .eq(zipCol, zip)
      .range(from, from + pageSize - 1);
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

  useEffect(() => {
    if (!zipCode) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [built, installs] = await Promise.all([
          fetchAllByZip<any>("tcad_built_by_year_type_zip", "year, property_type, built_count", zipCode),
          fetchAllByZip<any>(
            "solar_installations",
            "completed_date, issued_date",
            zipCode,
            "original_zip",
          ),
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

  // Annual building totals (denominator step function)
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

  // Quarterly solar permits
  const solarByYQ: Record<string, number> = {};
  solarDates.forEach((d) => {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return;
    const y = dt.getUTCFullYear();
    const q = Math.floor(dt.getUTCMonth() / 3) + 1;
    if (y < 2010) return;
    const k = `${y}-Q${q}`;
    solarByYQ[k] = (solarByYQ[k] || 0) + 1;
  });

  // Carry forward total built across quarters of the year
  let lastTotal = 0;
  const presetYears = builtYearsSorted.filter((y) => y <= 2009);
  if (presetYears.length) lastTotal = cumulativeBuiltByYear[presetYears[presetYears.length - 1]];

  const chartData: Array<{
    label: string;
    year: number;
    quarter: number;
    solar_count: number;
    total_count: number;
    solar_pct: number;
  }> = [];

  let runningPermits = 0;
  for (let y = 2014; y <= currentYear; y++) {
    if (cumulativeBuiltByYear[y] !== undefined) lastTotal = cumulativeBuiltByYear[y];
    const lastQ = y === currentYear ? currentQuarter : 4;
    for (let q = 1; q <= lastQ; q++) {
      runningPermits += solarByYQ[`${y}-Q${q}`] || 0;
      const solar = Math.min(runningPermits, lastTotal);
      const pct = lastTotal > 0 ? (solar / lastTotal) * 100 : 0;
      chartData.push({
        label: `${y}-Q${q}`,
        year: y,
        quarter: q,
        solar_count: solar,
        total_count: lastTotal,
        solar_pct: +pct.toFixed(2),
      });
    }
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
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                interval={0}
                tickFormatter={(v: string) => (v.endsWith("Q1") ? v.slice(0, 4) : "")}
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
                          <span style={{ color: "hsl(var(--primary))" }}>Solar coverage:</span>{" "}
                          {d.solar_pct.toFixed(2)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Number(d.solar_count).toLocaleString()} of{" "}
                          {Number(d.total_count).toLocaleString()} properties
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="solar_pct" fill="hsl(var(--primary))" name="% with solar" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Sources: City of Austin solar permits (2014–present, by completion quarter) and TCAD property records (annual).
        </p>
      </CardContent>
    </Card>
  );
};

export default ZipSolarAdoptionTrend;
