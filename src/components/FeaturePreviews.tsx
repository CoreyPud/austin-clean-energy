// Preview visuals for FeatureCard, shared by the homepage and the section pages that link to the
// same tools, so a card looks the same wherever it appears.
import { useMemo } from "react";
import { Bar, BarChart, Cell, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  austinEnergyRebate,
  buildThirtyYearModel,
  DEFAULT_MONTHLY_USAGE_KWH,
  DEFAULT_PRODUCTION_PER_KW,
  AUSTIN_INSTALL_COST_PER_KW,
  type CalcInputs,
} from "@/lib/solar-model";
import { calcEVResults, DEFAULT_EV_INPUTS } from "@/lib/ev-model";

const PRI = "hsl(var(--primary))";
const BLUE = "#3b82f6";
const ORNG = "#f59e0b";
const AXIS_TICK = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

/** Cumulative net savings for a sample 8 kW Austin system over 25 years. */
export function SolarPaybackPreview() {
  const data = useMemo(() => {
    const sampleKw = 8;
    const inputs: CalcInputs = {
      annualUsageKwh: DEFAULT_MONTHLY_USAGE_KWH * 12,
      systemKw: sampleKw,
      loanTermYears: 0,
      loanInterestRate: 0,
      productionPerKw: DEFAULT_PRODUCTION_PER_KW,
    };
    return buildThirtyYearModel(
      inputs,
      sampleKw * AUSTIN_INSTALL_COST_PER_KW - austinEnergyRebate(sampleKw, "single_family"),
    ).cumulativeByYear.slice(0, 25);
  }, []);

  return (
    <div className="pointer-events-none border-b bg-muted/10 px-3 pb-1 pt-4">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tickFormatter={(value) => (value % 5 === 0 ? `Yr ${value}` : "")}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Bar dataKey="cumulative" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.year} fill={entry.cumulative >= 0 ? "#047857" : "#b91c1c"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Yearly cost of a gas vs. electric vehicle at Austin defaults. */
export function EvCostPreview() {
  const data = useMemo(() => {
    const results = calcEVResults(DEFAULT_EV_INPUTS);
    return [
      {
        vehicle: "Gas Vehicle",
        fuel: Math.round(results.gasAnnualFuel),
        maintenance: Math.round(results.gasAnnualMaintenance),
        registration: results.gasRegistrationFee,
      },
      {
        vehicle: "Electric Vehicle",
        fuel: Math.round(results.evAnnualFuel),
        maintenance: Math.round(results.evAnnualMaintenance),
        registration: results.evRegistrationSurcharge,
      },
    ];
  }, []);

  return (
    <div className="pointer-events-none border-b bg-muted/10 px-3 pb-1 pt-4">
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ left: 0, right: 4, top: 2, bottom: 0 }} barSize={56}>
          <XAxis
            dataKey="vehicle"
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Legend
            iconType="square"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{value}</span>
            )}
          />
          <Bar dataKey="fuel" stackId="cost" fill={PRI} name="Fuel" />
          <Bar dataKey="maintenance" stackId="cost" fill={BLUE} name="Maintenance" />
          <Bar dataKey="registration" stackId="cost" fill={ORNG} name="Registration" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A screenshot preview; hides itself (leaving the placeholder) if the image fails to load. */
export function ImagePreview({
  src,
  alt,
  placeholder,
  position = "center",
}: {
  src: string;
  alt: string;
  /** Shown behind the image while it loads or if it's missing. */
  placeholder: React.ReactNode;
  position?: "center" | "top";
}) {
  return (
    <div className="relative border-b overflow-hidden bg-muted/20" style={{ height: "232px" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground select-none">
        {placeholder}
      </div>
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover ${position === "top" ? "object-top" : "object-center"}`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}
