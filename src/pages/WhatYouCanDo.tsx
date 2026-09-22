import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Leaf, Wrench, Zap } from "lucide-react";
import { Bar, BarChart, Cell, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";
import {
  austinEnergyRebate,
  buildThirtyYearModel,
  DEFAULT_MONTHLY_USAGE_KWH,
  DEFAULT_PRODUCTION_PER_KW,
  type CalcInputs,
} from "@/lib/solar-model";
import { calcEVResults, DEFAULT_EV_INPUTS } from "@/lib/ev-model";

const PRI = "hsl(var(--primary))";
const BLUE = "#3b82f6";
const ORNG = "#f59e0b";

const WhatYouCanDo = () => {
  useSeo({
    title: "What You Can Do | Austin Clean Energy",
    description:
      "Explore Austin solar savings, compare electric and gas vehicles, and build a personalized clean energy plan.",
  });
  const navigate = useNavigate();

  const solarCumulative = useMemo(() => {
    const sampleKw = 8;
    const inputs: CalcInputs = {
      annualUsageKwh: DEFAULT_MONTHLY_USAGE_KWH * 12,
      systemKw: sampleKw,
      batteryKwh: 0,
      loanTermYears: 0,
      loanInterestRate: 0,
      productionPerKw: DEFAULT_PRODUCTION_PER_KW,
    };
    return buildThirtyYearModel(
      inputs,
      sampleKw * 2950 - austinEnergyRebate(sampleKw, "single_family"),
    ).cumulativeByYear.slice(0, 25);
  }, []);

  const evAnnualCostData = useMemo(() => {
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
    <div className="min-h-screen">
      <PageHeader
        title="What You Can Do"
        subtitle="Use Austin’s real rates and incentives to compare your options and choose practical next steps."
      />

      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Find Your Next Step</h2>
            <p className="max-w-2xl text-muted-foreground">
              Every household is different. Explore solar, transportation, efficiency, and other clean energy choices.
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              to="/property-assessment"
              title="Check Solar for Your Home"
              description="Enter your address to see neighborhood solar trends, your roof's potential, cost estimates, your council member, and a personalized plan — all in one place."
              cta="Calculate Savings"
              preview={
                <div className="pointer-events-none border-b bg-muted/10 px-3 pb-1 pt-4">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={solarCumulative} margin={{ left: 0, right: 4, top: 2, bottom: 0 }}>
                      <XAxis
                        dataKey="year"
                        tickFormatter={(value) => (value % 5 === 0 ? `Yr ${value}` : "")}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Bar dataKey="cumulative" radius={[2, 2, 0, 0]}>
                        {solarCumulative.map((entry, index) => (
                          <Cell key={entry.year} fill={entry.cumulative >= 0 ? "#047857" : "#b91c1c"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              }
            />

            <FeatureCard
              to="/ev-comparison"
              title="EV vs. Gas Calculator"
              description="Compare the real cost of going electric using Austin Energy rates, local gas prices, and Austin-specific incentives."
              cta="Compare Costs"
              preview={
                <div className="pointer-events-none border-b bg-muted/10 px-3 pb-1 pt-4">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={evAnnualCostData} margin={{ left: 0, right: 4, top: 2, bottom: 0 }} barSize={56}>
                      <XAxis
                        dataKey="vehicle"
                        tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
              }
            />

            <FeatureCard
              to="/clean-energy-plan"
              title="Your Clean Energy Plan"
              description="Answer a few questions about your home and lifestyle to get personalized recommendations across solar, EVs, efficiency, and more."
              cta="Build My Plan"
              preview={
                <div className="pointer-events-none flex h-[226px] items-center justify-center border-b bg-muted/10 px-3 pb-1 pt-4">
                  <div className="grid w-full grid-cols-2 gap-4 px-8">
                    {[
                      { icon: Car, label: "Transportation", color: "text-primary", bg: "bg-primary/10" },
                      { icon: Zap, label: "Electrification", color: "text-blue-500", bg: "bg-blue-500/10" },
                      { icon: Leaf, label: "Home Power", color: "text-emerald-600", bg: "bg-emerald-500/10" },
                      { icon: Wrench, label: "Efficiency", color: "text-amber-600", bg: "bg-amber-500/10" },
                    ].map(({ icon: Icon, label, color, bg }) => (
                      <div key={label} className="flex flex-col items-center gap-2">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bg}`}>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </div>
                        <span className="text-center text-[10px] leading-tight text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary via-secondary to-accent py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">Ready to Find Your Best Option?</h2>
            <p className="mb-8 text-lg text-white/90 md:text-xl">
              Start with your property to see the savings and practical next steps available to you.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/property-assessment")}
              className="bg-white font-semibold text-primary hover:bg-white/90"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhatYouCanDo;
