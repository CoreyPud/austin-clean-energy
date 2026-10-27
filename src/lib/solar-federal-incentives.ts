/** Conditional §48E planning estimates; never the expired homeowner §25D credit. */
export interface FederalSolarOptions {
  eligible?: boolean;
  lowIncome?: boolean;
  domesticContent?: boolean;
  /** Treat a commercial utility payment as excluded from income / purchase-price adjustment. */
  rebateReducesBasis?: boolean;
}

export const FEDERAL_SOLAR_RECEIPT_YEAR = 2;

export function calculateFederalSolarIncentive(input: {
  propertyType: string;
  systemKw: number;
  grossCost: number;
  aeRebate: number;
  options?: FederalSolarOptions;
}) {
  const { options = {} } = input;
  const isNonprofit = input.propertyType === "non-profit";
  const eligibleOwner = isNonprofit || input.propertyType === "commercial";
  const eligible = eligibleOwner && options.eligible !== false && input.systemKw > 0;
  const grossCost = Math.max(0, input.grossCost);
  const rebate = Math.max(0, input.aeRebate);
  // Taxable business utility incentives normally leave basis intact. Excluded payments
  // or purchase-price adjustments reduce basis. For elective pay, restricted tax-exempt
  // funding leaves basis intact but triggers the §6417 excess-benefit cap.
  const basisReduction = !isNonprofit && options.rebateReducesBasis ? rebate : 0;
  const eligibleBasis = Math.max(0, grossCost - basisReduction);
  // §48E(h) requires an allocation and capacity <5 MW AC. DC >=5MW cannot qualify;
  // the UI conservatively suppresses this bonus at that DC boundary.
  const lowIncomeApplied = eligible && options.lowIncome === true && input.systemKw < 5000;
  const domesticContentApplied = eligible && options.domesticContent === true;
  const rate = eligible ? 0.30 + (lowIncomeApplied ? 0.10 : 0) + (domesticContentApplied ? 0.10 : 0) : 0;
  const uncappedCredit = eligibleBasis * rate;
  const credit = isNonprofit
    ? Math.min(uncappedCredit, Math.max(0, grossCost - rebate))
    : uncappedCredit;
  return {
    eligible, rate, eligibleBasis, basisReduction, lowIncomeApplied, domesticContentApplied,
    creditUsd: Math.round(credit),
    excessBenefitReductionUsd: Math.round(uncappedCredit - credit),
    netCostUsd: Math.max(0, grossCost - rebate - Math.round(credit)),
    kind: isNonprofit ? "Direct pay" : "Commercial ITC",
  };
}

/** Receipt in year 2, not an immediate down-payment reduction or smaller loan. */
export function addFederalReceipt<T extends { cumulativeByYear: { year: number; cumulative: number }[]; paybackYear: number | null }>(
  model: T, creditUsd: number,
): T {
  if (creditUsd <= 0) return model;
  const cumulativeByYear = model.cumulativeByYear.map(row => ({
    ...row, cumulative: row.cumulative + (row.year >= FEDERAL_SOLAR_RECEIPT_YEAR ? creditUsd : 0),
  }));
  return { ...model, cumulativeByYear, paybackYear: cumulativeByYear.find(row => row.cumulative >= 0)?.year ?? null };
}