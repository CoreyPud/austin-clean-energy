import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommercialCards } from "./commercial-energy-plan.ts";

const base = { role: "owner", roofType: "flat", insulation: "poor", roofSurface: "dark", windows: "single", roofSqFt: 10000, windowSqFt: 1000 } as const;

test("insulation rebate is $1.00/sq ft", () => {
  const c = buildCommercialCards(base).find(c => c.id === "insulation");
  assert.match(c.summary, /\$10,000/);
});
test("reflective roof rebate is $0.25/sq ft", () => {
  const c = buildCommercialCards(base).find(c => c.id === "roof");
  assert.match(c.summary, /\$2,500/);
});
test("window rebate is up to $2.25/sq ft", () => {
  const c = buildCommercialCards(base).find(c => c.id === "windows");
  assert.match(c.summary, /\$2,250/);
});
test("pitched roofs skip reflective coating", () => {
  assert.equal(buildCommercialCards({ ...base, roofType: "pitched" }).some(c => c.id === "roof"), false);
});
