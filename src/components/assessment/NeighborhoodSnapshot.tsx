import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Zap, TrendingUp, Calendar } from "lucide-react";

interface NeighborhoodSnapshotProps {
  zipCode: string | null;
  installationsInZip: number;
  pendingPermitsInZip: number;
  averageSystemKw: number | null;
  newest: string | null;
}

const NeighborhoodSnapshot = ({
  zipCode,
  installationsInZip,
  pendingPermitsInZip,
  averageSystemKw,
  newest,
}: NeighborhoodSnapshotProps) => {
  const total = installationsInZip + pendingPermitsInZip;
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Your Neighborhood
            </CardTitle>
            <CardDescription>
              Solar activity in ZIP {zipCode || "your area"}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {total} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-muted/40 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Installed</div>
            <div className="text-2xl font-bold text-primary">{installationsInZip}</div>
            <div className="text-xs text-muted-foreground mt-1">neighbors with solar</div>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Pending</div>
            <div className="text-2xl font-bold text-secondary">{pendingPermitsInZip}</div>
            <div className="text-xs text-muted-foreground mt-1">in permitting</div>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Avg size
            </div>
            <div className="text-2xl font-bold text-foreground">
              {averageSystemKw ? `${averageSystemKw}` : "—"}
              <span className="text-sm text-muted-foreground ml-1">kW</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">per system</div>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Newest
            </div>
            <div className="text-base font-semibold text-foreground">
              {newest ? new Date(newest).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">recent install</div>
          </div>
        </div>
        {total === 0 && (
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Be one of the first in your ZIP — early adopters often inspire neighbors.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NeighborhoodSnapshot;
