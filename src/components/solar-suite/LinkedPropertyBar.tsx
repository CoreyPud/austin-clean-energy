import { Link } from "react-router-dom";
import { Link2 } from "lucide-react";
import { useSharedProject } from "@/lib/shared-project";

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Shows the saved property the Solar Suite is linked to: address, size, pricing and finance method. */
export function LinkedPropertyBar() {
  const { project } = useSharedProject();
  if (!project.savedId) return null;
  const total = project.costPerW != null ? project.costPerW * project.systemSizeKw * 1000 : null;
  const finance =
    project.financeMode === "finance"
      ? `Financed${project.loanTermYears ? ` · ${project.loanTermYears} yr` : ""}${project.loanRate != null ? ` · ${project.loanRate}%` : ""}`
      : "Cash purchase";
  const billing = project.billingMode === "vos" ? "Value of Solar" : project.billingMode === "sso" ? "Standard Offer" : null;
  return (
    <div className="no-print border-b border-border bg-muted px-4 py-2 text-xs text-foreground sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 font-semibold text-primary"><Link2 className="size-3.5" /> Linked saved property</span>
        <span>{project.address}</span>
        <span>{project.systemSizeKw} kW</span>
        {project.costPerW != null && <span>${project.costPerW.toFixed(2)}/W{total != null ? ` · ${usd(total)} installed` : ""}</span>}
        <span>{finance}</span>
        {billing && <span>{billing}</span>}
        <Link to="/property-assessment" className="ml-auto text-primary underline">Edit on property assessment</Link>
      </div>
    </div>
  );
}
