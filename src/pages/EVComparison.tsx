import { useMemo, useState } from "react";
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
import EVManufacturingCarbon from "@/components/ev/EVManufacturingCarbon";
import EVDrivingExperience from "@/components/ev/EVDrivingExperience";
import { DEFAULT_EV_INPUTS, calcEVResults, type EVInputs } from "@/lib/ev-model";
import PageHeader from "@/components/PageHeader";

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
      <PageHeader
        title="EV vs. Gas in Austin"
        subtitle="Compare the real cost of going electric using Austin Energy electricity rates, local gas prices, and Austin-specific incentives. Works for new and used vehicles."
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

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
        <p className="text-sm text-muted-foreground mb-4">
          The largest day-to-day difference between EVs and gas vehicles is fuel cost. Electricity
          in Austin runs roughly a third the cost of gasoline per mile at current rates. Maintenance
          savings add up too, since EVs have fewer moving parts and no oil changes.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <EVFuelCostChart results={results} />
          <EVCostPerMileChart results={results} />
        </div>

        <SectionHeading
          title="10-Year Cost of Ownership"
          subtitle="Cumulative costs from purchase through year 10, with inflation"
        />
        <p className="text-sm text-muted-foreground mb-4">
          EVs often cost more upfront than a comparable gas vehicle. Over a decade, lower fuel and
          maintenance costs typically close that gap. How quickly depends on how much you drive and
          how large the initial price difference is.
        </p>
        <EVOwnershipChart results={results} mode={inputs.mode} />

        <SectionHeading
          title="The Driving Experience"
          subtitle="What changes when you switch"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Electric motors deliver full torque immediately, which makes EVs feel quicker off the line
          than horsepower ratings suggest. Other differences, like one-pedal driving and cabin
          quietness, tend to be things drivers either notice right away or adjust to quickly.
        </p>
        <EVDrivingExperience />

        <SectionHeading
          title="Environmental Impact"
          subtitle="Annual CO₂ savings compared to a gas vehicle"
        />
        <p className="text-sm text-muted-foreground mb-4">
          EVs produce no tailpipe emissions. The CO₂ that does exist comes from generating the
          electricity used to charge them. Austin Energy's grid is roughly 55% carbon-free, which
          makes charging here significantly cleaner than the Texas grid average.
        </p>
        <EVEnvironmentalImpact results={results} />

        <SectionHeading
          title="Lifecycle Manufacturing Emissions"
          subtitle="Cumulative CO₂ including vehicle production"
        />
        <EVManufacturingCarbon results={results} />

        <SectionHeading
          title="EV Adoption in Austin"
          subtitle="Registered EVs over time — Travis County vs. Texas vs. US national rate"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Austin has consistently outpaced both Texas and national EV adoption rates. Travis County
          registrations have grown roughly tenfold since 2019, tracking closely with the expansion
          of the public charging network and the arrival of more affordable EV models.
        </p>
        <EVAdoptionChart />

        <SectionHeading
          title="Austin Charging Network"
          subtitle="Public infrastructure across the metro"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Most EV owners charge at home overnight, plugging in the way you would a phone. For
          people in apartments, condos, or anywhere without access to a dedicated outlet, Austin
          has a large and growing public charging network with stations across the metro, including
          fast chargers that can add significant range in under 30 minutes.
        </p>
        <EVChargingNetwork />

        <SectionHeading
          title="Austin Incentives"
          subtitle="Available rebates and grants — not included in the comparison above"
        />
        <p className="text-sm text-muted-foreground mb-4">
          Several rebates and grants are available to Austin residents that reduce the upfront cost
          of going electric. These are not factored into the comparison above, so the actual cost
          difference may be more favorable than shown.
        </p>
        <EVIncentivesSection />

      </div>
    </div>
  );
};

export default EVComparison;
