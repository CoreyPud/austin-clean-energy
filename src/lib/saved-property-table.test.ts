import { test } from "node:test";
import assert from "node:assert/strict";
import { savedPropertyMetrics, selectSavedProperties, withSavedLowIncome } from "./saved-property-table";

const row = (address: string, property_type = "commercial") => ({ address, property_type, updated_at: "2026-10-27", calculator_state: { billingMode: "sso", maxFit: true, costPerW: 2 }, results: { solarInsights: { maxPanels: 500, panelCapacityWatts: 400, sunshineHours: 1800 } } });
test("saved low-income adds ten percentage points to commercial ITC and preserves other inputs", () => {
  const original = row("100 Main St");
  const state = { ...original.calculator_state, federalOptions: { eligible: true, domesticContent: true } };
  const updated = { ...original, calculator_state: withSavedLowIncome(state, true) };
  assert.equal(savedPropertyMetrics({ ...original, calculator_state: state }).creditUsd, 160000);
  assert.equal(savedPropertyMetrics(updated).creditUsd, 200000);
  assert.equal(updated.calculator_state.costPerW, 2);
  assert.equal(updated.calculator_state.federalOptions.domesticContent, true);
});
test("saved residential properties never receive a low-income ITC", () => {
  const residential = row("100 Home St", "single-family");
  const metrics = savedPropertyMetrics({ ...residential, calculator_state: withSavedLowIncome(residential.calculator_state, true) });
  assert.equal(metrics.canSetLowIncome, false);
  assert.equal(metrics.creditUsd, null);
  assert.equal(metrics.ssoKw, null);
});
test("Standard Offer size uses maximum roof fit even when saved VoS size is smaller", () => {
  const property = row("100 Main St");
  const metrics = savedPropertyMetrics({ ...property, calculator_state: { billingMode: "vos", systemKw: 50 } });
  assert.equal(metrics.systemKw, 50);
  assert.equal(metrics.ssoKw, 200);
});
test("address search, property-type filtering, and ascending/descending sorting work together", () => {
  const rows = [row("200 Main St"), row("100 Main St"), row("50 Main St", "single-family"), row("300 Other St")];
  assert.deepEqual(selectSavedProperties(rows, " MAIN ", "Commercial", "address", true).map(r => r.address), ["100 Main St", "200 Main St"]);
  assert.deepEqual(selectSavedProperties(rows, "main", "Commercial", "address", false).map(r => r.address), ["200 Main St", "100 Main St"]);
});