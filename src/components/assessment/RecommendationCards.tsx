import { Link } from "react-router-dom";
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
  ArrowRight,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Sun, Car, Wrench, Battery, Zap, Megaphone, Leaf,
};

const IMPACT_STYLES: Record<
  string,
  { label: string; badge: string; iconBg: string; iconText: string }
> = {
  high: {
    label: "High impact",
    badge: "bg-primary/15 text-primary border-primary/30",
    iconBg: "bg-primary/15",
    iconText: "text-primary",
  },
  medium: {
    label: "Medium impact",
    badge: "bg-secondary/15 text-secondary border-secondary/30",
    iconBg: "bg-secondary/15",
    iconText: "text-secondary",
  },
  low: {
    label: "Quick win",
    badge: "bg-muted text-muted-foreground border-border",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
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
    <div className="space-y-3">
      {cards.map((card) => (
        <RecommendationCardItem key={card.id} card={card} />
      ))}
    </div>
  );
};

const RecommendationCardItem = ({ card }: { card: RecommendationCard }) => {
  const Icon = ICONS[card.icon] || Leaf;
  const impact = IMPACT_STYLES[card.impact] || IMPACT_STYLES.medium;
  const visibleBullets = card.bullets.slice(0, 2);

  return (
    <Card className="border-2 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1 gap-3">
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

        <div className="mt-auto">
          <Button asChild variant="outline" size="sm" className="w-full">
            {card.cta.url.startsWith("/") ? (
              <Link to={card.cta.url}>
                {card.cta.label}
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Link>
            ) : (
              <a href={card.cta.url} target="_blank" rel="noopener noreferrer">
                {card.cta.label}
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </a>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCards;
