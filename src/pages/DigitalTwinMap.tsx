import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GridFlowMap from "@/features/digital-twin-map/GridFlowMap";
import { useSeo } from "@/hooks/use-seo";

export default function DigitalTwinMap() {
  useSeo({
    title: "Digital Twin Map: Austin Energy Power Flow",
    description: "Explore hourly FY2024 Austin Energy generation, estimated load, substations and commercial buildings in a balanced schematic power-flow map.",
  });

  return (
    <div className="pt-4">
      <div className="mx-auto max-w-[1180px] px-4">
        <Link to="/austin-at-a-glance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Austin at a Glance
        </Link>
      </div>
      <GridFlowMap />
    </div>
  );
}
