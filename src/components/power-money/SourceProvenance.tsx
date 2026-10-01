import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PowerMoneyData } from "@/lib/power-money";

export type Basis = "ae_doc" | "ae_calc" | "eia" | "eia_calc" | "industry" | "reported" | "estimate";

export const BASIS_META: Record<Basis, { label: string; className: string; rank: number }> = {
  ae_doc: { label: "AE document", className: "bg-primary text-primary-foreground", rank: 1 },
  ae_calc: { label: "Calculated from AE document", className: "bg-primary/20 text-foreground", rank: 2 },
  eia: { label: "EIA reported", className: "bg-secondary text-secondary-foreground", rank: 1 },
  eia_calc: { label: "Calculated from EIA", className: "bg-secondary/60 text-secondary-foreground", rank: 2 },
  reported: { label: "News report", className: "bg-accent text-accent-foreground", rank: 3 },
  industry: { label: "Industry average", className: "bg-muted text-muted-foreground", rank: 4 },
  estimate: { label: "Our estimate", className: "border border-destructive/60 text-destructive", rank: 5 },
};

export function SourceBadge({ basis, note, url }: { basis: Basis; note?: string; url?: string | null }) {
  const m = BASIS_META[basis];
  const badge = (
    <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${m.className}`}>
      {m.label}
    </span>
  );
  if (!note && !url) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">{badge}</a>
        ) : (
          <span tabIndex={0}>{badge}</span>
        )}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{note}{url ? " (click to open source)" : ""}</TooltipContent>
    </Tooltip>
  );
}

type Cell = { basis: Basis; note: string } | null;
type Row = { source: string; energy: Cell; plant: Cell; system: Cell };

const SYS: Cell = {
  basis: "ae_calc",
  note: "Austin Energy approved budget minus power-supply cost, filled in between anchor years and spread evenly over every MWh.",
};
const NREL: Cell = {
  basis: "industry",
  note: "National NREL Annual Technology Baseline O&M and capital rates applied to Austin Energy's ownership share of EIA-860 capacity — not Austin Energy's books.",
};
const IN_PPA: Cell = null;
const fossil = (f: string): Cell => ({
  basis: "eia_calc",
  note: `Fuel burned at each plant (EIA Form 923) x Texas electric-utility average ${f} price (EIA). Not Austin Energy's actual invoices.`,
});

const ROWS: Row[] = [
  { source: "Natural gas", energy: fossil("gas"), plant: NREL, system: SYS },
  { source: "Coal (Fayette)", energy: fossil("coal"), plant: NREL, system: SYS },
  {
    source: "Nuclear (STP)",
    energy: { basis: "estimate", note: "EIA reports no nuclear fuel cost. Flat ~$7/MWh based on typical STP-class fuel cost." },
    plant: NREL,
    system: SYS,
  },
  {
    source: "Utility solar",
    energy: { basis: "ae_calc", note: "Per-contract prices from council documents, weighted by each farm's EIA output — see table below." },
    plant: IN_PPA,
    system: SYS,
  },
  {
    source: "Wind",
    energy: { basis: "estimate", note: "Flat $32/MWh (pre-2015 contracts) and $25/MWh (later). Not yet tied to individual contracts." },
    plant: IN_PPA,
    system: SYS,
  },
  {
    source: "Biomass (Nacogdoches)",
    energy: { basis: "estimate", note: "Flat $70/MWh energy cost; the contract's large fixed payments are excluded." },
    plant: IN_PPA,
    system: SYS,
  },
];

const CellView = ({ c }: { c: Cell }) => (c ? <SourceBadge basis={c.basis} note={c.note} /> : <span className="text-xs text-muted-foreground">Included in contract price</span>);

export function SourceMatrix({ data }: { data: PowerMoneyData }) {
  const ppas = Object.values(data.assumptions.plantPpas ?? {});
  return (
    <Card>
      <CardHeader>
        <CardTitle>How solid is each number?</CardTitle>
        <CardDescription>
          Where every piece of the per-MWh cost comes from. Hover or tap a tag for the exact source. Generation (MWh)
          for every source is <SourceBadge basis="eia" note="EIA Form 923 monthly plant generation x Austin Energy ownership or contract share." />.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Energy / fuel price</th>
                <th className="py-2 pr-3">Plant O&amp;M + capital</th>
                <th className="py-2 pr-3">System costs</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.source} className="border-b last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.source}</td>
                  <td className="py-2 pr-3"><CellView c={r.energy} /></td>
                  <td className="py-2 pr-3"><CellView c={r.plant} /></td>
                  <td className="py-2 pr-3"><CellView c={r.system} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ppas.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Utility solar contracts, one by one</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3">Solar farm (online)</th>
                    <th className="py-2 pr-3 text-right">$/MWh used</th>
                    <th className="py-2 pr-3">Basis</th>
                    <th className="py-2">How we got it</th>
                  </tr>
                </thead>
                <tbody>
                  {ppas.map((p) => (
                    <tr key={p.name} className="border-b last:border-0 align-top">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">{p.name}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">${p.usdPerMwh.toFixed(0)}</td>
                      <td className="py-2 pr-3"><SourceBadge basis={p.basis as Basis} note={p.note} url={p.url} /></td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {p.note}{" "}
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline">
                            Source
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Bottom line: the gas and coal fuel numbers rest on federal data, but they use statewide average prices rather
          than Austin Energy's invoices. Solar contract prices come from council documents wherever they exist. Wind,
          nuclear fuel and biomass are still our estimates, and plant upkeep and capital for owned plants are national
          averages. None of these bars include the cost of backup power when the sun or wind drops, or the market value of
          power at the hour it is produced. That is the strongest argument that the cheapest bar is not automatically the
          cheapest resource.
        </p>
      </CardContent>
    </Card>
  );
}
