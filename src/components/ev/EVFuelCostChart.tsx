import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { EVResults } from "@/lib/ev-model";

interface Props {
  results: EVResults;
}

const COLOR_FUEL  = "hsl(var(--primary))";
const COLOR_MAINT = "hsl(var(--muted-foreground))";
const COLOR_REG   = "#f59e0b"; // amber

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-border bg-background p-2.5 text-xs shadow-md space-y-1 min-w-[150px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) =>
        p.value > 0 ? (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: p.fill }} />
              {p.name}
            </span>
            <span className="font-medium tabular-nums text-foreground">{fmt$(p.value)}</span>
          </div>
        ) : null
      )}
      <div className="flex justify-between gap-4 border-t pt-1 mt-1">
        <span className="text-muted-foreground">Total</span>
        <span className="font-bold tabular-nums text-foreground">{fmt$(total)}</span>
      </div>
    </div>
  );
};

const EVFuelCostChart = ({ results }: Props) => {
  const {
    evAnnualFuel, gasAnnualFuel,
    evAnnualMaintenance, gasAnnualMaintenance,
    evRegistrationSurcharge, gasRegistrationFee,
  } = results;

  const data = [
    {
      vehicle: "Gas Vehicle",
      fuel: Math.round(gasAnnualFuel),
      maintenance: Math.round(gasAnnualMaintenance),
      registration: gasRegistrationFee,
    },
    {
      vehicle: "Electric",
      fuel: Math.round(evAnnualFuel),
      maintenance: Math.round(evAnnualMaintenance),
      registration: evRegistrationSurcharge,
    },
  ];

  return (
    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-3">
        <p className="text-xs font-medium text-foreground mb-3">Annual Operating Costs</p>
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
              tickFormatter={v => `$${v}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Legend
              iconType="square"
              iconSize={8}
              formatter={v => (
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{v}</span>
              )}
            />
            <Bar dataKey="fuel"         stackId="cost" fill={COLOR_FUEL}  name="Fuel"                  radius={[0, 0, 0, 0]} />
            <Bar dataKey="maintenance"  stackId="cost" fill={COLOR_MAINT} name="Maintenance"           radius={[0, 0, 0, 0]} />
            <Bar dataKey="registration" stackId="cost" fill={COLOR_REG}   name="TX registration fee"   radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Year 1 · Maintenance per AAA 2024, scales with miles · Travis County registration · TX EV road-use surcharge +$200/yr
        </p>
      </CardContent>
    </Card>
  );
};

export default EVFuelCostChart;
