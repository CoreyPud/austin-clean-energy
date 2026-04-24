import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Car, Wrench, Battery, Zap, Megaphone, Leaf, ExternalLink } from "lucide-react";

const ICONS: Record<string, any> = {
  Sun, Car, Wrench, Battery, Zap, Megaphone, Leaf,
};

const IMPACT_STYLES: Record<string, { label: string; classes: string }> = {
  high: { label: "High impact", classes: "bg-primary/15 text-primary border-primary/30" },
  medium: { label: "Medium impact", classes: "bg-secondary/15 text-secondary border-secondary/30" },
  low: { label: "Low impact", classes: "bg-muted text-muted-foreground border-border" },
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
      {cards.map((card) => {
        const Icon = ICONS[card.icon] || Leaf;
        const impact = IMPACT_STYLES[card.impact] || IMPACT_STYLES.medium;
        return (
          <Card key={card.id} className="border-2 hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">
                      {card.category}
                    </div>
                    <h3 className="font-semibold text-foreground leading-tight">{card.title}</h3>
                  </div>
                </div>
                <Badge variant="outline" className={impact.classes}>
                  {impact.label}
                </Badge>
              </div>

              <p className="text-sm text-foreground/90">{card.summary}</p>

              <ul className="space-y-1.5">
                {card.bullets.map((b, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={card.cta.url} target="_blank" rel="noopener noreferrer">
                  {card.cta.label}
                  <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RecommendationCards;
