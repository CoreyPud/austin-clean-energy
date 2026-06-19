import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { EVResults } from "@/lib/ev-model";

interface Props {
  results: EVResults;
}

const COLOR_GAS = "#f59e0b";
const COLOR_EV  = "hsl(var(--primary))";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cpm: number = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-background p-2.5 text-xs shadow-md">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-muted-foreground">
        Fuel cost:{" "}
        <span className="font-bold text-foreground tabular-nums">
          ${cpm.toFixed(3)}/mile
        </span>
      </p>
    </div>
  );
};

const EVCostPerMileChart = ({ results }: Props) => {
  const { evCostPerMile, gasCostPerMile } = results;

  const data = [
    { vehicle: "Gas Vehicle", cpm: gasCostPerMile },
    { vehicle: "Electric", cpm: evCostPerMile },
  ];

  const savings = gasCostPerMile - evCostPerMile;

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-3">
        <p className="text-xs font-medium text-foreground mb-3">Fuel Cost per Mile</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: 8, right: 12 }} barSize={52}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="vehicle"
              tick={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `$${v.toFixed(2)}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Bar dataKey="cpm" name="Cost per mile" radius={[4, 4, 0, 0]}>
              <Cell fill={COLOR_GAS} />
              <Cell fill={COLOR_EV}  />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {savings > 0 && (
          <p className="text-[10px] text-primary font-medium text-center pt-1">
            EV saves ${savings.toFixed(3)}/mile ·{" "}
            ${Math.round(results.gasAnnualFuel - results.evAnnualFuel).toLocaleString()} less in fuel per year
          </p>
        )}
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Fuel cost only · excludes maintenance &amp; registration
        </p>
      </CardContent>
    </Card>
  );
};

export default EVCostPerMileChart;
