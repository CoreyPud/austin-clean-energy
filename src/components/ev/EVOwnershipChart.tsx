import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { EVResults, EVMode, TCO_YEARS } from "@/lib/ev-model";

interface Props {
  results: EVResults;
  mode: EVMode;
}

const PRI = "hsl(var(--primary))";
const AMBER = "#f59e0b";

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;

const EVOwnershipChart = ({ results, mode }: Props) => {
  const { tcoData, breakEvenYearExact } = results;
  const gasLabel = mode === "own-gas" ? "Keep gas vehicle" : "Gas Vehicle";

  const showBreakEven =
    breakEvenYearExact !== null && breakEvenYearExact > 0 && breakEvenYearExact <= TCO_YEARS;

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-3">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tcoData} margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tickFormatter={v => (v === 0 ? "Buy" : `Yr ${v}`)}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(v: number, name: string) => [fmt$(v), name === "ev" ? "EV" : gasLabel]}
              labelFormatter={v => (v === 0 ? "At purchase" : `Year ${v}`)}
              contentStyle={{
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              formatter={v => (
                <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>
                  {v === "ev" ? "EV" : gasLabel}
                </span>
              )}
            />
            {showBreakEven && (
              <ReferenceLine
                x={breakEvenYearExact!}
                stroke={PRI}
                strokeDasharray="5 3"
                strokeOpacity={0.7}
                label={{
                  value: `Break-even (yr ${breakEvenYearExact!.toFixed(1)})`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: PRI,
                  dy: -4,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="ev"
              name="ev"
              stroke={PRI}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="gas"
              name="gas"
              stroke={AMBER}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center pb-1">
          Cumulative cost including purchase price · Gas fuel inflates 2%/yr · Electricity 1%/yr · {TCO_YEARS}-year window
        </p>
      </CardContent>
    </Card>
  );
};

export default EVOwnershipChart;
