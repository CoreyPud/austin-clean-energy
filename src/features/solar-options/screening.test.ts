import { test } from "node:test";
import assert from "node:assert/strict";
import { annualizeBillUsage, leaseIllustration, screenSolarOptions } from "./screening";

test("warehouse landlord whose tenants pay the bill screens to Standard Offer", () => {
  assert.equal(screenSolarOptions("commercial", "tenant", "own", true).option, "sso");
});
test("school paying its bill and seeking ownership screens to a loan", () => {
  assert.equal(screenSolarOptions("non-profit", "owner", "own", true).option, "loan");
});
test("company paying its bill and avoiding a loan screens to lease", () => {
  assert.equal(screenSolarOptions("commercial", "owner", "avoid-loan", true).option, "lease");
});
test("ineligible roof never screens to Standard Offer", () => {
  const result = screenSolarOptions("commercial", "tenant", "own", false);
  assert.equal(result.option, "loan");
  assert.equal(result.review, true);
});
test("residential homeowner does not screen to commercial lease or Standard Offer", () => {
  assert.equal(screenSolarOptions("single-family", "owner", "avoid-loan", false).option, "loan");
});
test("multifamily credits cannot be mistaken for landlord savings", () => {
  assert.equal(screenSolarOptions("multi-family", "owner", "own", true).option, "sso");
  assert.equal(screenSolarOptions("multi-family", "owner", "own", false).review, true);
});
test("no lease price produces no numeric placeholder result", () => {
  assert.equal(leaseIllustration(10000, null), null);
});
test("lease payment at 60 percent of $10000 savings leaves $4000, without adding rebates", () => {
  assert.deepEqual(leaseIllustration(10000, 60), { payment: 6000, retainedSavings: 4000 });
});
test("lease payment outside 0 to 100 percent is invalid", () => {
  assert.equal(leaseIllustration(10000, 101), null);
  assert.equal(leaseIllustration(10000, -1), null);
});
test("three months of bill usage annualize to 12000 kWh", () => {
  assert.equal(annualizeBillUsage([900, 1000, 1100]), 12000);
  assert.equal(annualizeBillUsage([]), null);
  assert.equal(annualizeBillUsage([-10]), null);
});