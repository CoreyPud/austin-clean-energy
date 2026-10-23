import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildSupplyDemandScenario } from "./supply-demand-model";

describe("ERCOT forward supply-demand scenario", () => {
  test("covers every year from 2027 through 2045", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 80, annualSupplyChangeMw: 0, demandGrowthPct: 0 });
    assert.deepEqual(rows.map(row => row.year), Array.from({ length: 19 }, (_, i) => 2027 + i));
  });
  test("gap is supply minus demand, with positive and negative results", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 90, annualSupplyChangeMw: 0, demandGrowthPct: 10 });
    assert.ok(Math.abs((rows[0]?.gapMw ?? NaN) - 1) < 0.000001);
    assert.ok(Math.abs((rows[1]?.gapMw ?? NaN) + 8.9) < 0.000001);
  });
  test("compounds demand and adds net peak-hour supply from 2026", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 100, annualSupplyChangeMw: 5, demandGrowthPct: 10 });
    assert.equal(rows[1]?.supplyMw, 110);
    assert.ok(Math.abs((rows[1]?.demandMw ?? NaN) - 121) < 0.000001);
  });
  test("retirements cannot produce negative available supply", () => {
    assert.equal(buildSupplyDemandScenario({ supplyMw: 100, demandMw: 80, annualSupplyChangeMw: -200, demandGrowthPct: 0 })[0]?.supplyMw, 0);
  });
});