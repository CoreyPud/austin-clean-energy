import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Zap, Calendar, Sparkles } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { supabase } from "@/integrations/supabase/client";

interface NeighborhoodSnapshotProps {
  zipCode: string | null;
  installationsInZip: number;
  pendingPermitsInZip: number;
  averageSystemKw: number | null;
  newest: string | null;
}

const RES_COM_TCAD_TYPES = new Set(["single_family", "condo", "multifamily", "commercial"]);
const RES_COM_PERMIT_CLASSES = new Set(["residential", "commercial"]);

const fetchAll = async <T,>(table: string, columns: string, eq?: { col: string; val: string }): Promise<T[]> => {
  const pageSize = 1000;
  let from = 0;
  const out: T[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = (supabase as any).from(table).select(columns).range(from, from + pageSize - 1);
    if (eq) q = q.eq(eq.col, eq.val);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
};

const NeighborhoodSnapshot = ({
  zipCode,
  installationsInZip,
  pendingPermitsInZip,
  averageSystemKw,
  newest,
}: NeighborhoodSnapshotProps) => {
  const installs = useCountUp(installationsInZip);
  const [zipBuilt, setZipBuilt] = useState<number | null>(null);
  const [austinBuilt, setAustinBuilt] = useState<number | null>(null);
  const [austinSolar, setAustinSolar] = useState<number | null>(null);

  useEffect(() => {
    if (!zipCode) return;
    let cancelled = false;
    (async () => {
      try {
        const [zipBuiltRows, allBuiltRows, allSolarRows] = await Promise.all([
          fetchAll<any>("tcad_built_by_year_type_zip", "property_type, built_count", { col: "zip", val: zipCode }),
          fetchAll<any>("tcad_built_by_year_type_zip", "property_type, built_count"),
          fetchAll<any>("solar_permits_by_year_class_zip", "permit_class, solar_count"),
        ]);
        if (cancelled) return;
        const sumZip = zipBuiltRows
          .filter((r) => RES_COM_TCAD_TYPES.has(String(r.property_type)))
          .reduce((s, r) => s + (Number(r.built_count) || 0), 0);
        const sumAustinBuilt = allBuiltRows
          .filter((r) => RES_COM_TCAD_TYPES.has(String(r.property_type)))
          .reduce((s, r) => s + (Number(r.built_count) || 0), 0);
        const sumAustinSolar = allSolarRows
          .filter((r) => RES_COM_PERMIT_CLASSES.has(String(r.permit_class || "").toLowerCase()))
          .reduce((s, r) => s + (Number(r.solar_count) || 0), 0);
        setZipBuilt(sumZip);
        setAustinBuilt(sumAustinBuilt);
        setAustinSolar(sumAustinSolar);
      } catch (err) {
        console.error("NeighborhoodSnapshot totals load error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zipCode]);

  const zipPct = zipBuilt && zipBuilt > 0 ? (installationsInZip / zipBuilt) * 100 : null;
  const austinPct =
    austinBuilt && austinBuilt > 0 && austinSolar !== null ? (austinSolar / austinBuilt) * 100 : null;

  // Compare your ZIP's coverage % to Austin's. Bar maxes out at 2x city avg %.
  const ratio = zipPct !== null && austinPct && austinPct > 0 ? zipPct / austinPct : 1;
  const userPct =
    zipPct !== null && austinPct && austinPct > 0
      ? Math.min(100, (zipPct / (austinPct * 2)) * 100)
      : 50;
  const avgPct = 50;

  const adoptionLabel = (() => {
    if (installationsInZip === 0) return "No installations recorded in this ZIP yet.";
    if (zipPct === null || austinPct === null) {
      return ratio >= 1.5
        ? "Above the Austin average."
        : ratio >= 0.75
          ? "Roughly on pace with the Austin average."
          : "Below the Austin average.";
    }
    const z = zipPct.toFixed(1);
    const a = austinPct.toFixed(1);
    const cmp =
      zipPct >= austinPct * 1.1
        ? "more than"
        : zipPct <= austinPct * 0.9
          ? "less than"
          : "on pace with";
    return `Your area has ${z}% solar coverage, ${cmp} the Austin average of ${a}%.`;
  })();


  return (
    <Card className="relative overflow-hidden border-2 border-secondary/30 shadow-md bg-gradient-to-br from-secondary/5 via-background to-background">
      <Home className="absolute top-4 right-4 h-5 w-5 text-secondary/20" aria-hidden />
      <CardContent className="relative p-6">
        <div className="mb-4">
          <span className="text-xs text-muted-foreground">ZIP {zipCode || "your area"}</span>
        </div>

        {/* Hero stat */}
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span className="text-5xl md:text-6xl font-bold text-secondary tabular-nums">
            {Math.round(installs).toLocaleString()}
          </span>
          <span className="text-lg text-muted-foreground">
            solar installations in {zipCode || "your ZIP"}
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
            <span>0%</span>
            <span className="font-semibold">
              ↑ Austin avg{austinPct !== null ? ` (${austinPct.toFixed(1)}%)` : ""}
            </span>
            <span>{austinPct !== null ? `${(austinPct * 2).toFixed(1)}%+` : ""}</span>
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
