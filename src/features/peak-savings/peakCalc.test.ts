import { describe, expect, test } from "bun:test";
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

describe("battery peak-saving designs", () => {
  test("Design 1 defaults keep year-1 net savings at $2,508 and do not pay back", () => {
    const result = run(batteryDefaults);
    expect(Math.round(result.y1Net)).toBe(2508);
    expect(result.payback).toBeNull();
  });

  test("Design 2 defaults retain 67% of owner peak reduction and pay $6,890 yearly", () => {
    const terms = design2Terms(100, 50, 67, 100, 68.9);
    expect(terms.ownerKw).toBeCloseTo(33.5);
    expect(terms.payment).toBeCloseTo(6890);
  });

  test("Design 2 defaults produce the documented payback, IRR and NPV", () => {
    const terms = design2Terms(100, 50, 67, 100, 68.9);
    const result = run({ ...batteryDefaults, kw: terms.ownerKw, extraIncome: terms.payment });
    expect(Math.round(result.y1Net)).toBe(7118);
    expect(result.payback).toBe(13);
    expect(result.irr).not.toBeNull();
    expect((result.irr as number) * 100).toBeCloseTo(2.3, 1);
    expect(Math.round(result.npv)).toBe(-21642);
  });
});
