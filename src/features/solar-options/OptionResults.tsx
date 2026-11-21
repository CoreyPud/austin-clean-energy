import { useState } from "react";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SolarProgramView from "@/components/assessment/SolarProgramView";
import { buildProgramFinancials, classifyProperty, type SolarRecommendation } from "@/lib/property-solar";
import { buildSolarFinancialBreakdown } from "@/lib/solar-financial-breakdown";
import { AUSTIN_ENERGY_RATES, FINANCIAL_HORIZON_YEARS, SSO_MIN_KW, ssoRate } from "@/lib/solar-model";
import type { FederalSolarOptions } from "@/lib/solar-federal-incentives";
import { leaseIllustration, type SolarOption, type screenSolarOptions } from "./screening";

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const OPTION_NAMES: Record<SolarOption, string> = { sso: "Standard Offer", loan: "Loan + Value of Solar", lease: "Equipment lease + Value of Solar" };

interface Props {
  propertyType: string;
  recommendation: ReturnType<typeof screenSolarOptions>;
  selected: SolarOption;
  onSelect: (option: SolarOption) => void;
  vos: SolarRecommendation;
  sso: SolarRecommendation;
  eligible: boolean;
  annualUsageKwh: number;
  productionPerKw: number;
  om: number;
  onOmChange: (value: number) => void;
  loanRate: number;
  onLoanRateChange: (value: number) => void;
  loanYears: number;
  onLoanYearsChange: (value: number) => void;
  leasePercent: number | null;
  onLeasePercentChange: (value: number | null) => void;
  onSizeChange: (value: number) => void;
  onCostChange: (value: number) => void;
  federalOptions: FederalSolarOptions;
  onFederalChange: (value: FederalSolarOptions) => void;
}

