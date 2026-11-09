import { describe, it, expect } from "vitest";
import { calculate, defaultsFor, utilityView } from "./model";

describe("Peak Savings Calculator test cases", () => {
  it("lighting defaults", () => {
    const r = calculate(defaultsFor("lighting"));
    expect(Math.round(r.year1Net)).toBe(3461);
    expect(r.irr! * 100).toBeCloseTo(101.8, 0);
    expect(r.payback).toBe(2);
    expect(Math.abs(r.npv - 26500)).toBeLessThan(300);
  });
  it("HVAC defaults", () => {
    const r = calculate(defaultsFor("hvac"));
    expect(Math.round(r.year1Net)).toBe(2094);
    expect(r.irr! * 100).toBeCloseTo(25.0, 0);
    expect(r.payback).toBe(5);
    expect(Math.abs(r.npv - 12300)).toBeLessThan(300);
  });
  it("battery, I buy it", () => {
    const r = calculate(defaultsFor("battery"));
    expect(r.netCost).toBeCloseTo(72800, 0);
    expect(Math.round(r.year1Net)).toBe(2508);
    expect(r.payback).toBeNull();
    expect(r.irr! * 100).toBeCloseTo(-9.4, 0);
  });
  it("utility view defaults", () => {
    const u = utilityView(1000, 65, 6, 500000);
    expect(u.annual).toBeCloseTo(68900, 0);
    expect(u.perCustomer).toBeCloseTo(0.14, 2);
  });
});
