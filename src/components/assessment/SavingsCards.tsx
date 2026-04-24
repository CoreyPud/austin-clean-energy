import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Calendar, PiggyBank } from "lucide-react";

interface SavingsCardsProps {
  savings: {
    recommendedSystemKw: number;
    annualProductionKwh: number;
    annualSavingsUsd: number;
    grossSystemCostUsd: number;
    austinEnergyRebateUsd: number;
    netSystemCostUsd: number;
    paybackYears: number | null;
    twentyFiveYearSavingsUsd: number;
    blendedRateUsdPerKwh: number;
    notes: string;
  };
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

const SavingsCards = ({ savings }: SavingsCardsProps) => {
  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-accent" />
              Solar Savings Estimate
            </CardTitle>
            <CardDescription>
              Recommended {savings.recommendedSystemKw} kW system for your roof
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-base px-3 py-1">
            ~{savings.paybackYears ?? "—"} yr payback
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <DollarSign className="h-3 w-3" /> Annual savings
            </div>
            <div className="text-2xl font-bold text-accent">{fmt(savings.annualSavingsUsd)}</div>
            <div className="text-xs text-muted-foreground mt-1">on your AE bill</div>
          </div>
          <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingDown className="h-3 w-3" /> Net cost
            </div>
            <div className="text-2xl font-bold text-foreground">{fmt(savings.netSystemCostUsd)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              after {fmt(savings.austinEnergyRebateUsd)} rebate
            </div>
          </div>
          <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" /> 25-yr savings
            </div>
            <div className="text-2xl font-bold text-primary">{fmt(savings.twentyFiveYearSavingsUsd)}</div>
            <div className="text-xs text-muted-foreground mt-1">net of system cost</div>
          </div>
          <div className="p-4 bg-background/80 rounded-lg border border-accent/20">
            <div className="text-xs text-muted-foreground mb-1">Production</div>
            <div className="text-2xl font-bold text-foreground">
              {savings.annualProductionKwh.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">kWh / year</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 italic">{savings.notes}</p>
      </CardContent>
    </Card>
  );
};

export default SavingsCards;
