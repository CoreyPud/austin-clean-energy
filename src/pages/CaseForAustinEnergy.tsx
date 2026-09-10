import CaseForAustinEnergyView from "@/components/case-for-austin-energy/CaseForAustinEnergy";
import { useSeo } from "@/hooks/use-seo";

export default function CaseForAustinEnergyPage() {
  useSeo({
    title: "The Case for Austin Energy",
    description:
      "How Austin's municipal utility compares to deregulated Texas markets on price, reliability, energy mix, and city revenue.",
  });

  return <CaseForAustinEnergyView />;
}
