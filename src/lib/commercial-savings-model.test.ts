import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSavingsModel,
  estimatePeakKw,
  COOLING_SHARE,
  MEASURE_COOLING_SAVINGS,
} from "./commercial-savings-model.ts";

const baseInputs = {
  annualKwh: 500_000,
  ratePerKwh: 0.11,
  demandChargePerKwMonth: 12,
  hoursPerWeek: 70,
  drCurtailKw: 20,
  drRatePerKwYear: 30,
  costs: { insulation: 25_000, reflectiveRoof: 12_000, windows: 30_000 },
  roofSqFt: 10_000,
  windowSqFt: 1_000,
  applicable: { insulation: true, reflectiveRoof: true, windows: "single" as const },
};

test("peak kW estimate uses operating hours", () => {
  // 500,000 kWh / (70 × 52 hrs) ≈ 137.4 kW
  assert.equal(Math.round(estimatePeakKw(500_000, 70) * 10) / 10, 137.4);
});

test("demand response is always first and has no capital cost", () => {
  const results = buildSavingsModel(baseInputs);
  assert.equal(results[0].id, "demand-response");
  assert.equal(results[0].installedCostUsd, 0);
  assert.equal(results[0].paybackYears, null);
});

test("demand response payment = kW × $/kW-yr plus half-year demand relief", () => {
  const dr = buildSavingsModel(baseInputs)[0];
  // 20 kW × $30 = $600 program payment; 20 × $12 × 12 × 0.5 = $1,440 demand relief
  assert.equal(dr.annualSavingsUsd, 600 + 1440);
});

test("insulation saves 8% of cooling kWh and nets the $1/sq ft rebate", () => {
  const ins = buildSavingsModel(baseInputs).find((r) => r.id === "insulation")!;
  const expectedKwh = 500_000 * COOLING_SHARE * MEASURE_COOLING_SAVINGS.insulation;
  assert.equal(ins.annualKwhSaved, Math.round(expectedKwh));
  assert.equal(ins.rebateUsd, 10_000);
  assert.equal(ins.netCostUsd, 25_000 - 10_000);
});

test("payback = net cost / annual savings", () => {
  const ins = buildSavingsModel(baseInputs).find((r) => r.id === "insulation")!;
  assert.ok(ins.paybackYears !== null);
  assert.equal(
    Math.round(ins.paybackYears! * 100) / 100,
    Math.round((ins.netCostUsd / ins.annualSavingsUsd) * 100) / 100,
  );
});

test("ten-year net = 10 × savings − net cost", () => {
  const roof = buildSavingsModel(baseInputs).find((r) => r.id === "reflective-roof")!;
  assert.equal(roof.tenYearNetUsd, roof.annualSavingsUsd * 10 - roof.netCostUsd);
});

test("single-pane windows save more than unshaded double-pane", () => {
  const single = buildSavingsModel(baseInputs).find((r) => r.id === "windows")!;
  const unshaded = buildSavingsModel({
    ...baseInputs,
    applicable: { ...baseInputs.applicable, windows: "unshaded" as const },
  }).find((r) => r.id === "windows")!;
  assert.ok(single.annualKwhSaved > unshaded.annualKwhSaved);
});

test("non-applicable measures are omitted", () => {
  const results = buildSavingsModel({
    ...baseInputs,
    applicable: { insulation: false, reflectiveRoof: false, windows: null },
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "demand-response");
});

test("insulation reduces annual electricity use and energy charges independently of rebates", () => {
  const result = buildSavingsModel({ ...baseInputs, demandChargePerKwMonth: 0 }).find((r) => r.id === "insulation");
  assert.ok(result);
  assert.equal(result.annualKwhSaved, 14_000);
  assert.equal(result.annualKwhAfter, 486_000);
  assert.equal(result.annualEnergySavingsUsd, 1_540);
  assert.equal(result.annualSavingsUsd, 1_540);
  assert.equal(result.paybackYears, 15_000 / 1_540);
  assert.equal(result.tenYearNetUsd, 400);
});

test("roof and windows reduce energy bills without counting rebates as annual savings", () => {
  const results = buildSavingsModel({ ...baseInputs, demandChargePerKwMonth: 0 });
  const roof = results.find((r) => r.id === "reflective-roof");
  const windows = results.find((r) => r.id === "windows");
  assert.ok(roof && windows);
  assert.equal(roof.annualKwhAfter, 473_750);
  assert.equal(roof.annualEnergySavingsUsd, 2_887.5);
  assert.equal(roof.annualSavingsUsd, 2_887.5);
  assert.equal(windows.annualKwhAfter, 465_000);
  assert.equal(windows.annualEnergySavingsUsd, 3_850);
  assert.equal(windows.annualSavingsUsd, 3_850);
});

test("demand response separates bill relief from program payments and does not claim annual kWh savings", () => {
  const dr = buildSavingsModel(baseInputs)[0];
  assert.equal(dr.annualKwhAfter, 500_000);
  assert.equal(dr.annualEnergySavingsUsd, 0);
  assert.equal(dr.annualDemandSavingsUsd, 1_440);
  assert.equal(dr.annualProgramPaymentUsd, 600);
  assert.equal(dr.annualSavingsUsd, 2_040);
});

test("improvement returns include energy plus demand-charge savings", () => {
  const insulation = buildSavingsModel(baseInputs).find((r) => r.id === "insulation");
  assert.ok(insulation);
  assert.equal(Math.round(insulation.annualDemandSavingsUsd * 100) / 100, 553.85);
  assert.equal(Math.round(insulation.annualSavingsUsd * 100) / 100, 2_093.85);
  assert.equal(insulation.annualProgramPaymentUsd, 0);
});
