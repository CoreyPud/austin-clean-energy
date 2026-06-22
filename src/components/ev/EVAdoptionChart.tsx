import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { evAdoptionSeries, usEvAnnual } from "@/data/ev-adoption";

// Population estimates (linear interp) — Travis County Census: 1.273M (2019) → ~1.42M (2026)
function austinPop(year: number) { return 1_273_000 + (year - 2019) * 21_000; }
function texasPop(year: number)  { return 29_000_000 + (year - 2019) * 230_000; }
function usPop(year: number)     { return 328_000_000 + (year - 2019) * 1_100_000; }

const PRI   = "hsl(var(--primary))";
const AMBER = "#3b82f6";
const GRAY  = "#9ca3af";

const fmt = (v: number) => v.toFixed(1);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = new Date(typeof label === "number" ? label : Date.UTC(...(label.split("-").map(Number) as [number, number, number])));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{dateStr}</p>
      {payload.map((p: any) => (
        p.value != null && (
          <div key={p.name} className="flex justify-between gap-4 mb-0.5">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-bold tabular-nums text-foreground">
              {fmt(p.value)} / 1K
            </span>
          </div>
        )
      ))}
    </div>
  );
};

// Build a US EV map keyed by year so we can look up annual values
const usEvByYear = Object.fromEntries(usEvAnnual.map(d => [d.year, d.count]));

const EVAdoptionChart = () => {
  const chartData = useMemo(() => {
    return evAdoptionSeries.map(row => {
      // Parse as UTC to avoid local-timezone offset shifting dates back a day
      const d    = new Date(row.date + "T12:00:00Z");
      const year = d.getUTCFullYear() + d.getUTCMonth() / 12;
      const floorYear = Math.floor(year);

      const aPop = austinPop(year);
      const tPop = texasPop(year);
      const uPop = usPop(year);

      const austinPer1k = (row.austin / aPop) * 1000;
      const texasPer1k  = (row.texas  / tPop) * 1000;

      // Show US only at annual marks (Jan 1 of each year)
      let usPer1k: number | null = null;
      const isJan = d.getUTCMonth() === 0;
      if (isJan && usEvByYear[floorYear] !== undefined) {
        usPer1k = (usEvByYear[floorYear] / uPop) * 1000;
      }

      return {
        date:      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
        dateStr:   row.date,
        austin:    +austinPer1k.toFixed(2),
        texas:     +texasPer1k.toFixed(2),
        us:        usPer1k !== null ? +usPer1k.toFixed(2) : null,
        austinRaw: row.austin,
        texasRaw:  row.texas,
      };
    });
  }, []);

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-3">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ left: 0, right: 16, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              scale="time"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={v => new Date(v).getUTCFullYear().toString()}
              ticks={[2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(
                y => Date.UTC(y, 0, 1)
              )}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${v}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
              label={{
                value: "EVs per 1,000 residents",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={v => (
                <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>
                  {v === "austin" ? "Austin (Travis Co.)" : v === "texas" ? "Texas" : "US National"}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="austin"
              name="austin"
              stroke={PRI}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="texas"
              name="texas"
              stroke={AMBER}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="us"
              name="us"
              stroke={GRAY}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: GRAY, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Source: Atlas EV Hub / State DMV snapshots · US national from DOE AFDC (annual) · Population: US Census estimates
        </p>
      </CardContent>
    </Card>
  );
};

export default EVAdoptionChart;
