import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import UtilityRegistry from "./UtilityRegistry";

const UtilityRegistryPage = () => {
  useSeo({
    title: "US Utility Innovation Registry | Austin Clean Energy",
    description: "Sourced registry of US utility innovation: virtual power plants, vehicle-to-grid pilots, grid-enhancing technologies, state profiles, solar adoption and efficiency funding.",
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1120px] mx-auto px-4 pt-4">
        <Link to="/austin-at-a-glance" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Austin at a Glance
        </Link>
      </div>
      <UtilityRegistry />
    </div>
  );
};
export default UtilityRegistryPage;
