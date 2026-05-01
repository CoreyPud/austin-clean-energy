import { Card, CardContent } from "@/components/ui/card";
import { Sun, Zap } from "lucide-react";

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
  recommendedSystemKw: number | null;
}

const SolarPotentialCard = ({ solarInsights, recommendedSystemKw }: SolarPotentialCardProps) => {
  const maxKw = Math.round((solarInsights.maxPanels * solarInsights.panelCapacityWatts) / 100) / 10;
  const roofFillPct = recommendedSystemKw && maxKw > 0
    ? Math.min(100, Math.round((recommendedSystemKw / maxKw) * 100))
    : Math.min(100, Math.round(((solarInsights.maxPanels || 0) / 60) * 100));

  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 shadow-md bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Sun-ray decoration */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <CardContent className="relative p-6">
        {/* Hero: recommended system size */}
        <div className="flex items-baseline gap-3 mb-1">
          <Sun className="h-8 w-8 text-primary shrink-0" />
          <span className="text-5xl md:text-6xl font-bold text-primary tabular-nums">
            {recommendedSystemKw != null ? `${recommendedSystemKw.toFixed(1)}` : maxKw.toFixed(1)}
          </span>
          <span className="text-lg text-muted-foreground font-medium">kW recommended</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Optimal system for your estimated usage, capped at your roof's{" "}
          <span className="font-semibold text-foreground">{maxKw.toFixed(1)} kW</span>{" "}
          maximum capacity.
        </p>

        {/* Roof coverage bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>Roof solar capacity</span>
            <span className="font-semibold text-foreground">
              {roofFillPct >= 75 ? "Excellent" : roofFillPct >= 40 ? "Good" : "Modest"}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
              style={{ width: `${roofFillPct}%` }}
            />
          </div>
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-2">
          <MiniStat
            icon={<Sun className="h-3.5 w-3.5" />}
            value={`${solarInsights.sunshineHours.toLocaleString()}h`}
            label="sunshine / yr"
          />
          <MiniStat
            icon={<Zap className="h-3.5 w-3.5" />}
            value={
              solarInsights.annualProductionKwh
                ? `${(solarInsights.annualProductionKwh / 1000).toFixed(1)}k`
                : "—"
            }
            label="kWh / yr"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const MiniStat = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/70 border">
    <div className="text-primary">{icon}</div>
    <div className="leading-tight">
      <div className="text-base font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  </div>
);

export default SolarPotentialCard;
