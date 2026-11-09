import { describe, it } from "node:test";
import assert from "node:assert/strict";
const close = (a: number, b: number, d: number) => assert.ok(Math.abs(a - b) < 0.5 * 10 ** -d, `${a} !~ ${b}`);
import { results, timeLabel, type BuildingType } from "./model";

const flat = (n: number, v: number) => Array(n).fill(v);
const b: BuildingType = {
  name: "Test", buildings_100kw_plus: 1, median_peak_kw: 200, summer_peak_hours: [], peak_day: "2012-06-26",
  base: { peak_day: flat(96, 100), summer_weekday: flat(96, 80), monthly_peak: flat(12, 100), annual_kwh_per_100kw: 400000 },
  scen: { "10_perfect": { peak_day: flat(96, 90), summer_weekday: flat(96, 80), monthly_peak: flat(12, 90) } },
};

describe("load curve results", () => {
  it("scales by peak and prices each month at the demand charge", () => {
    const r = results(b, 200, 10, "perfect", 15.35);
    assert.equal(r.peakBefore, 200);
    assert.equal(r.peakAfter, 180);
    close(r.annualSavings, 20 * 15.35 * 12, 6);
    assert.equal(r.batteryKw, 20);
    assert.equal(r.batteryKwh, 40);
  });
  it("index 68 is 5:00 pm", () => {
    assert.equal(timeLabel(68), "5:00 pm");
  });
});
