import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, Legend,
} from "recharts";
import { No2Map, type Plant } from "@/components/No2Map";
import MapTokenLoader from "@/components/MapTokenLoader";

const FUEL_ORDER = ["coal","oil","gas","biomass","hydro","nuclear","wind","solar","rooftop","other"] as const;

const GROUPS = [
  { key: "coal_oil",    fuels: ["coal","oil"] as string[],                                              color: "#dc2626", label: "Coal & Oil"   },
  { key: "gas",         fuels: ["gas"] as string[],                                                     color: "#d97706", label: "Gas"          },
  { key: "zero_carbon", fuels: ["biomass","nuclear","hydro","wind","solar","rooftop","other"] as string[], color: "#16a34a", label: "Zero Carbon" },
];

const FUEL_COLORS: Record<string, string> = {
  coal:    "#991b1b",
  oil:     "#dc2626",
  gas:     "#d97706",
  biomass: "#a16207",
  nuclear: "#166534",
  hydro:   "#0d9488",
  wind:    "#16a34a",
  solar:   "#4ade80",
  rooftop: "#84cc16",
  other:   "#6b7280",
};

const MONTHLY_CF = [0.140, 0.155, 0.180, 0.205, 0.200, 0.195, 0.195, 0.200, 0.185, 0.165, 0.135, 0.125];

interface No2Data {
  months:              string[];
  labels:              string[];
  monthly_gen:         Record<string, Record<string, number>>;
  ae_monthly_gen:      Record<string, Record<string, number>>;
  ae_monthly_gen_raw:  Record<string, Record<string, number>>;
  ae_monthly_load:     Record<string, number>;
  has_no2:             string[];
  ae_pct:              Record<string, number>;
  projected_from?:     string;
}

const fmtMw   = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v));
const fmtYear = (v: string) => v?.slice(-4) ?? "";

interface Props {
  idx:        number;
  onDataLoad: (months: string[], labels: string[]) => void;
}

