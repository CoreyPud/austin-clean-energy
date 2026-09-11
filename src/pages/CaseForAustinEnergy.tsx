import CaseForAustinEnergyView from "@/components/case-for-austin-energy/CaseForAustinEnergy";
import BackToHome from "@/components/BackToHome";
import { useSeo } from "@/hooks/use-seo";

export default function CaseForAustinEnergyPage() {
  useSeo({
    title: "The Case for Austin Energy",
    description:
      "How Austin's municipal utility compares to deregulated Texas markets on price, reliability, energy mix, and city revenue.",
  });

  return (
    <>
      <BackToHome />
      <CaseForAustinEnergyView />
    </>
  );
}
