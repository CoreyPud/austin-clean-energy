import { useMemo, useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { buildPbiModel, COMMERCIAL_PBI_YEARS, PBI_MIN_KW } from "@/lib/solar-model";

const fmt$ = (n: number) => `$${Math.round(n).toLocaleString()}`;

interface Props {
  systemKw: number;
  productionPerKw: number;
}

function tierLabel(systemKw: number): string {
  if (systemKw >= 1000) return "Extra-Large";
  if (systemKw >= 400) return "Large";
  return "Medium";
}

const PbiBreakdown = ({ systemKw, productionPerKw }: Props) => {
  const model = useMemo(() => buildPbiModel(systemKw, productionPerKw), [systemKw, productionPerKw]);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Show the 5 real years plus a couple of $0 years so the drop-off after the term is visible,
  // rather than a long, mostly-empty 30-year bar chart.
  const chartData = model.yearlyRows.slice(0, COMMERCIAL_PBI_YEARS + 3).map(r => ({
    year: `Yr ${r.year}`,
    "PBI credit": r.credit,
  }));

  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-lg font-semibold">Performance-Based Incentive (PBI)</h3>
            <p className="text-sm text-muted-foreground">
              An on-bill credit for the first {COMMERCIAL_PBI_YEARS} years, in addition to Value of Solar — not a replacement for it, and not an upfront rebate.
            </p>
          </div>
        </div>

        {/* Headline metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Metric label="PBI rate" value={`${(model.rate * 100).toFixed(0)}¢/kWh`} sub={`${tierLabel(systemKw)} tier`} highlight icon={<Zap className="h-3 w-3" />} />
          <Metric label="Year 1 credit" value={fmt$(model.annualCredit)} sub="on top of Value of Solar" />
          <Metric label={`${COMMERCIAL_PBI_YEARS}-year total credit`} value={fmt$(model.totalFiveYearCredit)} sub="then drops to $0" />
        </div>

        {/* Yearly credit chart */}
        <div className="h-56 mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => fmt$(v)} />
              <Bar dataKey="PBI credit" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Assumptions */}
        <button
          onClick={() => setShowAssumptions(v => !v)}
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showAssumptions ? "rotate-180" : ""}`} />
          {showAssumptions ? "Hide" : "Show"} assumptions &amp; methodology
        </button>

        {showAssumptions && (
          <div className="mt-3 rounded-lg border bg-muted/30 p-4 text-xs space-y-1.5">
            <Row k="Rate tiers" v="10¢/kWh under 400 kW-ac (Medium), 8¢/kWh 400–999 kW-ac (Large), 6¢/kWh 1,000 kW-ac and above (Extra-Large)" />
            <Row k="Term" v={`${COMMERCIAL_PBI_YEARS} years, paid monthly as an on-bill credit`} />
            <Row k="Stacking" v="Paid in addition to the Value of Solar credit, not instead of it. After the term ends, only Value of Solar continues." />
            <Row k="Eligibility" v={`For-profit commercial systems ${PBI_MIN_KW} kW-ac and above are PBI-only — not eligible for the upfront Capacity-Based Incentive (CBI). Systems under ${PBI_MIN_KW} kW-ac can choose CBI or PBI instead.`} />
            <Row k="Ownership" v="The system must be owned outright by the customer. Leased systems and Power Purchase Agreements are not eligible." />
            <p className="pt-2 border-t text-muted-foreground">
              Source: Austin Energy Solar Photovoltaic Commercial 5-Year Performance-Based Incentive (PBI) Program Guidelines. Not enforcing the program's 110%-of-consumption sizing cap here — this reflects whatever system size is currently selected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Metric = ({
  label, value, sub, highlight, icon,
}: { label: string; value: string; sub?: string; highlight?: boolean; icon?: React.ReactNode }) => (
  <div className={`px-3 py-2.5 rounded-lg border bg-background/70 ${highlight ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {icon} {label}
    </div>
    <div className={`text-xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <p className="text-muted-foreground">
    <span className="font-medium text-foreground">{k}:</span> {v}
  </p>
);

export default PbiBreakdown;
