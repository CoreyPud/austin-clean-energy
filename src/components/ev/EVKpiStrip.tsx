import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, Clock, Leaf } from "lucide-react";
import { EVResults, EVMode } from "@/lib/ev-model";

interface Props {
  results: EVResults;
  mode: EVMode;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const EVKpiStrip = ({ results, mode }: Props) => {
  const { annualSavings, tenYearSavings, breakEvenYearExact, co2AvoidedKgPerYear } = results;
  const ownGas = mode === "own-gas";

  const breakEvenLabel =
    breakEvenYearExact === 0 ? "Day 1" :
    breakEvenYearExact === null ? ">10 yrs" :
    `${breakEvenYearExact.toFixed(1)} yrs`;

  const breakEvenSub =
    breakEvenYearExact === 0
      ? (ownGas ? "Switch pays off immediately" : "EV cheaper upfront after incentives")
      : breakEvenYearExact === null
      ? (ownGas ? "Switch doesn't pay off within 10 years" : "EV doesn't break even within 10 years")
      : (ownGas ? "to recoup the cost of switching" : "when EV total cost beats gas");

  const breakEvenColor =
    breakEvenYearExact === 0 ? "text-primary" :
    breakEvenYearExact === null ? "text-muted-foreground" :
    "text-foreground";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiCard
        icon={<DollarSign className="h-4 w-4 text-primary" />}
        label="Annual savings"
        value={fmt$(annualSavings)}
        sub={ownGas ? "by switching vs. keeping gas vehicle" : "fuel + maintenance vs. gas vehicle"}
        positive={annualSavings > 0}
      />
      <KpiCard
        icon={<TrendingDown className="h-4 w-4 text-primary" />}
        label="10-year savings"
        value={fmt$(tenYearSavings)}
        sub={ownGas ? "vs. keeping your current vehicle" : "total cost of ownership"}
        positive={tenYearSavings > 0}
      />
      <KpiCard
        icon={<Clock className="h-4 w-4 text-primary" />}
        label={ownGas ? "Recoup in" : "Break-even"}
        value={breakEvenLabel}
        sub={breakEvenSub}
        valueClass={breakEvenColor}
      />
      <KpiCard
        icon={<Leaf className="h-4 w-4 text-primary" />}
        label="CO₂ avoided"
        value={`${Math.round(co2AvoidedKgPerYear).toLocaleString()} kg`}
        sub="per year vs. gas vehicle"
        positive
      />
    </div>
  );
};

const KpiCard = ({
  icon, label, value, sub, positive, valueClass,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  positive?: boolean; valueClass?: string;
}) => (
  <Card className="border border-border/50">
    <CardContent className="pt-4 pb-4">
      <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold tabular-nums leading-tight ${valueClass ?? (positive ? "text-primary" : "text-muted-foreground")}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{sub}</div>
    </CardContent>
  </Card>
);

export default EVKpiStrip;
