import { Card, CardContent } from "@/components/ui/card";

const AUSTIN_AVG_SUNSHINE_HOURS = 1800;

interface SolarPotentialCardProps {
  solarInsights: {
    maxPanels: number;
    panelCapacityWatts: number;
    roofAreaM2: number | null;
    sunshineHours: number;
    annualProductionKwh: number | null;
    annualCarbonOffsetKg: number | null;
    panelLifetimeYears: number;
    imageryDate: { year: number; month: number; day: number } | null;
  };
  billOffsetPct: number | null;
}

const SolarPotentialCard = ({
  solarInsights, billOffsetPct,
}: SolarPotentialCardProps) => {
  const offsetPct = billOffsetPct ?? 0;
  const offsetBarPct = Math.min(100, offsetPct);
  const offsetColor = offsetPct >= 90 ? "from-green-500 to-emerald-400"
    : offsetPct >= 60 ? "from-primary to-secondary"
    : "from-amber-500 to-yellow-400";

  const sunshine = solarInsights.sunshineHours;
  const suitability = sunshine > AUSTIN_AVG_SUNSHINE_HOURS * 1.06
    ? { barColor: "from-green-500 to-emerald-400" }
    : sunshine < AUSTIN_AVG_SUNSHINE_HOURS * 0.94
    ? { barColor: "from-amber-500 to-yellow-400" }
    : { barColor: "from-primary to-secondary" };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)" }}
        aria-hidden
      />
      <CardContent className="relative p-6">
        {/* Est. bill offset bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>Est. bill offset</span>
            <span className="font-semibold text-foreground">{offsetPct}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${offsetColor} transition-all duration-700 ease-out`}
              style={{ width: `${offsetBarPct}%` }}
            />
          </div>
        </div>

        {/* Roof suitability bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>Roof suitability</span>
            <span className="font-semibold text-foreground">{sunshine.toLocaleString()} hours/year</span>
          </div>
          <div className="relative h-3 rounded-full bg-muted overflow-visible">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${suitability.barColor} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, Math.round(((sunshine - 1200) / (2400 - 1200)) * 100))}%` }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/30 rounded-full"
              style={{ left: `${Math.round(((AUSTIN_AVG_SUNSHINE_HOURS - 1200) / (2400 - 1200)) * 100)}%` }}
              title="Austin average"
            />
          </div>
          <div className="flex justify-end text-[10px] text-muted-foreground mt-1">
            <span>Austin avg {AUSTIN_AVG_SUNSHINE_HOURS.toLocaleString()}</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default SolarPotentialCard;
