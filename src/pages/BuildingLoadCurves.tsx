import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SeeThePeak from "@/features/load-curves/SeeThePeak";
import { useSeo } from "@/hooks/use-seo";

export default function BuildingLoadCurves() {
  useSeo({
    title: "See the Peak: Building Load Curves With and Without a Battery",
    description: "See how a battery reshapes a commercial building's daily demand and what that does to Austin Energy demand charges, by building type.",
  });
  return (
    <div className="pt-4">
      <div className="mx-auto max-w-[1200px] px-4">
        <Link to="/austin-at-a-glance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Austin at a Glance
        </Link>
      </div>
      <SeeThePeak />
    </div>
  );
}
