import PeakSavingsCalculator from "@/features/peak-savings/PeakSavingsCalculator";
import { useSeo } from "@/hooks/use-seo";

export default function PeakSavingsCalculatorPage() {
  useSeo({
    title: "Peak Savings Calculator: IRR for Cutting Commercial Peak Demand",
    description: "Estimate IRR, NPV and payback for efficiency, demand response or a battery that lowers a building's peak, using Austin Energy commercial rates.",
  });
  return <PeakSavingsCalculator />;
}
