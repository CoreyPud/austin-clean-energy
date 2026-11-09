import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PeakSavingsCalculator from "@/features/peak-savings/PeakSavingsCalculator";
import { useSeo } from "@/hooks/use-seo";

export default function PeakSavingsCalculatorPage() {
  useSeo({
    title: "Peak Savings Calculator: IRR for Cutting Commercial Peak Demand",
    description: "Estimate IRR, NPV and payback for efficiency, demand response or a battery that lowers a building's peak, using Austin Energy commercial rates.",
  });
  return (
    <div className="pt-4">
      <div className="mx-auto max-w-[1200px] px-4">
        <Link to="/austin-at-a-glance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Austin at a Glance
        </Link>
      </div>
      <PeakSavingsCalculator />
    </div>
  );
}
