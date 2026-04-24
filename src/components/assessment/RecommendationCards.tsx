import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Car,
  Wrench,
  Battery,
  Zap,
  Megaphone,
  Leaf,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Sun, Car, Wrench, Battery, Zap, Megaphone, Leaf,
};

const IMPACT_STYLES: Record<
  string,
  { label: string; emoji: string; badge: string; border: string; iconBg: string; iconText: string }
> = {
  high: {
    label: "High impact",
    emoji: "🔥",
    badge: "bg-primary/15 text-primary border-primary/30",
    border: "border-l-primary",
    iconBg: "bg-primary/15",
    iconText: "text-primary",
  },
  medium: {
    label: "Medium impact",
    emoji: "✨",
    badge: "bg-secondary/15 text-secondary border-secondary/30",
    border: "border-l-secondary",
    iconBg: "bg-secondary/15",
    iconText: "text-secondary",
  },
  low: {
    label: "Quick win",
    emoji: "💡",
    badge: "bg-accent/15 text-accent border-accent/30",
    border: "border-l-accent",
    iconBg: "bg-accent/15",
    iconText: "text-accent",
  },
};

interface RecommendationCard {
  id: string;
  impact: "high" | "medium" | "low";
  category: string;
  title: string;
  summary: string;
  bullets: string[];
  cta: { label: string; url: string };
  icon: string;
}

const RecommendationCards = ({ cards }: { cards: RecommendationCard[] }) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <RecommendationCardItem key={card.id} card={card} />
      ))}
    </div>
  );
};

const RecommendationCardItem = ({ card }: { card: RecommendationCard }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[card.icon] || Leaf;
  const impact = IMPACT_STYLES[card.impact] || IMPACT_STYLES.medium;
  const visibleBullets = expanded ? card.bullets : card.bullets.slice(0, 2);
  const hasMore = card.bullets.length > 2;

  return (
    <Card
      className={`border-2 border-l-4 ${impact.border} hover:shadow-md transition-all hover:-translate-y-0.5`}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-12 w-12 rounded-full ${impact.iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`h-6 w-6 ${impact.iconText}`} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {card.category}
              </div>
              <h3 className="font-semibold text-foreground leading-tight">{card.title}</h3>
            </div>
          </div>
          <Badge variant="outline" className={`${impact.badge} shrink-0 text-xs`}>
            <span className="mr-1" aria-hidden>
              {impact.emoji}
            </span>
            {impact.label}
          </Badge>
        </div>

        <p className="text-sm text-foreground/90">{card.summary}</p>

        {visibleBullets.length > 0 && (
          <ul className="space-y-1.5">
            {visibleBullets.map((b, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className={`${impact.iconText} mt-1`}>•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="flex-1 min-w-[140px]">
            <a href={card.cta.url} target="_blank" rel="noopener noreferrer">
              {card.cta.label}
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </a>
          </Button>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((e) => !e)}
              className="text-xs"
            >
              {expanded ? (
                <>
                  Less <ChevronUp className="h-3.5 w-3.5 ml-1" />
                </>
              ) : (
                <>
                  +{card.bullets.length - 2} more
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCards;
