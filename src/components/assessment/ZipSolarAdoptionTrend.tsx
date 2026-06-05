import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  zipCode: string | null;
}

const RES_TCAD_TYPES = new Set(["single_family", "condo", "multifamily"]);
const COM_TCAD_TYPES = new Set(["commercial"]);

const fmtCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
};

const fetchAll = async <T,>(table: string, columns: string, zip: string): Promise<T[]> => {
  const pageSize = 1000;
  let from = 0;
  const out: T[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(columns)
      .eq("zip", zip)
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
  const [solarRows, setSolarRows] = useState<Array<{ year: number; permit_class: string; solar_count: number }>>([]);

  useEffect(() => {
    if (!zipCode) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const [built, solar] = await Promise.all([
          fetchAll<any>("tcad_built_by_year_type_zip", "year, property_type, built_count", zipCode),
          fetchAll<any>("solar_permits_by_year_class_zip", "year, permit_class, solar_count", zipCode),
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
        setSolarRows(
          solar
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

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = 2014; y <= currentYear; y++) years.push(y);

  const tcadTypeMatches = (pt: string) => RES_TCAD_TYPES.has(pt) || COM_TCAD_TYPES.has(pt);
  const permitClassMatches = (cls: string) => cls === "residential" || cls === "commercial";

  const builtByYear: Record<number, number> = {};
  builtRows.forEach((r) => {
    if (!tcadTypeMatches(r.property_type)) return;
    builtByYear[r.year] = (builtByYear[r.year] || 0) + r.built_count;
  });
  const solarByYear: Record<number, number> = {};
  solarRows.forEach((r) => {
    if (!permitClassMatches(r.permit_class)) return;
    solarByYear[r.year] = (solarByYear[r.year] || 0) + r.solar_count;
  });

  const builtYearsSorted = Object.keys(builtByYear).map(Number).sort((a, b) => a - b);
  const cumulativeBuiltByYear: Record<number, number> = {};
  let runningBuilt = 0;
  builtYearsSorted.forEach((y) => {
    runningBuilt += builtByYear[y];
    cumulativeBuiltByYear[y] = runningBuilt;
  });

  let lastTotal = 0;
  const presetYears = builtYearsSorted.filter((y) => y <= 2013);
  if (presetYears.length) lastTotal = cumulativeBuiltByYear[presetYears[presetYears.length - 1]];

  let runningPermits = 0;
  const chartData = years.map((y) => {
    runningPermits += solarByYear[y] || 0;
    if (cumulativeBuiltByYear[y] !== undefined) lastTotal = cumulativeBuiltByYear[y];
    const solar = Math.min(runningPermits, lastTotal);
    const pct = lastTotal > 0 ? (solar / lastTotal) * 100 : 0;
    return {
      year: y,
      solar_count: solar,
      total_count: lastTotal,
      solar_pct: +pct.toFixed(2),
    };
  });

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
              <XAxis dataKey="year" />
              <YAxis tickFormatter={fmtCompact} />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d: any = payload[0].payload;
                    const pct = d.total_count > 0 ? (d.solar_count / d.total_count) * 100 : 0;
                    return (
                      <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                        <p className="font-medium text-sm mb-1">Through {d.year} · ZIP {zipCode}</p>
                        <p className="text-sm">
                          <span style={{ color: "hsl(var(--primary))" }}>With solar:</span>{" "}
                          {Number(d.solar_count).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total properties: {Number(d.total_count).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{pct.toFixed(2)}% adoption</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="solar_count" stackId="a" fill="hsl(var(--primary))" name="With solar" />
              <Bar dataKey="remaining_count" stackId="a" fill="hsl(var(--muted-foreground) / 0.3)" name="Without solar" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Sources: City of Austin solar permits (2014–present) and TCAD property records.
        </p>
      </CardContent>
    </Card>
  );
};

export default ZipSolarAdoptionTrend;
