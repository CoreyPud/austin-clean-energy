import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Zap, Calendar, Sparkles } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface NeighborhoodSnapshotProps {
  zipCode: string | null;
  installationsInZip: number;
  pendingPermitsInZip: number;
  averageSystemKw: number | null;
  newest: string | null;
}

// A simple Austin-wide reference adoption baseline (per ZIP, rough): used only for
// the visual comparison bar — not displayed as a precise number.
const AUSTIN_AVG_PER_ZIP = 35;

const NeighborhoodSnapshot = ({
  zipCode,
  installationsInZip,
  pendingPermitsInZip,
  averageSystemKw,
  newest,
}: NeighborhoodSnapshotProps) => {
  const installs = useCountUp(installationsInZip);
  // Compare your ZIP's adoption to a rough city average. Bar maxes out at 2x city avg.
  const ratio = AUSTIN_AVG_PER_ZIP > 0 ? installationsInZip / AUSTIN_AVG_PER_ZIP : 1;
  const userPct = Math.min(100, (installationsInZip / (AUSTIN_AVG_PER_ZIP * 2)) * 100);
  const avgPct = 50; // by definition (Austin avg sits at the midpoint of the 0..2x scale)

  const adoptionLabel =
    installationsInZip === 0
      ? "An untapped block — be a first-mover"
      : ratio >= 1.5
        ? "Above the Austin average"
        : ratio >= 0.75
          ? "Roughly on pace with Austin"
          : "Below the Austin average";

  return (
    <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
      <Home className="absolute top-4 right-4 h-5 w-5 text-secondary/20" aria-hidden />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <Badge variant="secondary" className="text-xs">
            <Home className="h-3 w-3 mr-1" />
            ZIP {zipCode || "your area"}
          </Badge>
          {pendingPermitsInZip > 0 && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              {pendingPermitsInZip} pending nearby
            </Badge>
          )}
        </div>

        {/* Hero comparison sentence */}
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-lg text-muted-foreground">You'd join</span>
          <span className="text-5xl md:text-6xl font-bold text-secondary tabular-nums">
            {Math.round(installs).toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground">
            neighbors with solar in {zipCode || "your ZIP"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{adoptionLabel}.</p>

        {/* Adoption comparison bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
            <span>Your ZIP vs. Austin average</span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary/70 to-primary transition-all duration-700"
              style={{ width: `${userPct}%` }}
            />
            {/* Austin avg marker */}
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground/50"
              style={{ left: `${avgPct}%` }}
              title="Austin average"
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>0</span>
            <span className="font-semibold">↑ Austin avg ({AUSTIN_AVG_PER_ZIP})</span>
            <span>{AUSTIN_AVG_PER_ZIP * 2}+</span>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat
            icon={<Sparkles className="h-3.5 w-3.5" />}
            value={String(pendingPermitsInZip)}
            label="in permitting"
          />
          <MiniStat
            icon={<Zap className="h-3.5 w-3.5" />}
            value={averageSystemKw ? `${averageSystemKw} kW` : "—"}
            label="avg system"
          />
          <MiniStat
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={
              newest
                ? new Date(newest).toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  })
                : "—"
            }
            label="newest install"
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
    <div className="text-secondary">{icon}</div>
    <div className="leading-tight">
      <div className="text-sm font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  </div>
);

export default NeighborhoodSnapshot;
