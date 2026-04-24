import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, PiggyBank, Coins, Calendar, Zap } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

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
  const annual = useCountUp(savings.annualSavingsUsd || 0);
  const paybackYears = savings.paybackYears ?? 25;
  const paybackPct = Math.min(100, Math.max(0, (paybackYears / 25) * 100));

  return (
    <Card className="relative overflow-hidden border-2 border-accent/30 shadow-md bg-gradient-to-br from-accent/5 via-background to-background">
      {/* Confetti */}
      <Coins className="absolute top-4 right-4 h-5 w-5 text-accent/30" aria-hidden />
      <Coins className="absolute top-12 right-12 h-3 w-3 text-accent/20" aria-hidden />
      <PiggyBank className="absolute bottom-6 right-6 h-6 w-6 text-accent/15" aria-hidden />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            {savings.recommendedSystemKw} kW recommended system
          </Badge>
          <Badge variant="outline" className="text-xs">
            ~${savings.blendedRateUsdPerKwh.toFixed(3)} / kWh blended rate
          </Badge>
        </div>

        {/* Hero $ */}
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-5xl md:text-6xl font-bold text-accent tabular-nums">
            {fmt(annual)}
          </span>
          <TrendingUp className="h-7 w-7 text-accent" />
          <span className="text-lg text-muted-foreground font-medium">/ year saved</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Estimated reduction in your Austin Energy bill once your system is online.
        </p>

        {/* Payback timeline */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>System payback timeline</span>
            <span className="font-semibold text-foreground">
              ~{savings.paybackYears ?? "—"} yr to break even
            </span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            {/* Pure profit zone (after payback) */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-primary/20 to-primary/40"
              style={{ width: `${100 - paybackPct}%` }}
              title="Pure profit zone"
            />
            {/* Payback marker */}
            <div
              className="absolute inset-y-0 w-1 bg-accent shadow-md"
              style={{ left: `${paybackPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Year 0</span>
            <span className="text-accent font-semibold">
              🏁 ~{savings.paybackYears ?? "—"} yr
            </span>
            <span>Year 25</span>
          </div>
        </div>

        {/* Secondary chips */}
        <div className="grid grid-cols-3 gap-2">
          <Chip
            label="Net cost"
            value={fmt(savings.netSystemCostUsd)}
            sub={`after ${fmt(savings.austinEnergyRebateUsd)} rebate`}
          />
          <Chip
            label="25-yr savings"
            value={fmt(savings.twentyFiveYearSavingsUsd)}
            sub="net of system"
            highlight
          />
          <Chip
            label="Production"
            value={`${(savings.annualProductionKwh / 1000).toFixed(1)}k`}
            sub="kWh / year"
            icon={<Calendar className="h-3 w-3" />}
          />
        </div>

        {savings.notes && (
          <p className="text-xs text-muted-foreground mt-4 italic">{savings.notes}</p>
        )}
      </CardContent>
    </Card>
  );
};

const Chip = ({
  label,
  value,
  sub,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) => (
  <div
    className={`px-3 py-2 rounded-lg border bg-background/70 ${
      highlight ? "border-primary/40 ring-1 ring-primary/20" : ""
    }`}
  >
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {icon} {label}
    </div>
    <div
      className={`text-lg font-bold tabular-nums ${
        highlight ? "text-primary" : "text-foreground"
      }`}
    >
      {value}
    </div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

export default SavingsCards;
