import { test } from "node:test";
import assert from "node:assert/strict";
import { sharePathFor, shareCodeFromSlug } from "./share-slug";

test("address link keeps address plus short code", () => {
  const p = sharePathFor("1211 E Oltorf St, Austin, TX 78704", "0e5863fc470e447c96db103fb26242c9");
  assert.equal(p, "/solar-savings-austin/1211-e-oltorf-st-austin-tx-78704-0e5863fc");
  assert.equal(shareCodeFromSlug(p.split("/").pop()), "0e5863fc");
});
test("slug without code is rejected", () => {
  assert.equal(shareCodeFromSlug("1211-e-oltorf-st-austin-tx-78704"), null);
});
