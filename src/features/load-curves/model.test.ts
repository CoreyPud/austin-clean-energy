import { describe, it, expect } from "vitest";
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
    expect(r.peakBefore).toBe(200);
    expect(r.peakAfter).toBe(180);
    expect(r.annualSavings).toBeCloseTo(20 * 15.35 * 12, 6);
    expect(r.batteryKw).toBe(20);
    expect(r.batteryKwh).toBe(40);
  });
  it("index 68 is 5:00 pm", () => {
    expect(timeLabel(68)).toBe("5:00 pm");
  });
});
