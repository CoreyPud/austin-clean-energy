import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface MomentumData {
  weekCount: number;
  monthCount: number;
  monthKw: number;
  district: string | null;
  districtCount: number | null;
}

interface Props {
  district?: string | number | null;
}

const CommunityMomentumCard = ({ district }: Props) => {
  const [data, setData] = useState<MomentumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const params = district ? `?district=${encodeURIComponent(String(district))}` : "";
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/community-momentum${params}`,
        );
        if (!res.ok) throw new Error("Request failed");
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [district]);

  if (error) return null;

  return (
    <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 via-background to-accent/5 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-secondary" />
          Austin's clean energy momentum
        </CardTitle>
        <CardDescription>
          You're not alone — Austin homeowners are going solar every week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-4">
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="This week"
            value={loading ? null : `${data!.weekCount}`}
            sub="new permits issued"
          />
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="This month"
            value={loading ? null : `${data!.monthCount}`}
            sub={loading ? "" : `~${data!.monthKw.toLocaleString()} kW added`}
          />
          <Stat
            icon={<MapPin className="h-4 w-4" />}
            label={data?.district ? `District ${data.district}` : "Past 12 months"}
            value={
              loading
                ? null
                : data!.districtCount !== null
                ? `${data!.districtCount}`
                : "—"
            }
            sub={data?.district ? "in your district (12 mo)" : "district unavailable"}
          />
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Data source: City of Austin solar permits
          </span>
          <Link
            to="/city-progress"
            className="text-primary font-medium hover:underline flex items-center gap-1"
          >
            See city-wide progress
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const Stat = ({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  sub: string;
}) => (
  <div className="rounded-lg border border-border/60 bg-card/60 p-4">
    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-2">
      {icon}
      {label}
    </div>
    {value === null ? (
      <Skeleton className="h-8 w-16 mb-1" />
    ) : (
      <div className="text-3xl font-bold text-foreground">{value}</div>
    )}
    <div className="text-xs text-muted-foreground mt-1">{sub}</div>
  </div>
);

export default CommunityMomentumCard;
