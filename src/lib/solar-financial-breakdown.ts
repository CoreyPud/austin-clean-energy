import {
  AUSTIN_ENERGY_RATES, PANEL_DEGRADATION_RATE, UTILITY_RATE_ESCALATION,
  INVERTER_REPLACEMENT_YEAR, INVERTER_REPLACEMENT_PER_W,
  SSO_OM_PER_KW_YEAR, SSO_OM_ESCALATION,
  SSO_INVERTER_REPLACEMENT_YEAR, SSO_INVERTER_REPLACEMENT_PER_KW,
  buildPbiModel, ssoRate, FINANCIAL_HORIZON_YEARS,
} from "./solar-model";
import { calculateFederalSolarIncentive, FEDERAL_SOLAR_RECEIPT_YEAR } from "./solar-federal-incentives";
import { buildProgramFinancials, classifyProperty, type SolarRecommendation } from "./property-solar";

export const BREAKDOWN_YEARS = FINANCIAL_HORIZON_YEARS;

/** Presentation of the same owner model used by the assessment chart, not the investor pro forma. */
export function buildSolarFinancialBreakdown(
  rec: SolarRecommendation,
  options: Parameters<typeof buildProgramFinancials>[1],
  financials = buildProgramFinancials(rec, options),
) {
  const tenantCredits = classifyProperty(rec.federalPropertyType ?? "single-family") === "multifamily" && !options.isSSO;
  const financed = !options.isSSO && !tenantCredits && financials.thirtyYear.hasLoan;
  const rebate = options.isSSO ? 0 : rec.aeRebate;
  const initialCost = options.isSSO ? rec.grossCost : rec.netCost;
  const federal = calculateFederalSolarIncentive({
    propertyType: rec.federalPropertyType ?? "single-family", systemKw: rec.recommendedKw,
    grossCost: rec.grossCost, aeRebate: rebate, options: rec.federalOptions,
  });
  const pbi = !options.isSSO && rec.pbiEligible
    ? buildPbiModel(rec.recommendedKw, options.productionPerKw) : null;
  const cumulative = options.isSSO ? financials.sso.cumulativeByYear : financials.thirtyYear.cumulativeByYear;
  const rows = financials.thirtyYear.yearlyResults.slice(0, BREAKDOWN_YEARS).map((result, index) => {
    const year = index + 1;
    const production = rec.recommendedKw * options.productionPerKw * Math.pow(1 - PANEL_DEGRADATION_RATE, index);
    const benefit = options.isSSO ? production * ssoRate(rec.recommendedKw, year)
      : tenantCredits ? production * AUSTIN_ENERGY_RATES.vosRate
      : result.savings * Math.pow(1 + UTILITY_RATE_ESCALATION, index);
    const programPayment = pbi?.yearlyRows[index]?.credit ?? 0;
    const federalReceipt = year === FEDERAL_SOLAR_RECEIPT_YEAR ? federal.creditUsd : 0;
    const maintenance = options.isSSO ? rec.recommendedKw * SSO_OM_PER_KW_YEAR * Math.pow(1 + SSO_OM_ESCALATION, index) : 0;
    const inverter = options.isSSO
      ? year === SSO_INVERTER_REPLACEMENT_YEAR ? rec.recommendedKw * SSO_INVERTER_REPLACEMENT_PER_KW : 0
      : year === INVERTER_REPLACEMENT_YEAR ? rec.recommendedKw * 1000 * INVERTER_REPLACEMENT_PER_W : 0;
    const loanPayment = financed && year <= (options.loanTermYears ?? 0) ? financials.thirtyYear.annualLoanPayment : 0;
    return {
      year, production, benefit, programPayment, federalReceipt, maintenance, inverter, loanPayment,
      netCashFlow: tenantCredits ? null : benefit + programPayment + federalReceipt - maintenance - inverter - loanPayment,
      cumulative: tenantCredits ? null : cumulative[index]?.cumulative ?? 0,
    };
  });
  return {
    rows, tenantCredits, financed, isSSO: options.isSSO, grossCost: rec.grossCost, rebate,
    cbi: ["commercial", "non-profit"].includes(rec.federalPropertyType ?? "") ? rebate : 0,
    loanPrincipal: financed ? initialCost : 0,
    initialCash: financed ? 0 : initialCost,
    federalKind: federal.kind,
  };
}