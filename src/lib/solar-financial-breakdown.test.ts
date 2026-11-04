import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRecommendation, buildProgramFinancials } from "./property-solar";
import { buildSolarFinancialBreakdown } from "./solar-financial-breakdown";
import { austinEnergyRebate, businessSolarIncentive, commercialPbiRate } from "./solar-model";

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
test("nonprofit selects CBI below 200 kW AC and PBI at or above 200 kW AC", () => {
  assert.equal(businessSolarIncentive("non-profit", 199.9), "cbi");
  assert.equal(businessSolarIncentive("non-profit", 200), "pbi");
  assert.equal(businessSolarIncentive("non-profit", 250), "pbi");
});
test("commercial retains a distinct 100 kW AC threshold", () => {
  assert.equal(businessSolarIncentive("commercial", 99.9), "cbi");
  assert.equal(businessSolarIncentive("commercial", 100), "pbi");
});
test("calculator uses AC eligibility but DC watts for nonprofit CBI", () => {
  const { rec, model } = scenario("non-profit", 240);
  assert.equal(rec.pbiEligible, false); // 199.2 kW AC
  assert.equal(model.cbi, 240000);
  assert.equal(model.rebate, 240000);
  assert.equal(model.initialCash, 240000);
  assert.equal(model.rows.reduce((sum, row) => sum + row.programPayment, 0), 0);
  assert.equal(austinEnergyRebate(242, "non-profit"), 0); // 200.86 kW AC
});
test("nonprofit above 200 kW AC gets five PBI years with no upfront CBI for cash and financing", () => {
  for (const financed of [false, true]) {
    const { rec, model, financials } = scenario("non-profit", 250, false, financed);
    assert.equal(rec.pbiEligible, true);
    assert.equal(model.cbi, 0);
    assert.equal(model.rebate, 0);
    assert.equal(model.rows[0].programPayment, 38700);
    assert.ok(model.rows[4].programPayment > 0);
    assert.equal(model.rows[5].programPayment, 0);
    assert.equal(model.loanPrincipal, financed ? 500000 : 0);
    let cumulative = -model.initialCash;
    for (const row of model.rows) {
      cumulative += row.netCashFlow ?? 0;
      assert.ok(Math.abs(cumulative - (row.cumulative ?? 0)) <= 0.51);
    }
    assert.equal(model.rows[24].cumulative, financials.net25);
  }
});
test("PBI rate tiers use AC size while production remains DC-based", () => {
  assert.equal(commercialPbiRate(400), 0.10); // 332 kW AC
  assert.equal(commercialPbiRate(482), 0.08); // 400.06 kW AC
  assert.equal(commercialPbiRate(1205), 0.06); // 1000.15 kW AC
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