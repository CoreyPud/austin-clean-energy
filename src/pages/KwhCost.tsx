import ArbitrageWindow from "@/components/kwh-cost/ArbitrageWindow";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function KwhCostPage() {
  useSeo({
    title: "kWh Cost | Austin Clean Energy",
    description:
      "Explore Austin electricity price spreads and the daily window batteries use to charge low and discharge high.",
  });

  return (
    <>
      <PageHeader
        title="kWh Cost"
        subtitle="Explore Austin electricity price spreads and the daily window batteries use to charge low and discharge high."
      />
      <ArbitrageWindow />
    </>
  );
}