import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ExternalLink } from "lucide-react";
import { AUSTIN_EV_INCENTIVES } from "@/lib/ev-model";

interface IncentiveRowProps {
  title: string;
  amount: number;
  description: string;
  requirements: string[];
  status: "active" | "limited";
  url: string;
}

const IncentiveRow = ({
  title, amount, description, requirements, status, url,
}: IncentiveRowProps) => (
  <div className="py-4">
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-base font-bold tabular-nums text-primary">
            ${amount.toLocaleString()}
          </span>
          <Badge
            variant={status === "limited" ? "secondary" : "default"}
            className="text-[10px] px-1.5 py-0 h-4"
          >
            {status === "limited" ? "Limited" : "Active"}
          </Badge>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Learn more about ${title}`}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

      <ul className="space-y-0.5">
        {requirements.map(r => (
          <li key={r} className="text-xs text-muted-foreground flex gap-1.5">
            <span className="text-primary shrink-0 mt-px">·</span>
            {r}
          </li>
        ))}
      </ul>

      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
        New &amp; used vehicles
      </Badge>
    </div>
  </div>
);

const EVIncentivesSection = () => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-4">

      <p className="text-xs text-muted-foreground mb-1">
        These incentives are not included in the cost comparison above — eligibility varies and the
        charger credits apply to a separate purchase. Check what applies to you before buying.
      </p>

      <div className="divide-y divide-border">
        <IncentiveRow
          title="Austin Energy Home Charger Rebate"
          amount={AUSTIN_EV_INCENTIVES.aeChargerRebate}
          description="Up to $1,200 back on purchase and installation of a Level 2 (240V) home charger. Tied to the charger hardware and install, not the vehicle — applies to new and used EVs."
          requirements={[
            "Must be an Austin Energy residential customer",
            "$1,200 for Power Partner EV compatible charger/vehicle · $900 for standard Level 2",
            "Installation by a licensed Texas electrician required",
            "Available through December 31, 2026 · First-come, first-served",
          ]}
          status="active"
          url="https://austinenergy.com/green-power/plug-in-austin/home-charging"
        />

        <IncentiveRow
          title="Texas LDPLIP Grant"
          amount={AUSTIN_EV_INCENTIVES.txLdplipGrant}
          description="$2,500 direct grant (not a tax credit) for purchasing or leasing a new or used EV or PHEV in Texas, administered by the Texas Commission on Environmental Quality."
          requirements={[
            "Texas resident purchasing or leasing a new or used EV/PHEV",
            "Only 2,000 grants awarded per year — apply before completing the vehicle purchase",
            "Administered by TCEQ; check availability before counting on it",
          ]}
          status="limited"
          url="https://www.tceq.texas.gov/airquality/terp/ldplip"
        />

        <IncentiveRow
          title="Federal EV Charger Tax Credit"
          amount={AUSTIN_EV_INCENTIVES.federalChargerTaxCredit}
          description="30% of the cost of Level 2 charger purchase and installation, up to $1,000 as a federal tax credit. Covers hardware and licensed installation labor."
          requirements={[
            "Must file federal income taxes to claim",
            "Covers charger equipment + licensed installation labor",
            "Available through June 30, 2026",
          ]}
          status="active"
          url="https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit"
        />
      </div>

      <div className="flex items-start gap-2 pt-3 mt-1 border-t">
        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Texas has no HOV lane exemption for EVs. The federal $7,500 new EV tax credit and $4,000
          used EV credit both expired October 1, 2025. Incentive terms change frequently — verify
          before purchasing.
        </p>
      </div>

    </CardContent>
  </Card>
);

export default EVIncentivesSection;
