import PricingPressureView from "@/components/pricing-pressure/PricingPressure";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function PricingPressurePage() {
  useSeo({
    title: "Load Zone Pricing Pressure | Austin Clean Energy",
    description:
      "Austin Energy's fleet-wide adverse basis cost per MWh, 2018-2026, with a projection of where it heads next.",
  });

  return (
    <>
      <PageHeader
        title="Load Zone Pricing Pressure"
        subtitle="Explore Austin Energy's pricing history and how future load growth could affect it."
      />
      <PricingPressureView />
    </>
  );
}