export function No2Section({ idx, onDataLoad }: Props) {
  const aeOnly = true;
  const [rolling, setRolling]     = useState(true);
  const [data, setData]           = useState<No2Data | null>(null);
  const [dataError, setDataError] = useState(false);
  const [plants, setPlants]           = useState<Plant[]>([]);
  const [allPlantGen, setAllPlantGen] = useState<Record<string, Record<string, number>>>({});
  const [rooftopMw, setRooftopMw]     = useState<Record<string, number>>({});

  // ── Fetch generation + metadata ────────────────────────────────────────────
  useEffect(() => {
    fetch("/no2_data.json")
      .then(r => { if (!r.ok) throw new Error(""); return r.json(); })
      .then((d: No2Data) => { setData(d); onDataLoad(d.months, d.labels); })
      .catch(() => setDataError(true));
  }, [onDataLoad]);

  // ── Load AE plants from static snapshot ───────────────────────────────────
  useEffect(() => {
    fetch("/ae_plants.json")
      .then(r => r.json())
      .then((rows: any[]) => {
        setPlants(rows.map(p => ({
          id:               p.plantid,
          name:             p.plant_name ?? "",
          lat:              p.latitude ?? 0,
          lon:              p.longitude ?? 0,
          fuel:             p.fuel ?? "other",
          cap_mw:           p.capacity_mw ?? null,
          avg_output_mw:    p.avg_output_mw ?? null,
          owner:            p.owner ?? "",
          commission_month: p.commission_period ?? null,
          retirement_year:  p.retirement_year ?? null,
          co2_tons:         p.co2_tons ?? null,
        })));
      })
      .catch(() => {});
  }, []);

  // ── Load AE monthly gen from static snapshot ──────────────────────────────
  useEffect(() => {
    fetch("/plant_monthly_gen.json")
      .then(r => r.json())
      .then((rows: { plantid: number; period: string; avg_mw: number | null }[]) => {
        const grouped: Record<string, Record<string, number>> = {};
        rows.forEach(r => {
          if (!grouped[r.period]) grouped[r.period] = {};
          grouped[r.period][String(r.plantid)] = r.avg_mw ?? 0;
        });
        setAllPlantGen(grouped);
      })
      .catch(() => {});
  }, []);

  // ── Rooftop solar (AE view, Austin permit data) ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const rows: { issued_date: string; installed_kw: number }[] =
          await fetch("/solar_installations.json").then(r => r.json());
        if (!rows.length) return;

        const monthlyNew: Record<string, number> = {};
        rows.forEach(({ issued_date, installed_kw }) => {
          const key = issued_date.slice(0, 7).replace("-", "_");
          monthlyNew[key] = (monthlyNew[key] || 0) + installed_kw;
        });

        const sortedKeys = Object.keys(monthlyNew).sort();
        let cumulKw = 0;
        const rawMw: { key: string; mw: number }[] = [];
        sortedKeys.forEach(key => {
          cumulKw += monthlyNew[key];
          const mo = parseInt(key.slice(5, 7), 10);
          rawMw.push({ key, mw: (cumulKw / 1000) * MONTHLY_CF[mo - 1] });
        });

        const result: Record<string, number> = {};
        rawMw.forEach(({ key }, i) => {
          const window = rawMw.slice(Math.max(0, i - 12), i);
          if (!window.length) return;
          result[key] = Math.round(window.reduce((s, r) => s + r.mw, 0) / window.length * 10) / 10;
        });
        setRooftopMw(result);
      } catch { /* silently skip */ }
    })();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const curMonthKey = data?.months[idx] ?? "";
  const src         = rolling ? data?.ae_monthly_gen : data?.ae_monthly_gen_raw;
  const plantGen    = allPlantGen[curMonthKey] ?? null;

  const curData = useMemo(() => {
    const base = src?.[curMonthKey] ?? {};
    if (!aeOnly || !rooftopMw[curMonthKey]) return base;
    return { ...base, rooftop: rooftopMw[curMonthKey] };
  }, [src, curMonthKey, aeOnly, rooftopMw]);

  const curLabel = data?.labels[idx] ?? "";
  const totalMw  = FUEL_ORDER.reduce((s, f) => s + (curData[f] || 0), 0);
  const yMax     = aeOnly ? 3000 : undefined;

  const trendData = data?.months.map((m, i) => {
    const mo: Record<string, number> = { ...(src?.[m] ?? {}) };
    if (aeOnly && rooftopMw[m]) mo.rooftop = rooftopMw[m];
    const row: Record<string, string | number> = { label: data!.labels[i] };
    FUEL_ORDER.forEach(f => { row[f] = mo[f] || 0; });
    return row;
  });

  const projLabel = useMemo(() => {
    if (!data?.projected_from) return null;
    const i = data.months.indexOf(data.projected_from);
    return i >= 0 ? data.labels[i] : null;
  }, [data]);

  const barData = GROUPS.map(g => ({
    name:  g.label,
    value: g.fuels.reduce((s, f) => s + (curData[f] || 0), 0),
    color: g.color,
  }));

  const FUEL_LABEL: Partial<Record<string, string>> = { solar: "utility solar", rooftop: "rooftop solar" };
  const pieData = FUEL_ORDER
    .map(f => ({ name: FUEL_LABEL[f] ?? f, value: curData[f] || 0, color: FUEL_COLORS[f] }))
    .filter(d => d.value > 0);

  const aePct  = data?.ae_pct ?? {};

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col xl:flex-row gap-4" style={{ alignItems: "stretch" }}>

      {/* Map card */}
      <div className="xl:w-[52%] shrink-0 flex flex-col">
        <Card className="flex flex-col flex-1">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-xl">Power Plant Map</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg flex-1">
            <MapTokenLoader>
              <No2Map
                monthKey={curMonthKey}
                plants={plants}
                aeOnly={aeOnly}
                aePct={aePct}
                plantGen={plantGen}
                height={540}
              />
            </MapTokenLoader>
          </CardContent>
        </Card>
      </div>

      {/* Charts card */}
      {!dataError && (
        <div className="xl:flex-1 min-w-0 flex flex-col">
          <Card className="flex flex-col flex-1">
            <CardHeader className="pb-2 shrink-0">
              <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Austin Energy Power Generation</CardTitle>
                  <CardDescription>
                    {rolling ? "12-month rolling average" : "Monthly output"} by fuel type{curLabel ? ` · ${curLabel}` : ""}
                  </CardDescription>
                </div>
                <div className="flex rounded-md border border-border overflow-hidden shrink-0 mt-0.5">
                  <Button size="sm" variant="ghost"
                    className={`rounded-none h-7 px-3 text-xs ${rolling ? "bg-muted font-semibold" : ""}`}
                    onClick={() => setRolling(true)}>Avg</Button>
                  <Button size="sm" variant="ghost"
                    className={`rounded-none h-7 px-3 text-xs border-l border-border ${!rolling ? "bg-muted font-semibold" : ""}`}
                    onClick={() => setRolling(false)}>Monthly</Button>
                </div>
              </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {!data ? (
                <Skeleton className="flex-1 w-full" style={{ minHeight: 380 }} />
              ) : (
                <div className="flex flex-col flex-1 gap-4">

                  {/* Trend */}
                  <div className="h-[260px] xl:flex-1 xl:h-auto xl:min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="label"
                          interval={23}
                          tickFormatter={fmtYear}
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false} tickLine={false}
                          angle={-35} textAnchor="end" dy={4}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false} tickLine={false}
                          domain={[0, yMax || "auto"]}
                          tickFormatter={fmtMw}
                          width={28}
                        />
                        {FUEL_ORDER.map(f => (
                          <Area key={f} type="monotone" dataKey={f} stackId="1"
                            fill={FUEL_COLORS[f]} stroke={FUEL_COLORS[f]}
                            fillOpacity={0.88} strokeWidth={0} dot={false} isAnimationActive={false}
                          />
                        ))}
                        {projLabel && (
                          <ReferenceArea
                            x1={projLabel}
                            x2={trendData?.[trendData.length - 1]?.label as string}
                            fill="hsl(var(--muted-foreground))"
                            fillOpacity={0.07}
                            strokeOpacity={0}
                          />
                        )}
                        {projLabel && (
                          <ReferenceLine
                            x={projLabel}
                            stroke="hsl(var(--muted-foreground))"
                            strokeDasharray="4 2"
                            strokeWidth={1.2}
                            label={{ value: "estimated →", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          />
                        )}
                        <ReferenceLine x={curLabel} stroke="hsl(var(--foreground))"
                          strokeWidth={1.5} strokeDasharray="3 2" />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const total = payload.reduce((s: number, p: any) => s + (Number(p.value) || 0), 0);
                            return (
                              <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-xs max-w-[180px]">
                                <p className="font-semibold mb-1">{label}</p>
                                {[...payload].reverse().map((p: any) => p.value > 0 ? (
                                  <p key={p.dataKey} style={{ color: p.fill }}>
                                    {p.dataKey}: {Math.round(p.value).toLocaleString()} MW
                                  </p>
                                ) : null)}
                                <p className="font-semibold mt-1 border-t border-border pt-1">
                                  Total: {Math.round(total).toLocaleString()} MW
                                </p>
                              </div>
                            );
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar + Pie */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg output by group</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                            domain={[0, yMax || "auto"]} tickFormatter={fmtMw} width={28} />
                          <Tooltip formatter={(v: number) => [`${Math.round(v).toLocaleString()} MW`, "Avg output"]} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                            {barData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Share by fuel · {Math.round(totalMw).toLocaleString()} MW
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie data={pieData} dataKey="value" nameKey="name"
                            cx="38%" cy="50%" outerRadius={70} isAnimationActive={false}>
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Legend layout="vertical" align="right" verticalAlign="middle"
                            content={({ payload }) => (
                              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {(payload ?? []).map((e: any, i: number) => (
                                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: e.color, flexShrink: 0, display: "inline-block" }} />
                                    <span style={{ fontSize: 11, color: "hsl(var(--foreground))" }}>{e.value}</span>
                                  </li>
                                ))}
                              </ul>
                            )} />
                          <Tooltip formatter={(v: number, name: string) => [`${Math.round(v).toLocaleString()} MW`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground shrink-0">
                    Source: EIA Form 923 (net generation) · Form 860 (plant locations)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
