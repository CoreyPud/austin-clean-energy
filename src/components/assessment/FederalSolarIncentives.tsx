import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { calculateFederalSolarIncentive, type FederalSolarOptions } from "@/lib/solar-federal-incentives";

interface Props {
  options: FederalSolarOptions;
  onChange?: (value: FederalSolarOptions) => void;
  result: ReturnType<typeof calculateFederalSolarIncentive>;
  systemKw: number;
  isNonprofit: boolean;
  aeRebate: number;
}

export default function FederalSolarIncentives({ options, onChange, result, systemKw, isNonprofit, aeRebate }: Props) {
  const field = (key: keyof FederalSolarOptions, label: string, checked: boolean, disabled = false) => (
    <div className="flex items-start gap-2">
      <Checkbox id={`federal-${key}`} checked={checked} disabled={!onChange || disabled}
        onCheckedChange={value => onChange?.({ ...options, [key]: value === true })} />
      <Label htmlFor={`federal-${key}`} className="text-sm leading-snug">{label}</Label>
    </div>
  );
  return (
    <section className="border-t border-border pt-3 space-y-3" aria-label="Federal solar incentives">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-medium text-sm">Federal incentive scenario — {isNonprofit ? "nonprofit direct pay" : "commercial ITC"}</h3>
        <span className="font-semibold tabular-nums text-primary">{(result.rate * 100).toFixed(0)}% · ${result.creditUsd.toLocaleString()}</span>
      </div>
      {field("eligible", "Assume project qualifies for the 30% federal base credit", options.eligible !== false)}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          {field("lowIncome", "Low-income allocation (+10 percentage points)", options.lowIncome === true && systemKw < 5000, options.eligible === false || systemKw >= 5000)}
          <p className="text-xs text-muted-foreground">Requires an awarded §48E(h) allocation before placement in service, not just a low-income owner. Limited to eligible projects under 5 MW AC; this model conservatively disables it at 5 MW DC.</p>
        </div>
        <div className="space-y-1">
          {field("domesticContent", "Qualifying domestic content (+10 percentage points)", options.domesticContent === true, options.eligible === false)}
          <p className="text-xs text-muted-foreground">Requires documented U.S. steel/iron and manufactured-product compliance, not just U.S. assembly.</p>
        </div>
      </div>
      {!isNonprofit && aeRebate > 0 && (
        <div className="space-y-1">
          {field("rebateReducesBasis", "AE rebate is excluded from taxable income / reduces purchase price", options.rebateReducesBasis === true)}
          <p className="text-xs text-muted-foreground">Default: AE rebate treated as taxable business income, so eligible basis stays at gross cost. If excluded or a purchase-price adjustment, the rebate reduces basis. Confirm your payment's tax treatment.</p>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div><dt className="text-muted-foreground">Federal eligible basis</dt><dd className="font-medium tabular-nums">${Math.round(result.eligibleBasis).toLocaleString()}</dd></div>
        <div><dt className="text-muted-foreground">Estimated cost after AE rebate and federal benefit</dt><dd className="font-medium tabular-nums">${Math.round(result.netCostUsd).toLocaleString()}</dd></div>
      </dl>
      {isNonprofit && <p className="text-xs text-muted-foreground">Restricted tax-exempt funding, including the modeled AE rebate, does not automatically reduce basis. Direct pay is capped so that restricted funding plus the credit never exceeds project cost.{result.excessBenefitReductionUsd > 0 ? ` Estimated cap reduction: $${result.excessBenefitReductionUsd.toLocaleString()}.` : ""} Other restricted grants are not included.</p>}
      <p className="text-xs text-muted-foreground">Conditional planning estimate, not an award or tax advice. Receipt is modeled in year 2; initial cash and loan principal are not reduced by a future credit. The 30% base assumes the under-1-MW-AC exception or prevailing-wage/apprenticeship compliance. Solar must generally be in service by December 31, 2027 unless construction began before July 5, 2026 under IRS rules. Other statutory restrictions apply.</p>
      {isNonprofit && <p className="text-xs text-muted-foreground">For construction starting in 2026, elective pay may be reduced to zero without domestic-content compliance or an applicable exception. The base-credit selection assumes those requirements are satisfied; a domestic-content exception alone does not earn the bonus. Nonprofit depreciation is not modeled.</p>}
      <p className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
        <a className="underline" href="https://www.irs.gov/credits-deductions/clean-electricity-investment-credit" target="_blank" rel="noreferrer">IRS §48E</a>
        <a className="underline" href="https://www.irs.gov/credits-deductions/elective-pay-and-transferability-frequently-asked-questions-elective-pay" target="_blank" rel="noreferrer">IRS direct-pay funding rules</a>
        <a className="underline" href="https://www.irs.gov/credits-deductions/clean-electricity-low-income-communities-bonus-credit-amount-program" target="_blank" rel="noreferrer">IRS low-income allocation</a>
        <a className="underline" href="https://www.irs.gov/credits-deductions/domestic-content-bonus-credit" target="_blank" rel="noreferrer">IRS domestic content</a>
      </p>
    </section>
  );
}