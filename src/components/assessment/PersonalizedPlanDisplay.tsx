import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Sun, Car, Wrench, Battery, Zap, Leaf, ExternalLink } from "lucide-react";

interface ParsedMove {
  title: string;
  description: string;
}

function parseMoves(md: string): ParsedMove[] {
  if (!md) return [];
  const sectionMatch = md.match(/\*\*\s*(?:Your )?Top 3 Moves\s*\*\*([\s\S]*?)(?:\*\*This Month\*\*|$)/i);
  if (!sectionMatch) return [];
  const body = sectionMatch[1];
  return [...body.matchAll(/^\s*\d+\.\s*(.+)$/gm)].map((m) => {
    const raw = m[1].trim();
    const titleMatch = raw.match(/^\*\*(.+?)\*\*\s*[:—-]?\s*(.*)$/s);
    if (titleMatch) return { title: titleMatch[1].trim(), description: titleMatch[2].trim() };
    const idx = raw.indexOf(":");
    return idx > 0
      ? { title: raw.slice(0, idx).replace(/\*\*/g, "").trim(), description: raw.slice(idx + 1).trim() }
      : { title: raw.replace(/\*\*/g, "").trim(), description: "" };
  });
}

const MOVE_TYPES: Record<string, {
  icon: any; category: string; impact: "high" | "medium";
  badge: string; iconBg: string; iconText: string;
  cta: { label: string; url: string };
}> = {
  solar:   { icon: Sun,     category: "Home Power",    impact: "high",   badge: "bg-primary/15 text-primary border-primary/30",       iconBg: "bg-primary/15",   iconText: "text-primary",   cta: { label: "Austin Energy Solar Rebate",    url: "https://austinenergy.com/green-power/solar-solutions/for-your-home" } },
  ev:      { icon: Car,     category: "Transportation", impact: "high",   badge: "bg-primary/15 text-primary border-primary/30",       iconBg: "bg-primary/15",   iconText: "text-primary",   cta: { label: "Austin Energy EV Programs",     url: "https://austinenergy.com/green-power/plug-in-austin" } },
  audit:   { icon: Wrench,  category: "Efficiency",    impact: "high",   badge: "bg-primary/15 text-primary border-primary/30",       iconBg: "bg-primary/15",   iconText: "text-primary",   cta: { label: "Schedule a Home Energy Audit",  url: "https://austinenergy.com/energy-efficiency/rebates-incentives/residential/home-improvements/home-energy-savings" } },
  battery: { icon: Battery, category: "Resilience",    impact: "medium", badge: "bg-secondary/15 text-secondary border-secondary/30", iconBg: "bg-secondary/15", iconText: "text-secondary", cta: { label: "Austin Energy Battery Rebate",  url: "https://austinenergy.com/green-power/solar-solutions/for-your-home/battery-storage-incentive" } },
  green:   { icon: Leaf,    category: "Home Power",    impact: "medium", badge: "bg-secondary/15 text-secondary border-secondary/30", iconBg: "bg-secondary/15", iconText: "text-secondary", cta: { label: "Sign up for GreenChoice",       url: "https://austinenergy.com/green-power/greenchoice" } },
  electric:{ icon: Zap,     category: "Appliances",    impact: "medium", badge: "bg-secondary/15 text-secondary border-secondary/30", iconBg: "bg-secondary/15", iconText: "text-secondary", cta: { label: "Heat Pump Rebates",             url: "https://austinenergy.com/energy-efficiency/rebates-incentives" } },
};

const IMPACT_LABELS = { high: "High impact", medium: "Medium impact" };

function getMoveType(title: string) {
  const t = title.toLowerCase();
  if (t.includes("solar") || t.includes("kw")) return MOVE_TYPES.solar;
  if (t.includes("electric vehicle") || t.includes(" ev")) return MOVE_TYPES.ev;
  if (t.includes("audit") || t.includes("efficiency")) return MOVE_TYPES.audit;
  if (t.includes("battery") || t.includes("storage")) return MOVE_TYPES.battery;
  if (t.includes("greenchoice") || t.includes("renewable")) return MOVE_TYPES.green;
  if (t.includes("electrif") || t.includes("appliance")) return MOVE_TYPES.electric;
  return MOVE_TYPES.audit;
}

function MarkdownInline({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: (p) => <span {...p} />,
        strong: (p) => <strong {...p} className="text-foreground font-semibold" />,
        a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

const PersonalizedPlanDisplay = ({ markdown }: { markdown: string }) => {
  const moves = parseMoves(markdown);
  if (!moves.length) return null;

  return (
    <div className="space-y-3">
      {moves.map((move, i) => {
        const type = getMoveType(move.title);
        const Icon = type.icon;
        return (
          <Card key={i} className="border-2 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
            <CardContent className="p-5 flex flex-col flex-1 gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-12 w-12 rounded-full ${type.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-6 w-6 ${type.iconText}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{type.category}</div>
                    <h3 className="font-semibold text-foreground leading-tight">{move.title}</h3>
                  </div>
                </div>
                <Badge variant="outline" className={`${type.badge} shrink-0 text-xs`}>
                  {IMPACT_LABELS[type.impact]}
                </Badge>
              </div>

              <p className="text-sm text-foreground/90 flex-1">
                <MarkdownInline text={move.description} />
              </p>

              <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                <a href={type.cta.url} target="_blank" rel="noopener noreferrer">
                  {type.cta.label}
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

export default PersonalizedPlanDisplay;