export default function OptionResults(props: Props) {
  const { propertyType, recommendation, selected, onSelect, vos, sso, eligible, annualUsageKwh, productionPerKw, om, loanRate, loanYears, leasePercent } = props;
  const [advanced, setAdvanced] = useState(false);
  const residential = classifyProperty(propertyType) === "residential";
  const multifamily = classifyProperty(propertyType) === "multifamily";
  const inputs = { annualUsageKwh, productionPerKw, isSSO: false, loanInterestRate: loanRate / 100, loanTermYears: loanYears, omPerKwYear: om };
  const financials = buildProgramFinancials(vos, inputs);
  const breakdown = buildSolarFinancialBreakdown(vos, inputs, financials);
  const loanYear1 = breakdown.rows[0]?.netCashFlow;
  const vosSavings = multifamily ? vos.annualProductionKwh * AUSTIN_ENERGY_RATES.vosRate : financials.yearOne.savings;
  const lease = leaseIllustration(vosSavings, leasePercent);
  const options: SolarOption[] = residential ? ["loan"] : ["sso", "loan", "lease"];

  return <div className="space-y-8">
    <section className="border-l-4 border-primary pl-5 space-y-2" aria-label="Suggested option">
      <p className="text-sm font-medium text-primary">{recommendation.review ? "Starting point · review needed" : "Suggested starting point"}</p>
      <h3 className="text-2xl font-bold">{OPTION_NAMES[recommendation.option]}</h3>
      <p className="max-w-3xl text-muted-foreground">{recommendation.reason}</p>
    </section>
    <div className={`grid gap-4 ${residential ? "" : "lg:grid-cols-3"}`}>
      {options.map(option => <Card key={option} className={selected === option ? "border-primary border-2" : "border-border"}>
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{OPTION_NAMES[option]}</h3>{selected === option && <Check className="w-5 h-5 shrink-0 text-primary" />}</div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Solar owner</dt><dd>{option === "loan" ? "You" : "Third-party provider"}</dd></div>
            <div><dt className="text-muted-foreground">Electricity bill</dt><dd>{option === "sso" ? "Not reduced by this solar" : multifamily ? "Credits to tenants, not the owner" : "Reduced through Value of Solar credits"}</dd></div>
            <div><dt className="text-muted-foreground">System size · DC estimate</dt><dd>{(option === "sso" ? sso : vos).recommendedKw.toLocaleString()} kW</dd></div>
            {option === "loan" && <>
              <div><dt className="text-muted-foreground">Year-1 {multifamily ? "tenant credits" : "bill savings"}</dt><dd>{money(vosSavings)}</dd></div>
              <div><dt className="text-muted-foreground">Year-1 loan payment</dt><dd>{multifamily ? "Needs owner-specific review" : money(financials.thirtyYear.annualLoanPayment)}</dd></div>
              <div><dt className="text-muted-foreground">Year-1 owner net · after O&M & loan</dt><dd className="font-semibold">{loanYear1 == null ? "Not modeled" : money(loanYear1)}</dd></div>
            </>}
            {option === "sso" && <>
              <div><dt className="text-muted-foreground">Host income</dt><dd>Needs a developer proposal</dd></div>
              <div><dt className="text-muted-foreground">Availability</dt><dd>{eligible ? "Potentially eligible; utility approval required" : `Below the ${SSO_MIN_KW} kW screening minimum`}</dd></div>
            </>}
            {option === "lease" && <>
              <div><dt className="text-muted-foreground">Lease payment · placeholder</dt><dd>{lease ? `${money(lease.payment)}/year` : "x% of annual VoS bill savings"}</dd></div>
              <div><dt className="text-muted-foreground">Retained {multifamily ? "tenant credits" : "bill savings"} · before other costs</dt><dd>{lease ? `${money(lease.retainedSavings)}/year` : "(100 − x)% of annual VoS bill savings"}</dd></div>
              <div><dt className="text-muted-foreground">Quote status</dt><dd>No lease pricing available</dd></div>
            </>}
          </dl>
          <Button className="mt-auto" variant={selected === option ? "default" : "outline"} disabled={option === "sso" && !eligible} aria-pressed={selected === option} onClick={() => onSelect(option)}>{selected === option ? "Selected" : "Explore this option"}</Button>
        </CardContent>
      </Card>)}
    </div>
    {selected === "lease" && <section className="border-y border-border py-6 space-y-4" aria-label="Lease placeholder">
      <h3 className="text-xl font-semibold">Lease illustration — not a quote</h3>
      <p className="text-sm text-muted-foreground">x is the share of the dollar value of annual Value of Solar bill savings paid to the lessor. No lease term, escalator, maintenance agreement, buyout, or financing return is assumed. Rebates and federal benefits are not included for the host.</p>
      <div className="max-w-sm space-y-2"><Label htmlFor="lease-share">Illustrative lease payment (% of annual bill savings)</Label><Input id="lease-share" type="number" min={0} max={100} placeholder="x — enter an assumption" value={leasePercent ?? ""} onChange={event => { const value = event.target.value === "" ? null : Number(event.target.value); props.onLeasePercentChange(value == null ? null : Math.min(100, Math.max(0, value))); }} /></div>
      <p className="text-sm">Annual VoS {multifamily ? "tenant credit" : "bill savings"} basis: <strong>{money(vosSavings)}</strong>. {lease ? `Illustrative payment ${money(lease.payment)}; retained savings ${money(lease.retainedSavings)} before any separately charged costs.` : "Lease payment = x% × this amount. Retained savings = (100 − x)% × this amount."}</p>
      {multifamily && <p className="text-sm text-muted-foreground">Tenant credits are not landlord cash flow. A lease would require a separate agreement about who pays it.</p>}
    </section>}
    {selected === "sso" && <section className="border-y border-border py-6 space-y-3">
      <h3 className="text-xl font-semibold">Standard Offer — host, not investor</h3>
      <p>You do not own the solar in this arrangement. Your electricity bill stays separate; roof rent or revenue sharing depends on the developer’s offer.</p>
      <p className="text-sm text-muted-foreground">At {sso.recommendedKw.toLocaleString()} kW and estimated {sso.annualProductionKwh.toLocaleString()} kWh/year, the existing utility-payment scenario is {money(sso.annualProductionKwh * ssoRate(sso.recommendedKw))}/year to the system owner in year 1, <strong>not host income</strong>. Host returns are not calculated without contract terms.</p>
    </section>}
    {selected === "loan" && <section className="space-y-4">
      <h3 className="text-xl font-semibold">Ownership financials</h3>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><dt className="text-muted-foreground">Installed cost estimate</dt><dd className="text-lg font-semibold">{money(vos.grossCost)}</dd></div>
        <div><dt className="text-muted-foreground">Austin Energy upfront rebate</dt><dd className="text-lg font-semibold">{money(vos.aeRebate)}</dd></div>
        <div><dt className="text-muted-foreground">Year-1 O&M</dt><dd className="text-lg font-semibold">{money(vos.recommendedKw * om)}</dd></div>
        <div><dt className="text-muted-foreground">{FINANCIAL_HORIZON_YEARS}-year owner net estimate</dt><dd className="text-lg font-semibold">{multifamily ? "Not modeled" : money(financials.net25)}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">Loan scenario: {loanRate}% interest over {loanYears} years, not a lender quote. O&M escalates 2% yearly; inverter replacement is included. Federal benefits, if eligible, arrive in year 2 and do not reduce the initial loan principal.</p>
    </section>}
    <section className="border-t border-border pt-5 space-y-4">
      <Button variant="outline" className="max-w-full h-auto min-h-10 whitespace-normal text-left" onClick={() => setAdvanced(value => !value)} aria-expanded={advanced}><ChevronDown className={`mr-2 h-4 w-4 ${advanced ? "rotate-180" : ""}`} />Assumptions & detailed ownership comparison</Button>
      {advanced && <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3"><Label>Loan interest: {loanRate}%</Label><Slider aria-label="Loan interest" min={0} max={15} step={0.25} value={[loanRate]} onValueChange={([value]) => props.onLoanRateChange(value)} /></div>
          <div className="space-y-3"><Label>Loan term: {loanYears} years</Label><Slider aria-label="Loan term" min={5} max={25} step={1} value={[loanYears]} onValueChange={([value]) => props.onLoanYearsChange(value)} /></div>
        </div>
        {selected !== "loan" && <p className="text-sm text-muted-foreground">The following is a separate ownership-with-loan comparison, not the lease or third-party Standard Offer contract.</p>}
        <SolarProgramView rec={vos} recommendedKw={vos.recommendedKw} propertyClass={classifyProperty(propertyType)} isNonProfit={propertyType === "non-profit"} systemKw={vos.recommendedKw} onSystemKwChange={props.onSizeChange} billingMode="vos" onBillingModeChange={() => {}} annualUsageKwh={annualUsageKwh} productionPerKw={productionPerKw} loanTermYears={loanYears} loanInterestRate={loanRate / 100} sunshineHrsDisplay={null} roofSqft={null} panelCount={null} onCostPerWChange={props.onCostChange} omPerKwYear={om} onOmPerKwYearChange={props.onOmChange} federalOptions={props.federalOptions} onFederalOptionsChange={props.onFederalChange} />
      </div>}
    </section>
    <aside className="text-sm text-muted-foreground border-t border-border pt-5 space-y-2">
      <p>Roof imagery and solar potential: Google Solar. Production and costs are planning estimates, not an engineering design. Austin Energy program eligibility, interconnection, structural condition, and actual quotes need confirmation.</p>
      <p>Bill comparison reuses the existing Austin Energy residential-rate model. Commercial and nonprofit bill savings are illustrative, not a calculation from your actual tariff; demand charges are not modeled here. Uploading a bill supplies usage, not a verified commercial rate schedule.</p>
      <Button asChild variant="link" className="px-0"><a href="https://austinenergy.com/green-power/solar-solutions" target="_blank" rel="noopener noreferrer">Austin Energy solar programs<ExternalLink className="ml-2 h-4 w-4" /></a></Button>
    </aside>
  </div>;
}