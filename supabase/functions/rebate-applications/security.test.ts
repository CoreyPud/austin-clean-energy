import { test } from "node:test";
import assert from "node:assert/strict";
import { canAdminAccess, csvCell, encryptDetails, decryptDetails, reviewComplete, validateDetails } from "./security.ts";
const details = { customer_name: "Synthetic applicant", service_address: "Synthetic address", account_number: "00123", email: "test@example.invalid", phone: "", project_description: "Solar project", months: [{ label: "Jan", kwh: 400 }], source: "table" };
test("private draft has no admin access", () => assert.equal(canAdminAccess({ status: "draft", consent_at: null }), false));
test("review requires affirmative consent", () => assert.equal(canAdminAccess({ status: "review_requested", consent_at: null }), false));
test("authorized review allows admin access", () => assert.equal(canAdminAccess({ status: "review_requested", consent_at: "2026-10-31" }), true));
test("application review requires account number", () => assert.equal(reviewComplete({ ...details, account_number: "" }), false));
test("invalid usage is rejected", () => assert.throws(() => validateDetails({ ...details, months: [{ label: "Jan", kwh: -1 }] })));
test("solar fields survive encrypted private storage", async () => { const input = validateDetails({ ...details, system_kw_dc: 120, system_kw_ac: 99, installed_cost: 240000, annual_production_kwh: 180000, contractor_name: "Test contractor" }); const payload = await encryptDetails(input, "test-key", "app:owner"); assert.equal((await decryptDetails(payload, "test-key", "app:owner")).annual_production_kwh, 180000); });
test("negative and nonfinite design amounts are rejected", () => { assert.throws(() => validateDetails({ ...details, installed_cost: -1 })); assert.throws(() => validateDetails({ ...details, system_kw_ac: Infinity })); });
test("CSV neutralizes spreadsheet commands and preserves leading zeros", () => { assert.equal(csvCell(" =1+1"), '"\' =1+1"'); assert.equal(csvCell("00123"), '"\'00123"'); });
test("encrypted details round-trip and cannot move between owners", async () => {
  const encrypted = await encryptDetails(details, "test-only-key", "app:owner");
  assert.equal(encrypted.includes(details.customer_name), false);
  assert.deepEqual(await decryptDetails(encrypted, "test-only-key", "app:owner"), details);
  await assert.rejects(decryptDetails(encrypted, "test-only-key", "app:other-owner"));
});