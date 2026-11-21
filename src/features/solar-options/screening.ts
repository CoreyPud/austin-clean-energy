export type BillPayer = "owner" | "tenant" | "shared" | "unknown";
export type FinanceGoal = "own" | "avoid-loan" | "unsure";
export type SolarOption = "loan" | "lease" | "sso";

export function screenSolarOptions(propertyType: string, payer: BillPayer, goal: FinanceGoal, ssoEligible: boolean): { option: SolarOption; reason: string; review: boolean } {
  if (propertyType === "single-family" || propertyType === "condo") {
    return { option: "loan", reason: "Owning the solar keeps the Value of Solar credits on your electricity account. Compare a loan with paying upfront.", review: false };
  }
  if (payer === "tenant" || propertyType === "multi-family") {
    return ssoEligible
      ? { option: "sso", reason: "A third-party Standard Offer project does not depend on reducing your electricity bill. Value of Solar benefits would otherwise go to the bill payer or tenants.", review: false }
      : { option: "loan", reason: "This roof is below the Standard Offer minimum. Value of Solar credits benefit the bill payer, not automatically the landlord; resolve ownership and meter arrangements before choosing financing.", review: true };
  }
  if (payer === "shared" || payer === "unknown") {
    return { option: ssoEligible ? "sso" : "loan", reason: "Confirm who receives the electricity credits and who can authorize the roof before choosing a financial arrangement.", review: true };
  }
  if (goal === "avoid-loan") {
    return { option: "lease", reason: "You pay the electricity bill and prefer not to borrow. An equipment lease may let you keep part of the Value of Solar savings without owning the panels; actual lease terms are still needed.", review: false };
  }
  return { option: "loan", reason: goal === "own"
    ? "You pay the electricity bill and want to own the solar. A loan can preserve the Value of Solar bill credits while spreading the purchase cost."
    : "Because you pay the bill, start by comparing ownership with a lease. The loan is a starting point, not a financial winner until actual quotes are available.", review: goal === "unsure" };
}

/** Lease payment is a share of dollar-valued VoS savings, not a percentage of kWh units. */
export function leaseIllustration(annualSavings: number, paymentPercent: number | null) {
  if (paymentPercent == null || !Number.isFinite(paymentPercent) || paymentPercent < 0 || paymentPercent > 100) return null;
  const payment = Math.max(0, annualSavings) * paymentPercent / 100;
  return { payment, retainedSavings: Math.max(0, annualSavings) - payment };
}

export function annualizeBillUsage(months: number[]): number | null {
  if (!months.length || months.some(kwh => !Number.isFinite(kwh) || kwh < 0)) return null;
  const recent = months.slice(-12);
  return recent.reduce((sum, kwh) => sum + kwh, 0) / recent.length * 12;
}