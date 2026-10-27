import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateFederalSolarIncentive as calculate, addFederalReceipt } from "./solar-federal-incentives";
import { computeRecommendation, buildProgramFinancials } from "./property-solar";
import { buildSsoProForma } from "./sso-proforma";

const base = { propertyType: "commercial", systemKw: 50, grossCost: 100000, aeRebate: 35000 };
test("commercial base ITC is 30% of basis with taxable AE rebate", () => {
  const r = calculate(base);
  assert.equal(r.creditUsd, 30000);
  assert.equal(r.eligibleBasis, 100000);
  assert.equal(r.netCostUsd, 35000);
});
test("excluded commercial rebate reduces credit basis", () => {
  const r = calculate({ ...base, options: { rebateReducesBasis: true } });
  assert.equal(r.eligibleBasis, 65000);
  assert.equal(r.creditUsd, 19500);
});
test("nonprofit rebate retains gross basis with excess-benefit cap", () => {
  const r = calculate({ ...base, propertyType: "non-profit", aeRebate: 80000 });
  assert.equal(r.eligibleBasis, 100000);
  assert.equal(r.creditUsd, 20000);
  assert.equal(r.excessBenefitReductionUsd, 10000);
});
test("low-income adds 10 percentage points", () => {
  assert.equal(calculate({ ...base, options: { lowIncome: true } }).creditUsd, 40000);
});
test("domestic content adds 10 percentage points", () => {
  assert.equal(calculate({ ...base, options: { domesticContent: true } }).creditUsd, 40000);
});
test("both bonuses produce 50% rather than multiplying 30%", () => {
  assert.equal(calculate({ ...base, options: { lowIncome: true, domesticContent: true } }).creditUsd, 50000);
});
test("homeowners get no federal solar incentive or bonuses", () => {
  for (const propertyType of ["single-family", "single_family", "condo", "multi-family"]) {
    assert.equal(calculate({ ...base, propertyType, options: { lowIncome: true, domesticContent: true } }).creditUsd, 0);
  }
});
test("unqualified federal scenario gets no credit or bonuses", () => {
  assert.equal(calculate({ ...base, options: { eligible: false, domesticContent: true, lowIncome: true } }).creditUsd, 0);
});
test("5MW DC and above cannot select modeled low-income bonus", () => {
  assert.equal(calculate({ ...base, systemKw: 5000, options: { lowIncome: true } }).creditUsd, 30000);
});
test("federal receipt changes cumulative cash flow only from year 2", () => {
  const r = addFederalReceipt({ cumulativeByYear: [{ year: 1, cumulative: -60000 }, { year: 2, cumulative: -25000 }], paybackYear: null }, 30000);
  assert.equal(r.cumulativeByYear[0].cumulative, -60000);
  assert.equal(r.cumulativeByYear[1].cumulative, 5000);
  assert.equal(r.paybackYear, 2);
});
test("large nonprofit new construction needs domestic compliance or an exception for direct pay", () => {
  const input = { ...base, propertyType: "non-profit", systemKw: 1000 };
  assert.equal(calculate(input).creditUsd, 0);
  assert.equal(calculate({ ...input, options: { electivePayException: true } }).creditUsd, 30000);
  assert.equal(calculate({ ...input, options: { domesticContent: true } }).creditUsd, 40000);
});
test("small nonprofit is exempt from direct-pay domestic-content reduction", () => {
  assert.equal(calculate({ ...base, propertyType: "non-profit", systemKw: 999 }).creditUsd, 30000);
});
test("commercial VoS bonuses update returns without changing loan principal", () => {
  const site = { maxPanels: 200, panelCapacityWatts: 500, sunshineHours: 1600, propertyType: "commercial" };
  const plain = computeRecommendation(site, { systemKwOverride: 50, federalOptions: { eligible: false } });
  const bonus = computeRecommendation(site, { systemKwOverride: 50, federalOptions: { lowIncome: true, domesticContent: true } });
  assert.ok(plain && bonus);
  if (!plain || !bonus) throw new Error("Expected recommendations");
  const opts = { annualUsageKwh: 100000, productionPerKw: 1376, isSSO: false, loanTermYears: 20, loanInterestRate: 0.06 };
  const a = buildProgramFinancials(plain, opts), b = buildProgramFinancials(bonus, opts);
  assert.equal(b.thirtyYear.annualLoanPayment, a.thirtyYear.annualLoanPayment);
  assert.equal(b.thirtyYear.cumulativeByYear[0].cumulative, a.thirtyYear.cumulativeByYear[0].cumulative);
  assert.equal(b.thirtyYear.cumulativeByYear[1].cumulative - a.thirtyYear.cumulativeByYear[1].cumulative, 46250);
});
test("SSO pro forma bonuses change year-2 credit and half-credit depreciation basis", () => {
  const base = buildSsoProForma(100), bonus = buildSsoProForma(100, { lowIncome: true, domesticContent: true });
  assert.equal(base.itcUsd, 55500);
  assert.equal(bonus.itcUsd, 92500);
  assert.equal(bonus.depreciationCreditUsd, (185000 - 92500 / 2) * 0.21);
  assert.ok(bonus.rows[1].incentives > base.rows[1].incentives);
});