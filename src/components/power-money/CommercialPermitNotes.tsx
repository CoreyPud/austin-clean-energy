import type { SolarPermitCohort } from '@/lib/commercial-permit-cost';
import { commercialPermitCost } from '@/lib/commercial-permit-cost';
import { LOCAL_RATES } from '@/lib/local-resources';
import { VOS_RATE } from '@/lib/solar-model';

export function CommercialPermitNotes({ cohort, year, undated, asOf }: { cohort: SolarPermitCohort; year: number; undated: number; asOf: string | null }) {
  const cost = commercialPermitCost(cohort, LOCAL_RATES.yieldKwhPerKwYear, LOCAL_RATES.systemLifeYears);
  const rows = [
    { label: 'Under 100 kW — CBI', count: cohort.cbiCount, kw: cohort.cbiKw, rate: '$0.70/W upfront' },
    { label: '100–399 kW — PBI', count: cohort.pbiCounts[2], kw: cohort.pbiKw[2], rate: '10¢/kWh × 5 years' },
    { label: '400–999 kW — PBI', count: cohort.pbiCounts[1], kw: cohort.pbiKw[1], rate: '8¢/kWh × 5 years' },
    { label: '1,000+ kW — PBI', count: cohort.pbiCounts[0], kw: cohort.pbiKw[0], rate: '6¢/kWh × 5 years' },
  ];
  return <div className="mt-5 border-t pt-4">
    <h3 className="text-sm font-semibold">Commercial solar — permit-size-weighted CBI/PBI scenario</h3>
    <p className="mt-2 text-xs text-muted-foreground">{cohort.commercialKnownCount.toLocaleString()} of {cohort.commercialCount.toLocaleString()} commercial projects have recorded positive kW; {cohort.commercialKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW tracked. {cohort.commercialMissingKw.toLocaleString()} projects lack usable kW and are excluded, not assigned an average size.</p>
    <div className="mt-3 overflow-x-auto"><table className="w-full text-xs">
      <caption className="sr-only">Commercial permit size cohorts and modeled incentive rates</caption>
      <thead><tr className="border-b text-muted-foreground"><th className="py-2 text-left">Size / assumed program</th><th className="px-2 text-right">Projects</th><th className="px-2 text-right">Recorded kW</th><th className="py-2 text-right">Incentive</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.label} className="border-b"><td className="py-2">{row.label}</td><td className="px-2 text-right">{row.count}</td><td className="px-2 text-right">{row.kw.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td><td className="py-2 text-right">{row.rate}</td></tr>)}</tbody>
    </table></div>
    <p className="mt-3 text-xs text-muted-foreground">Commercial bar: {(VOS_RATE * 100).toFixed(2)}¢/kWh VoS + ${cost.cbiRate.toFixed(2)}/MWh CBI + ${cost.pbiRate.toFixed(2)}/MWh PBI. CBI dollars and five years of PBI are divided by estimated {LOCAL_RATES.systemLifeYears}-year generation, using {LOCAL_RATES.yieldKwhPerKwYear.toLocaleString()} kWh/kW/year with no degradation or discounting, consistent with the residential benchmark.</p>
    <p className="mt-2 text-xs text-muted-foreground">Source: corrected City solar permit database, deduplicated by project ID; Commercial permit class only. Cumulative through December 31 of {year}, or the latest available date for a partial year. Completion date takes priority; issue date is used when completion is missing. {undated.toLocaleString()} undated records across all classes are excluded. Retrieved {asOf ? new Date(asOf).toLocaleDateString() : '—'}.</p>
    <p className="mt-2 text-xs text-muted-foreground">Sizes determine a modeled for-profit CBI/PBI tier, not proven participation. Permits do not confirm Austin Energy service territory, nonprofit status, DC versus AC rating, rebate approval, or Standard Offer enrollment; actual paid costs cannot be established from permits alone. Today's program assumptions apply to each year's known fleet, not historical tariff payments. Standard Offer and federal credits are excluded. The residential rate/rebate benchmark is unchanged and uses a different tariff assumption.</p>
    <a className="mt-2 inline-block text-xs text-primary underline" href="https://austinenergy.com/green-power/solar-solutions/for-your-business" target="_blank" rel="noopener noreferrer">Austin Energy commercial solar programs</a>
  </div>;
}