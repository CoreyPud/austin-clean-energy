import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Camera, ExternalLink, Home, Leaf } from "lucide-react";

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
  return (
    <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-primary" />
              Your Roof's Solar Potential
              <Badge variant="secondary" className="ml-1">
                <Camera className="h-3 w-3 mr-1" />
                From satellite imagery
              </Badge>
            </CardTitle>
            <CardDescription>
              {solarInsights.imageryDate &&
                `Based on imagery from ${new Date(solarInsights.imageryDate.year, solarInsights.imageryDate.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </CardDescription>
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<Sun className="h-4 w-4 text-primary" />} label="Max panels" value={solarInsights.maxPanels?.toString() ?? "—"} sub={`${solarInsights.panelCapacityWatts}W each`} />
          <Stat icon={<Home className="h-4 w-4 text-primary" />} label="Roof area" value={solarInsights.roofAreaM2 ? `${solarInsights.roofAreaM2}m²` : "—"} />
          <Stat label="Annual sunshine" value={`${solarInsights.sunshineHours.toLocaleString()}h`} sub={solarInsights.annualProductionKwh ? `~${solarInsights.annualProductionKwh.toLocaleString()} kWh/yr` : undefined} />
          <Stat icon={<Leaf className="h-4 w-4 text-primary" />} label="CO₂ offset" value={solarInsights.annualCarbonOffsetKg ? `${solarInsights.annualCarbonOffsetKg.toLocaleString()}kg` : "—"} sub={`per year`} />
        </div>
      </CardContent>
    </Card>
  );
};

const Stat = ({ icon, label, value, sub }: { icon?: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="p-4 bg-background/80 rounded-lg border border-primary/20">
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold text-primary">{value}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export default SolarPotentialCard;
