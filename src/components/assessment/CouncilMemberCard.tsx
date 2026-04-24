import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, ExternalLink, Megaphone, AlertCircle } from "lucide-react";

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

const CouncilMemberCard = ({ councilMember }: CouncilMemberCardProps) => {
  const { district, name, email, phone, officePage, priorities, lookupSucceeded } = councilMember;

  return (
    <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-secondary" />
              Your Council Representative
            </CardTitle>
            <CardDescription>
              {lookupSucceeded === false
                ? "We couldn't auto-detect your district — verify with the city link below."
                : `${district} • Local advocacy starts here`}
            </CardDescription>
          </div>
          <Badge variant="secondary">{district}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-xl font-bold text-foreground">{name}</div>
            {priorities && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">Current priorities:</span> {priorities}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            {email && (
              <Button variant="outline" size="sm" asChild className="justify-start">
                <a href={`mailto:${email}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  {email}
                </a>
              </Button>
            )}
            {phone && (
              <Button variant="outline" size="sm" asChild className="justify-start">
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  {phone}
                </a>
              </Button>
            )}
          </div>

          <Button asChild className="w-full bg-secondary hover:bg-secondary/90">
            <a href={officePage} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit official office page
            </a>
          </Button>

          {lookupSucceeded === false && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/40 rounded">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default CouncilMemberCard;
