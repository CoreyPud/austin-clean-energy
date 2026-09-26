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

// Figures the calculator showed for the sample roof in /solar-potential-preview.jpg (19624
// Cheyenne Valley, 78664, at its default recommended size) when it was captured on 2026-09-26.
// Illustrative only: they don't recompute if rates change, so re-capture both together.
const SAMPLE_ROOF = { systemKw: 8.6, roofMaxKw: 24.8, monthlySavings: 133, paybackYears: 12 };

/** A compact mock of the calculator: the roof's panel layout beside its headline numbers, in
 *  large type so they read at card size. Static, not interactive. */
export function CalculatorPreview() {
  const fillPct = Math.round((SAMPLE_ROOF.systemKw / SAMPLE_ROOF.roofMaxKw) * 100);
  return (
    <div className="pointer-events-none relative flex border-b" style={{ height: "232px" }}>
      <div className="relative w-[56%] overflow-hidden bg-muted/20">
        <img
          src="/solar-potential-preview.jpg"
          alt="Solar panel layout drawn on a house roof in the calculator"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 border-l bg-muted/20 px-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">System size</div>
          <div className="text-2xl font-bold tabular-nums leading-tight">{SAMPLE_ROOF.systemKw} kW</div>
          <div className="relative mt-1.5 h-1.5 rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${fillPct}%` }} />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
              style={{ left: `${fillPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Monthly savings</div>
          <div className="text-2xl font-bold tabular-nums leading-tight text-primary">${SAMPLE_ROOF.monthlySavings}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Payback</div>
          <div className="text-2xl font-bold tabular-nums leading-tight">{SAMPLE_ROOF.paybackYears} years</div>
        </div>
      </div>
    </div>
  );
}

