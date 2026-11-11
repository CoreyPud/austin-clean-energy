import { test } from "node:test";
import assert from "node:assert/strict";
import { design2Terms, run, type Inputs } from "./peakCalc";

const batteryDefaults: Inputs = {
  demandCharge: 10.32,
  regCharge: 5.03,
  energyRate: 0.0594,
  capturePct: 75,
  rateEscPct: 3,
  kw: 50,
  kwh: 0,
  upfront: 104000,
  rebate: 0,
  creditPct: 30,
  om: 4400,
  degPct: 2,
  life: 15,
  discPct: 8,
  omEscPct: 2.5,
};

test("Design 1 defaults keep year-1 net savings at $2,508 and do not pay back", () => {
  const result = run(batteryDefaults);
  assert.equal(Math.round(result.y1Net), 2508);
  assert.equal(result.payback, null);
});

test("Design 2 defaults retain 67% of owner peak reduction and pay $6,890 yearly", () => {
  const terms = design2Terms(100, 50, 67, 100, 68.9);
  assert.ok(Math.abs(terms.ownerKw - 33.5) < 1e-9);
  assert.ok(Math.abs(terms.payment - 6890) < 1e-9);
});

test("Design 2 defaults produce the documented payback, IRR and NPV", () => {
  const terms = design2Terms(100, 50, 67, 100, 68.9);
  const result = run({ ...batteryDefaults, kw: terms.ownerKw, extraIncome: terms.payment });
  assert.equal(Math.round(result.y1Net), 7118);
  assert.equal(result.payback, 13);
  assert.notEqual(result.irr, null);
  assert.ok(Math.abs((result.irr as number) * 100 - 2.3) < 0.05);
  assert.equal(Math.round(result.npv), -21642);
});
