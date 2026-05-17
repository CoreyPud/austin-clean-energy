import { Card, CardContent } from "@/components/ui/card";

interface Props {
  address: string;
  district: string;
  zipCode: string | null;
  propertyType: string;
  monthlySavings: number | null;
  paybackYears: number | null;
}

const fmt$ = (n: number) =>
  n < 0
    ? `-$${Math.abs(Math.round(n)).toLocaleString()}`
    : `$${Math.round(n).toLocaleString()}`;

const CleanEnergyScoreCard = ({
  address, district, zipCode, propertyType,
  monthlySavings, paybackYears,
}: Props) => (
  <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" aria-hidden />
    <CardContent className="p-6 md:p-7">
      <p className="text-xs text-muted-foreground mb-5 truncate">
        {address} · {propertyType.replace("-", " ")} · ZIP {zipCode || "—"} · {district}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Monthly savings"
          value={monthlySavings != null ? fmt$(monthlySavings) : "—"}
          highlight
        />
        <Stat
          label="Payback"
          value={paybackYears != null ? `~${paybackYears} yr` : "—"}
        />
      </div>
    </CardContent>
  </Card>
);

const Stat = ({
  label, value, sub, highlight,
}: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) => (
  <div className={`rounded-lg border px-3 py-3 ${highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background/50"}`}>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
    <div className={`text-2xl font-bold tabular-nums leading-none ${highlight ? "text-primary" : "text-foreground"}`}>
      {value}
    </div>
    {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export default CleanEnergyScoreCard;
