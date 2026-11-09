import { describe, it } from "node:test";
import assert from "node:assert/strict";
const close = (a: number, b: number, d: number) => assert.ok(Math.abs(a - b) < 0.5 * 10 ** -d, `${a} !~ ${b}`);
import { calculate, defaultsFor, utilityView } from "./model";

describe("Peak Savings Calculator test cases", () => {
  it("lighting defaults", () => {
    const r = calculate(defaultsFor("lighting"));
    assert.equal(Math.round(r.year1Net), 3461);
    close(r.irr! * 100, 101.8, -0.3);
    assert.equal(r.payback, 2);
    assert.ok(Math.abs(r.npv - 26500) < 300);
  });
  it("HVAC defaults", () => {
    const r = calculate(defaultsFor("hvac"));
    assert.equal(Math.round(r.year1Net), 2094);
    close(r.irr! * 100, 25.0, -0.3);
    assert.equal(r.payback, 5);
    assert.ok(Math.abs(r.npv - 12300) < 300);
  });
  it("battery, I buy it", () => {
    const r = calculate(defaultsFor("battery"));
    close(r.netCost, 72800, 0);
    assert.equal(Math.round(r.year1Net), 2508);
    assert.equal(r.payback, null);
    close(r.irr! * 100, -9.4, -0.3);
  });
  it("utility view defaults", () => {
    const u = utilityView(1000, 65, 6, 500000);
    close(u.annual, 68900, 0);
    close(u.perCustomer, 0.14, 2);
  });
});
