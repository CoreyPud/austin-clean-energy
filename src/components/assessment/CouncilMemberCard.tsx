import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, ExternalLink, Megaphone, AlertCircle, Target } from "lucide-react";

interface CouncilMemberCardProps {
  councilMember: {
    district: string;
    districtNumber: number | null;
    name: string;
    email: string;
    phone: string;
    officePage: string;
    priorities: string;
    source: "knowledge-base" | "arcgis-fallback";
    lookupSucceeded?: boolean;
  };
}

function initialsFor(name: string): string {
  const cleaned = name.replace(/["“”]/g, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function priorityChips(priorities: string): string[] {
  if (!priorities) return [];
  return priorities
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3);
}

const CouncilMemberCard = ({ councilMember }: CouncilMemberCardProps) => {
  const { district, name, email, phone, officePage, priorities, lookupSucceeded } = councilMember;
  const initials = initialsFor(name);
  const chips = priorityChips(priorities);

  return (
    <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-secondary/20 blur-md" aria-hidden />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary text-primary-foreground flex items-center justify-center text-xl font-bold ring-2 ring-secondary/30">
              {initials}
            </div>
          </div>

          {/* Name & district */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-3.5 w-3.5 text-secondary" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Your council representative
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground leading-tight">{name}</h3>
            <Badge variant="secondary" className="mt-1.5 text-xs">
              {district}
            </Badge>
          </div>
        </div>

        {/* Priority chips */}
        {chips.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-3.5 w-3.5 text-secondary" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Currently focused on
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((p, i) => (
                <span
                  key={i}
                  className="inline-block px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact actions */}
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          {email && (
            <Button variant="outline" size="sm" asChild className="justify-start">
              <a href={`mailto:${email}`}>
                <Mail className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            </Button>
          )}
          {phone && (
            <Button variant="outline" size="sm" asChild className="justify-start">
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <Phone className="h-4 w-4 mr-2 shrink-0" />
                {phone}
              </a>
            </Button>
          )}
        </div>

        <Button asChild size="sm" className="w-full bg-secondary hover:bg-secondary/90">
          <a href={officePage} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit official office page
          </a>
        </Button>

        {lookupSucceeded === false && (
          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/40 rounded">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Showing the Mayor as a default. Confirm your district at{" "}
              <a
                href="https://www.austintexas.gov/department/city-council"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                austintexas.gov/city-council
              </a>
              .
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CouncilMemberCard;
