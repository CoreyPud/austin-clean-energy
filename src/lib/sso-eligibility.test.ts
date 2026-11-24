import { test } from "node:test";
import assert from "node:assert/strict";
import { isSsoEligible, computeRecommendation, buildSolarSummary, SSO_DEFAULT_SIZE_FACTOR } from "./property-solar";
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
  assert.equal(rec.recommendedKw, 60);
  const summary = buildSolarSummary(rec, "multifamily", { annualUsageKwh: 12000, productionPerKw: 1376, isSSO: true });
  assert.equal(summary.annualSavingsUsd, 9082);
  assert.equal(summary.tenantCreditsUsd, null);
  assert.equal(summary.austinEnergyRebateUsd, 0);
});

test("Standard Offer defaults to 60% of buildable roof capacity and allows manual override up to 100%", () => {
  assert.equal(SSO_DEFAULT_SIZE_FACTOR, 0.6);
  const site = { maxPanels: 500, panelCapacityWatts: 400, sunshineHours: 1600, propertyType: "commercial" };
  const ssoDefault = computeRecommendation(site, { billingMode: "sso" });
  assert.equal(ssoDefault?.maxKw, 200);
  assert.equal(ssoDefault?.recommendedKw, 120);
  const ssoExpanded = computeRecommendation(site, { billingMode: "sso", systemKwOverride: 180 });
  assert.equal(ssoExpanded?.recommendedKw, 180);
});