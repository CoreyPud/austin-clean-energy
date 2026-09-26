import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Leaf, Wrench, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";
import { SolarPaybackPreview, EvCostPreview } from "@/components/FeaturePreviews";

const WhatYouCanDo = () => {
  useSeo({
    title: "What You Can Do | Austin Clean Energy",
    description:
      "Explore Austin solar savings, compare electric and gas vehicles, and build a personalized clean energy plan.",
  });
  const navigate = useNavigate();

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
              preview={<SolarPaybackPreview />}
            />

            <FeatureCard
              to="/ev-comparison"
              title="EV vs. Gas Calculator"
              description="Compare the real cost of going electric using Austin Energy rates, local gas prices, and Austin-specific incentives."
              cta="Compare Costs"
              preview={<EvCostPreview />}
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
