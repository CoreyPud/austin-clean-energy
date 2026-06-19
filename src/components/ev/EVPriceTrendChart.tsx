import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { evModelMsrpSeries } from "@/data/ev-market";

const C_MODEL_Y = "#2563eb";  // blue-600
const C_MODEL_3 = "#06b6d4";  // cyan-500
const C_MACH_E  = "#f59e0b";  // amber-500
const C_IONIQ_5 = "#10b981";  // emerald-500
const C_EV6     = "#f43f5e";  // rose-500

const fmt$ = (v: number) => `$${(v / 1000).toFixed(0)}k`;

const MODELS = [
  { key: "modelY" as const, label: "Tesla Model Y",   color: C_MODEL_Y },
  { key: "model3" as const, label: "Tesla Model 3",   color: C_MODEL_3 },
  { key: "machE"  as const, label: "Ford Mach-E",     color: C_MACH_E },
  { key: "ioniq5" as const, label: "Hyundai Ioniq 5", color: C_IONIQ_5 },
  { key: "ev6"    as const, label: "Kia EV6",         color: C_EV6 },
] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value;
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md min-w-[220px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {MODELS.map(({ key, label: name, color }) => {
        const val = get(key);
        if (val == null) return null;
        return (
          <div key={key} className="flex justify-between gap-6 mb-0.5">
            <span style={{ color }}>{name}</span>
            <span className="font-bold tabular-nums text-foreground">${val.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
};

const EVPriceTrendChart = () => {
  const latest = evModelMsrpSeries[evModelMsrpSeries.length - 1];

  const latestPrices = MODELS
    .map(m => ({ name: m.label as string, price: latest[m.key] as number | null | undefined }))
    .filter((m): m is { name: string; price: number } => m.price != null);

  const cheapest = latestPrices.reduce((min, m) => m.price < min.price ? m : min);
  const underFortyK = latestPrices.filter(m => m.price < 40_000).length;

  // Tesla Model Y: largest absolute drop (chip shortage peak → now)
  const modelYPeak = Math.max(
    ...evModelMsrpSeries.filter(d => d.modelY != null).map(d => d.modelY!),
  );
  const modelYNow = latest.modelY!;
  const modelYDrop = modelYPeak - modelYNow;

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-3">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Cheapest ({latest.year})
            </p>
            <p className="text-xl font-bold text-primary tabular-nums">
              ${cheapest.price.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">{cheapest.name}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Model Y — peak to now
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              −${modelYDrop.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              ${modelYPeak.toLocaleString()} in 2022 → ${modelYNow.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Under $40k ({latest.year})
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {underFortyK} of {latestPrices.length}
            </p>
            <p className="text-[11px] text-muted-foreground">of these 5 top models</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={evModelMsrpSeries} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt$}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={[32_000, 68_000]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={v => {
                const m = MODELS.find(x => x.key === v);
                return (
                  <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>
                    {m?.label ?? v}
                  </span>
                );
              }}
            />
            {MODELS.map(({ key, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Base/entry trim MSRP at model year launch · Sources: Tesla.com, Ford Media Center,
          Hyundai Newsroom, Kia Media press releases · Kia EV6: Light RWD in 2022 (trim
          discontinued); Wind RWD as base from 2023
        </p>
      </CardContent>
    </Card>
  );
};

export default EVPriceTrendChart;
