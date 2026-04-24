import { Card } from "@/components/ui/card";
import { Sun, Home, Clock, Sparkles } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

interface CleanEnergyScoreCardProps {
  address: string;
  district: string;
  zipCode: string | null;
  propertyType: string;
  solarViability: number | null; // 0-10
  neighborInstalls: number;
  paybackYears: number | null;
}

function tierFor(score: number): {
  label: string;
  ring: string;
  glow: string;
  bg: string;
  text: string;
} {
  if (score >= 75)
    return {
      label: "Strong",
      ring: "hsl(var(--primary))",
      glow: "from-primary/15 via-primary/5 to-transparent",
      bg: "bg-primary/10 text-primary border-primary/30",
      text: "text-primary",
    };
  if (score >= 50)
    return {
      label: "Solid",
      ring: "hsl(var(--secondary))",
      glow: "from-secondary/15 via-secondary/5 to-transparent",
      bg: "bg-secondary/10 text-secondary border-secondary/30",
      text: "text-secondary",
    };
  return {
    label: "Emerging",
    ring: "hsl(var(--accent))",
    glow: "from-accent/15 via-accent/5 to-transparent",
    bg: "bg-accent/10 text-accent border-accent/30",
    text: "text-accent",
  };
}

const CleanEnergyScoreCard = ({
  address,
  district,
  zipCode,
  propertyType,
  solarViability,
  neighborInstalls,
  paybackYears,
}: CleanEnergyScoreCardProps) => {
  // Deterministic 0-100 score
  const solarPart = (solarViability ?? 5) * 4; // up to 40
  const neighborPart = Math.min(neighborInstalls / 50, 1) * 30; // up to 30
  const paybackPart =
    paybackYears == null
      ? 15
      : paybackYears <= 10
        ? 30
        : paybackYears <= 15
          ? 20
          : 10;
  const score = Math.max(0, Math.min(100, Math.round(solarPart + neighborPart + paybackPart)));

  const animated = useCountUp(score);
  const tier = tierFor(score);

  // SVG ring math
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <Card
      className={`relative overflow-hidden border-2 shadow-lg bg-gradient-to-br ${tier.glow}`}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl" aria-hidden />
      <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-accent/5 blur-2xl" aria-hidden />

      <div className="relative p-6 md:p-7 flex flex-col md:flex-row items-center gap-6">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              fill="none"
              opacity="0.5"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={tier.ring}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.2s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${tier.text}`}>{Math.round(animated)}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              / 100
            </div>
          </div>
        </div>

        {/* Headline + chips */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tier.bg} mb-2`}
          >
            <Sparkles className="h-3 w-3" />
            {tier.label} clean energy potential
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Your Austin Energy Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {address} • {propertyType.replace("-", " ")} • ZIP {zipCode || "—"} • {district}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            <Chip emoji="☀️" icon={<Sun className="h-3 w-3" />} label="Solar viability" value={`${solarViability ?? "—"}/10`} />
            <Chip emoji="🏘️" icon={<Home className="h-3 w-3" />} label="Neighbors" value={`${neighborInstalls}`} />
            <Chip emoji="⏱️" icon={<Clock className="h-3 w-3" />} label="Payback" value={paybackYears ? `~${paybackYears} yr` : "—"} />
          </div>
        </div>
      </div>
    </Card>
  );
};

const Chip = ({
  emoji,
  icon,
  label,
  value,
}: {
  emoji: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/70 border border-border backdrop-blur-sm">
    <span aria-hidden>{emoji}</span>
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  </div>
);

export default CleanEnergyScoreCard;
