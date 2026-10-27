import { describe, it, expect } from "vitest";
import { ssoRate } from "./solar-model";
import { ssoRateForYear } from "./sso-proforma";

describe("Standard Offer rate schedule", () => {
  it("holds 11 cents flat for years 1-10", () => {
    expect(ssoRate(100, 1)).toBe(0.11);
    expect(ssoRate(100, 10)).toBe(0.11);
  });
  it("rises 0.05% per year after year 10", () => {
    expect(ssoRate(100, 11)).toBeCloseTo(0.11 * 1.0005, 10);
    expect(ssoRateForYear(0.11, 20)).toBeCloseTo(0.11 * Math.pow(1.0005, 10), 10);
  });
});
