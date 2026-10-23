import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildSupplyDemandScenario, supplyDemandDefaults, supplyDemandSource, type SupplyDemandInputs } from "./supply-demand-model";

const fields: { key: keyof SupplyDemandInputs; label: string; min: number; max: number; step: number; explanation: string }[] = [
  { key: "supplyMw", label: "2026 peak-hour supply (MW)", min: 0, max: 1000000, step: 100, explanation: "Expected capacity contributing at summer peak demand, not total installed nameplate. ERCOT reports 104,850+ MW; starting value uses 104,850." },
  { key: "demandMw", label: "2026 peak demand (MW)", min: 0, max: 1000000, step: 100, explanation: "ERCOT's October 2026 fact sheet lists a 91,155 MW record on July 22, 2026, unofficial until final settlement." },
  { key: "annualSupplyChangeMw", label: "Net supply change (MW/year)", min: -50000, max: 100000, step: 100, explanation: "Scenario assumption: annual added dependable peak-hour capacity minus retirements. Wind, solar and storage nameplate MW should not be added directly. Zero means no net change." },
  { key: "demandGrowthPct", label: "Demand growth (%/year)", min: -10, max: 30, step: 0.1, explanation: "Scenario assumption: compound annual growth in peak demand from 2026. Zero means demand stays flat; it is not a forecast." },
];

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const signedFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0, signDisplay: "exceptZero" });

export default function SupplyDemandTable() {
  const [inputs, setInputs] = useState<SupplyDemandInputs>({ ...supplyDemandDefaults });
  const rows = buildSupplyDemandScenario(inputs);
  return <section className="lzo-section" aria-labelledby="supply-demand-title">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <h2 id="supply-demand-title" className="lzo-section-title !mb-0">ERCOT supply, demand &amp; gap, 2027–2045 <span className="lzo-tag lzo-tag-scenario">Scenario</span></h2>
      <Button variant="ghost" size="sm" onClick={() => setInputs({ ...supplyDemandDefaults })}><RotateCcw />Reset</Button>
    </div>
    <p className="lzo-section-lede">All of ERCOT, not just Austin Energy. Gap = peak-hour supply − peak demand: positive is surplus; negative is shortfall before any reserve requirement.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {fields.map(field => <label key={field.key} className="text-sm font-medium min-w-0">
        <span className="block mb-2" title={field.explanation}>{field.label}</span>
        <Input type="number" aria-label={field.label} title={field.explanation} min={field.min} max={field.max} step={field.step} value={inputs[field.key]} onChange={event => {
          if (event.target.value === "") return;
          const value = event.target.valueAsNumber;
          if (Number.isFinite(value)) setInputs(current => ({ ...current, [field.key]: Math.min(field.max, Math.max(field.min, value)) }));
        }} />
      </label>)}
    </div>
    <p className="text-sm text-muted-foreground border-l-2 border-accent pl-4 mb-4">Illustrative scenario, not an official forecast. The starting supply is a planning estimate; starting demand is a historical record, not a matching weather forecast. Growth and net supply change start at zero (flat case), not a prediction. Supply additions must represent peak-hour contributions, not nameplate ratings. This is not a reliability or outage-risk model.</p>
    <div className="lzo-table-wrap">
      <table className="lzo-table" aria-label="ERCOT annual supply demand and gap scenario">
        <thead><tr><th scope="col">Year</th><th scope="col">Supply (MW)</th><th scope="col">Demand (MW)</th><th scope="col">Gap (MW)</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.year}>
          <th scope="row" className="!text-foreground !text-sm !normal-case">{row.year}</th>
          <td className="tabular-nums">{numberFormat.format(row.supplyMw)}</td>
          <td className="tabular-nums">{numberFormat.format(row.demandMw)}</td>
          <td className={`tabular-nums font-semibold ${row.gapMw < 0 ? "text-destructive" : row.gapMw > 0 ? "text-primary" : "text-foreground"}`}>{signedFormat.format(Math.round(row.gapMw))}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="lzo-sources mt-4">Starting figures: <a href={supplyDemandSource} target="_blank" rel="noreferrer">ERCOT October 2026 Fact Sheet</a> (104,850+ MW expected Summer 2026 peak-hour capacity, from December 2025 CDR; 91,155 MW July 2026 demand record). Supply = max(0, starting supply + net annual change × years since 2026). Demand = starting demand × (1 + growth rate)<sup>years since 2026</sup>. Values rounded to whole MW; gaps calculated before rounding. Future project lists on this page are partial and are not automatically included.</p>
  </section>;
}