import CaseForAustinEnergyView from "@/components/case-for-austin-energy/CaseForAustinEnergy";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function CaseForAustinEnergyPage() {
  useSeo({
    title: "The Case for Austin Energy",
    description:
      "How Austin's municipal utility compares to deregulated Texas markets on price, reliability, energy mix, and city revenue.",
  });

  return (
    <>
      <PageHeader
        title="The Case for Austin Energy"
        subtitle="How Austin's public utility compares with Texas's deregulated markets."
      />
      <CaseForAustinEnergyView />
    </>
  );
}
