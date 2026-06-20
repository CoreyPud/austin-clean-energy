import { useMemo, useState } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/hooks/use-seo";
import SectionHeading from "@/components/assessment/SectionHeading";
import EVInputsCard from "@/components/ev/EVInputs";
import EVKpiStrip from "@/components/ev/EVKpiStrip";
import EVFuelCostChart from "@/components/ev/EVFuelCostChart";
import EVCostPerMileChart from "@/components/ev/EVCostPerMileChart";
import EVOwnershipChart from "@/components/ev/EVOwnershipChart";
import EVIncentivesSection from "@/components/ev/EVIncentivesSection";
import EVChargingNetwork from "@/components/ev/EVChargingNetwork";
import EVAdoptionChart from "@/components/ev/EVAdoptionChart";
import EVEnvironmentalImpact from "@/components/ev/EVEnvironmentalImpact";
import EVDrivingExperience from "@/components/ev/EVDrivingExperience";
import { DEFAULT_EV_INPUTS, calcEVResults, type EVInputs } from "@/lib/ev-model";

const EVComparison = () => {
  const navigate = useNavigate();

  useSeo({
    title: "EV vs. Gas Cost Comparison — Austin, TX",
    description:
      "Compare the real cost of owning an electric vehicle vs. a gas vehicle in Austin using Austin Energy electricity rates, local gas prices, Texas incentives, and Austin charging network data.",
  });

  const [inputs, setInputs] = useState<EVInputs>(DEFAULT_EV_INPUTS);
  const onChange = (updates: Partial<EVInputs>) =>
    setInputs(prev => ({ ...prev, ...updates }));

  const results = useMemo(() => calcEVResults(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                Austin Clean Energy
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3 text-foreground">EV vs. Gas in Austin</h1>
            <p className="text-lg text-muted-foreground">
              Compare the real cost of going electric using Austin Energy electricity rates,
              local gas prices, and Austin-specific incentives.
            </p>
          </div>

        <div className="space-y-8">

        <EVInputsCard inputs={inputs} onChange={onChange} />

        <EVKpiStrip results={results} mode={inputs.mode} />

        <div className="rounded-lg bg-muted/40 border border-border/40 px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Why EVs cost less to own: </span>
          Electricity runs about 3–4× cheaper per mile than gas at Austin rates. Maintenance is lower because EVs have no engine oil, no timing belt, no spark plugs, and no exhaust system — and regenerative braking extends brake life 2–3×, since the motor slows the car instead of the pads.
          {results.annualSavings > 0 && (
            <> The <span className="font-medium text-foreground">${Math.round(results.annualSavings).toLocaleString()}/yr</span> in estimated annual savings breaks down as roughly <span className="font-medium text-foreground">${Math.round(results.gasAnnualFuel - results.evAnnualFuel).toLocaleString()}</span> in fuel and <span className="font-medium text-foreground">${Math.round(results.gasAnnualMaintenance - results.evAnnualMaintenance).toLocaleString()}</span> in maintenance.</>
          )}
        </div>

        <SectionHeading
          title="Annual Cost Breakdown"
          subtitle="Year 1 operating costs and fuel efficiency"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <EVFuelCostChart results={results} />
          <EVCostPerMileChart results={results} />
        </div>

        <SectionHeading
          title="10-Year Cost of Ownership"
          subtitle="Cumulative costs from purchase through year 10, with inflation"
        />
        <EVOwnershipChart results={results} mode={inputs.mode} />

        <SectionHeading
          title="The Driving Experience"
          subtitle="Beyond the numbers — how EVs feel to drive"
        />
        <EVDrivingExperience />

        <SectionHeading
          title="Environmental Impact"
          subtitle="Annual CO₂ savings compared to a gas vehicle"
        />
        <EVEnvironmentalImpact results={results} />

        <SectionHeading
          title="EV Adoption in Austin"
          subtitle="Registered EVs over time — Travis County vs. Texas vs. US national rate"
        />
        <EVAdoptionChart />

        <SectionHeading
          title="Austin Charging Network"
          subtitle="Public infrastructure across the metro"
        />
        <EVChargingNetwork />

        <SectionHeading
          title="Austin Incentives"
          subtitle="Available rebates and grants — not included in the comparison above"
        />
        <EVIncentivesSection />

        </div>
        </div>
      </div>
    </div>
  );
};

export default EVComparison;
