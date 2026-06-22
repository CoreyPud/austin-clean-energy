import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from "recharts";

const ANNUAL_MILES      = 16_500;
const AVG_GAS_MPG       = 28;
const AVG_EV_MI_PER_KWH = 3.0;
const AE_CO2_KG_PER_MWH = 200;
const CO2_KG_PER_GAL    = 8.89;
const CO2_PER_EV_KG =
  (ANNUAL_MILES / AVG_GAS_MPG) * CO2_KG_PER_GAL -
  (ANNUAL_MILES / AVG_EV_MI_PER_KWH) * (AE_CO2_KG_PER_MWH / 1000);

// Jan 1 fleet count for each year; 2026 uses March (latest available)
const YEAR_FLEET: { year: number; evs: number; estimate?: true }[] = [
  { year: 2019, evs:  3_570 },
  { year: 2020, evs:  6_678 },
  { year: 2021, evs:  9_503 },
  { year: 2022, evs: 15_327 },
  { year: 2023, evs: 20_935 },
  { year: 2024, evs: 26_824 },
  { year: 2025, evs: 34_704 },
  { year: 2026, evs: 45_980, estimate: true },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as (typeof YEAR_FLEET[0] & { co2Mt: number });
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md min-w-[170px]">
      <p className="font-semibold mb-2">
        {d.year}{d.estimate ? " (est., Mar count)" : ""}
      </p>
      <div className="flex justify-between gap-4 mb-0.5">
        <span className="text-muted-foreground">CO₂ avoided</span>
        <span className="font-bold">{Math.round(d.co2Mt).toLocaleString()} MT</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Registered EVs</span>
        <span className="font-bold">{d.evs.toLocaleString()} EVs</span>
      </div>
    </div>
  );
};

export function Co2ImpactChart() {
  const data = useMemo(
    () => YEAR_FLEET.map(d => ({ ...d, co2Mt: (d.evs * CO2_PER_EV_KG) / 1000 })),
    [],
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `${Math.round(v / 1000)}k`}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.6 }} />
        <Bar dataKey="co2Mt" radius={[3, 3, 0, 0]}>
          {data.map(d => (
            <Cell
              key={d.year}
              fill={d.estimate ? "hsl(var(--primary) / 0.5)" : "hsl(var(--primary))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
