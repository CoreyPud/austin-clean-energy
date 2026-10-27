import { test } from "node:test";
import assert from "node:assert/strict";
import { isSsoEligible, computeRecommendation, buildSolarSummary } from "./property-solar";
import { SSO_MIN_KW } from "./solar-model";

test("Standard Offer includes nonprofit properties", () => {
  assert.equal(isSsoEligible({ maxKw: 100 }, "commercial", true), true);
});
test("Standard Offer includes multifamily properties", () => {
  assert.equal(isSsoEligible({ maxKw: 100 }, "multifamily", false), true);
});
test("Standard Offer preserves the size minimum and excludes homeowner systems", () => {
  assert.equal(isSsoEligible({ maxKw: SSO_MIN_KW - 0.1 }, "multifamily", false), false);
  assert.equal(isSsoEligible({ maxKw: SSO_MIN_KW }, "multifamily", false), true);
  assert.equal(isSsoEligible({ maxKw: 100 }, "residential", false), false);
});
test("multifamily Standard Offer returns owner revenue rather than tenant credits", () => {
  const rec = computeRecommendation({ maxPanels: 250, panelCapacityWatts: 400, sunshineHours: 1600, propertyType: "multi-family" }, { billingMode: "sso" });
  assert.ok(rec);
  if (!rec) return;
  const summary = buildSolarSummary(rec, "multifamily", { annualUsageKwh: 12000, productionPerKw: 1376, isSSO: true });
  assert.equal(summary.annualSavingsUsd, 15136);
  assert.equal(summary.tenantCreditsUsd, null);
  assert.equal(summary.austinEnergyRebateUsd, 0);
});