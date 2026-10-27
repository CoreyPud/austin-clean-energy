import { test } from "node:test";
import assert from "node:assert/strict";
import { ssoRate } from "./solar-model.ts";
import { ssoRateForYear } from "./sso-proforma.ts";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test("Standard Offer holds 11 cents flat for years 1-10", () => {
  assert.equal(ssoRate(100, 1), 0.11);
  assert.equal(ssoRate(100, 10), 0.11);
});

test("Standard Offer rises 0.05% per year after year 10", () => {
  close(ssoRate(100, 11), 0.11 * 1.0005);
  close(ssoRateForYear(0.11, 20), 0.11 * Math.pow(1.0005, 10));
});
