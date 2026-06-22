import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { EVResults, GAS_MFG_CO2_KG } from "@/lib/ev-model";

const PRI   = "hsl(var(--primary))";
const AMBER = "#f59e0b";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-xs shadow-md min-w-[160px]">
      <p className="font-semibold mb-2">Year {label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: p.color }}>{p.dataKey === "ev" ? "EV" : "Gas"}</span>
          <span className="font-bold">{p.value.toFixed(1)} t CO₂</span>
        </div>
      ))}
    </div>
  );
};

interface Props { results: EVResults; }

const EVManufacturingCarbon = ({ results }: Props) => {
  const {
    evCo2KgPerYear, gasCo2KgPerYear, evMfgCo2Kg,
    carbonBreakevenYears, carbonBreakevenMiles, estimatedBatteryKwh,
  } = results;
  const [showSources, setShowSources] = useState(false);

  const chartData = useMemo(() =>
    Array.from({ length: 11 }, (_, year) => ({
      year,
      ev:  +((evMfgCo2Kg     + year * evCo2KgPerYear)  / 1000).toFixed(2),
      gas: +((GAS_MFG_CO2_KG + year * gasCo2KgPerYear) / 1000).toFixed(2),
    })),
    [evMfgCo2Kg, evCo2KgPerYear, gasCo2KgPerYear],
  );

  const bey = carbonBreakevenYears;
  const beyDisplay = bey != null ? bey.toFixed(1) : null;
  const miDisplay  = carbonBreakevenMiles != null
    ? `${Math.round(carbonBreakevenMiles / 1_000).toLocaleString()}k miles`
    : null;

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        It's true that EV manufacturing produces more CO₂ than a comparable gas car, primarily
        from battery production. However, lower emissions during use offset that difference over time.
        {beyDisplay != null && miDisplay
          ? <> At your driving rate, the cumulative CO₂ crossover occurs around{" "}
              <span className="font-medium text-foreground">{beyDisplay} years ({miDisplay})</span>.
            </>
          : <> At your driving rate, the crossover falls outside the 10-year window.</>}
      </p>

    <Card className="border border-border/50">
      <CardContent className="pt-5 pb-5">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tickFormatter={v => `Yr ${v}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${v}t`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={v => (
                <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>
                  {v === "ev" ? "EV (lifetime CO₂)" : "Gas (lifetime CO₂)"}
                </span>
              )}
            />
            {bey != null && bey <= 10 && (
              <ReferenceLine
                x={bey}
                stroke={PRI}
                strokeDasharray="4 2"
                strokeOpacity={0.7}
                label={{ value: "breakeven", position: "insideTopRight", fontSize: 10, fill: PRI }}
              />
            )}
            <Line type="monotone" dataKey="ev"  stroke={PRI}   strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="gas" stroke={AMBER} strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>

        <div className="border-t pt-3 mt-2">
          <button
            onClick={() => setShowSources(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSources ? "rotate-180" : ""}`} />
            Sources & methodology
          </button>
          {showSources && (
            <div className="mt-3 text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p>
                <strong className="text-foreground">EV battery manufacturing:</strong> ~70 kg CO₂ per kWh of
                battery capacity (median from ICCT (2021), ANL (2022), and UCS (2020)). Battery size is estimated
                from your efficiency input ({results.effectiveMiPerKwh.toFixed(1)} mi/kWh) assuming a typical
                270-mile EPA range, giving ~{Math.round(estimatedBatteryKwh)} kWh. Cell manufacturing accounts
                for roughly 40–50% of total EV manufacturing emissions.
              </p>
              <p>
                <strong className="text-foreground">Gas manufacturing (~6 t CO₂):</strong> Typical mid-size
                passenger car body, engine, transmission, and assembly (ICCT 2021). Held fixed since variation
                across gas segments is smaller than the EV battery-driven spread.
              </p>
              <p>
                <strong className="text-foreground">Breakeven:</strong> Point at which cumulative EV CO₂
                (manufacturing + charging at Austin Energy 200 kg/MWh) equals cumulative gas CO₂
                (manufacturing + fuel burn at EPA 8.89 kg/gal), at your specified annual mileage.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};

export default EVManufacturingCarbon;
