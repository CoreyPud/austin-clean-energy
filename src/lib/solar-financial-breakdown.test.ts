import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRecommendation, buildProgramFinancials } from "./property-solar";
import { buildSolarFinancialBreakdown } from "./solar-financial-breakdown";

function scenario(propertyType: string, size = 10, isSSO = false, financed = false) {
  const rec = computeRecommendation({ maxPanels: 1000, panelCapacityWatts: 400, sunshineHours: 1800, propertyType }, {
    systemKwOverride: size, costPerWOverride: 2, billingMode: isSSO ? "sso" : "vos",
  });
  if (!rec) throw new Error("Missing recommendation");
  const options = { annualUsageKwh: 500000, productionPerKw: 1548, isSSO, loanTermYears: financed ? 10 : 0, loanInterestRate: 0.06 };
  const financials = buildProgramFinancials(rec, options);
  return { rec, financials, model: buildSolarFinancialBreakdown(rec, options, financials) };
}

for (const type of ["single-family", "condo", "commercial", "non-profit", "multi-family"]) {
  for (const financed of [false, true]) {
    test(`${type} ${financed ? "financed" : "cash"} has exactly 25 annual rows`, () => {
      const { model } = scenario(type, 10, false, financed);
      assert.equal(model.rows.length, 25);
      assert.equal(model.rows[0].year, 1);
      assert.equal(model.rows[24].year, 25);
    });
  }
}
test("cash and financed owner cash flows reconcile with the assessment chart", () => {
  for (const type of ["single-family", "condo", "commercial", "non-profit"]) {
    for (const size of [10, 150]) for (const financed of [false, true]) {
      const { financials, model } = scenario(type, size, false, financed);
      let cumulative = -model.initialCash;
      for (const row of model.rows) {
        cumulative += row.netCashFlow ?? 0;
        assert.ok(Math.abs(cumulative - (row.cumulative ?? 0)) <= 0.51);
      }
      assert.equal(model.rows[24].cumulative, financials.net25);
    }
  }
});
test("residential rebate reduces upfront cost once and never supplies a federal credit", () => {
  const { model } = scenario("single-family");
  assert.equal(model.rebate, 4000);
  assert.equal(model.initialCash, 16000);
  assert.equal(model.rows.reduce((sum, row) => sum + row.federalReceipt, 0), 0);
});
test("financing keeps the full post-utility-rebate principal and stops payments after the term", () => {
  const { model } = scenario("commercial", 10, false, true);
  assert.equal(model.loanPrincipal, 13000);
  assert.equal(model.initialCash, 0);
  assert.equal(model.rows[0].federalReceipt, 0);
  assert.equal(model.rows[1].federalReceipt, 6000);
  assert.ok(model.rows[9].loanPayment > 0);
  assert.equal(model.rows[10].loanPayment, 0);
});
test("commercial PBI is separate from bill savings and stops after year 5", () => {
  const { model } = scenario("commercial", 150);
  assert.equal(model.rebate, 0);
  assert.ok(model.rows[4].programPayment > 0);
  assert.equal(model.rows[5].programPayment, 0);
});
test("multifamily credits are tenant benefits, not owner cash flows", () => {
  const { model } = scenario("multi-family", 100);
  assert.equal(model.tenantCredits, true);
  assert.ok(Math.abs(model.rows[0].benefit - 19938.24) < 0.001);
  assert.equal(model.rows[0].netCashFlow, null);
  assert.equal(model.rows[24].cumulative, null);
});
test("Standard Offer owner rows reconcile for commercial, nonprofit and multifamily", () => {
  for (const type of ["commercial", "non-profit", "multi-family"]) {
    const { model, financials } = scenario(type, 150, true);
    let cumulative = -model.initialCash;
    for (const row of model.rows) {
      cumulative += row.netCashFlow ?? 0;
      assert.ok(Math.abs(cumulative - (row.cumulative ?? 0)) <= 0.51);
    }
    assert.equal(model.rebate, 0);
    assert.equal(model.rows[24].cumulative, financials.net25);
    assert.ok(model.rows[13].inverter > 0);
    assert.equal(model.rows[14].inverter, 0);
  }
});