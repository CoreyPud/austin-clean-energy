import { describe, expect, test } from "bun:test";
import { buildSupplyDemandScenario } from "./supply-demand-model";

describe("ERCOT forward supply-demand scenario", () => {
  test("covers every year from 2027 through 2045", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 80, annualSupplyChangeMw: 0, demandGrowthPct: 0 });
    expect(rows.map(row => row.year)).toEqual(Array.from({ length: 19 }, (_, i) => 2027 + i));
  });
  test("gap is supply minus demand, with positive and negative results", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 90, annualSupplyChangeMw: 0, demandGrowthPct: 10 });
    expect(rows[0]?.gapMw).toBeCloseTo(1);
    expect(rows[1]?.gapMw).toBeCloseTo(-8.9);
  });
  test("compounds demand and adds net peak-hour supply from 2026", () => {
    const rows = buildSupplyDemandScenario({ supplyMw: 100, demandMw: 100, annualSupplyChangeMw: 5, demandGrowthPct: 10 });
    expect(rows[1]?.supplyMw).toBe(110);
    expect(rows[1]?.demandMw).toBeCloseTo(121);
  });
  test("retirements cannot produce negative available supply", () => {
    expect(buildSupplyDemandScenario({ supplyMw: 100, demandMw: 80, annualSupplyChangeMw: -200, demandGrowthPct: 0 })[0]?.supplyMw).toBe(0);
  });
});