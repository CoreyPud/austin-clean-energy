import { useMemo, useState } from "react";
import { Zap } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Austin Clean Energy
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            EV vs. Gas in Austin
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            Compare the real cost of going electric using Austin Energy electricity rates,
            local gas prices, and Austin-specific incentives. Works for new and used vehicles.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        <EVInputsCard inputs={inputs} onChange={onChange} />

        <EVKpiStrip results={results} mode={inputs.mode} />

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
  );
};

export default EVComparison;
