import { test } from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_URL_RENAMES, renamedPublicUrl } from "./public-url-renames.ts";

test("ATB Options uses the requested clean energy technology database URL", () => {
  assert.equal(renamedPublicUrl("/atb-options"), "/clean-energy-technology-database");
});

test("all eight existing public links redirect to their replacement with parameters and anchors intact", () => {
  assert.equal(Object.keys(PUBLIC_URL_RENAMES).length, 8);
  for (const [oldPath, newPath] of Object.entries(PUBLIC_URL_RENAMES)) {
    assert.equal(renamedPublicUrl(oldPath, "?year=2030", "#sources"), `${newPath}?year=2030#sources`);
    assert.equal(renamedPublicUrl(`${oldPath}/`, "?year=2030", "#sources"), `${newPath}?year=2030#sources`);
    assert.equal(renamedPublicUrl(newPath), null);
  }
});

test("unrelated public routes are not redirected", () => {
  assert.equal(renamedPublicUrl("/property-assessment", "?address=Austin"), null);
  assert.equal(renamedPublicUrl("/"), null);
});