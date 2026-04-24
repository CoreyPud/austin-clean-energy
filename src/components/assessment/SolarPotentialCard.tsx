import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Camera, ExternalLink, Leaf, Zap } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

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
  center: [number, number];
}

const SolarPotentialCard = ({ solarInsights, center }: SolarPotentialCardProps) => {
  const [lng, lat] = center;
  const panels = useCountUp(solarInsights.maxPanels || 0);
  // Roof "fill" is purely visual: scale panels vs typical max for a single-family home (~30 panels = "average")
  const roofFillPct = Math.min(100, Math.round(((solarInsights.maxPanels || 0) / 60) * 100));

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
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Satellite imagery
              {solarInsights.imageryDate &&
                ` • ${new Date(solarInsights.imageryDate.year, solarInsights.imageryDate.month - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`https://sunroof.withgoogle.com/building/${lat}/${lng}`, "_blank")
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Google Sunroof
          </Button>
        </div>

        {/* Hero panel count */}
        <div className="flex items-baseline gap-3 mb-1">
          <Sun className="h-8 w-8 text-primary shrink-0" />
          <span className="text-5xl md:text-6xl font-bold text-primary tabular-nums">
            {Math.round(panels).toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground font-medium">
            panels could fit
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          on roughly{" "}
          <span className="font-semibold text-foreground">
            {solarInsights.roofAreaM2 ? `${solarInsights.roofAreaM2} m²` : "your roof"}
          </span>{" "}
          — at {solarInsights.panelCapacityWatts}W per panel.
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
        <div className="grid grid-cols-3 gap-2">
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
          <MiniStat
            icon={<Leaf className="h-3.5 w-3.5" />}
            value={
              solarInsights.annualCarbonOffsetKg
                ? `${Math.round(solarInsights.annualCarbonOffsetKg).toLocaleString()}`
                : "—"
            }
            label="kg CO₂ / yr"
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
