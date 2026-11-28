import { test } from "node:test";
import assert from "node:assert/strict";
import { readSiteNotes, siteFolder, validateSiteFile } from "./site-intake-model";

const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const property = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
test("site files are isolated by both property and owner", () => {
  assert.equal(siteFolder(owner, property, "roof"), `${owner}/${property}/roof`);
  assert.notEqual(siteFolder(owner, property, "roof"), siteFolder(owner, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "roof"));
  assert.notEqual(siteFolder(owner, property, "roof"), siteFolder("dddddddd-dddd-4ddd-8ddd-dddddddddddd", property, "roof"));
  assert.throws(() => siteFolder(owner, "../other-property", "roof"));
});
test("site notes retain all five requested categories independently", () => {
  assert.deepEqual(readSiteNotes({ meter: "north wall", roof: "metal", transformer: "480V", bill: "tenant pays", other: "locked gate" }), { meter: "north wall", roof: "metal", transformer: "480V", bill: "tenant pays", other: "locked gate" });
  assert.equal(readSiteNotes({ roof: 123 }).roof, "");
});
test("uploads allow photos and bills but reject unsupported and oversized files", () => {
  assert.equal(validateSiteFile({ type: "application/pdf", size: 1024 }), null);
  assert.equal(validateSiteFile({ type: "image/jpeg", size: 20 * 1024 * 1024 }), null);
  assert.ok(validateSiteFile({ type: "image/jpeg", size: 20 * 1024 * 1024 + 1 }));
  assert.ok(validateSiteFile({ type: "text/html", size: 1024 }));
  assert.ok(validateSiteFile({ type: "image/jpeg", size: 0 }));
});