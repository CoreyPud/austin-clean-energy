import { test } from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_URL_RENAMES, renamedPublicUrl } from "./public-url-renames.ts";

test("ATB Options uses the requested clean energy technology database URL", () => {
  assert.equal(renamedPublicUrl("/atb-options"), "/clean-energy-technology-database");
});

test("all legacy public links redirect to their replacement with parameters and anchors intact", () => {
  assert.equal(Object.keys(PUBLIC_URL_RENAMES).length, 15);
  for (const [oldPath, newPath] of Object.entries(PUBLIC_URL_RENAMES)) {
    assert.equal(renamedPublicUrl(oldPath, "?year=2030", "#sources"), `${newPath}?year=2030#sources`);
    assert.equal(renamedPublicUrl(`${oldPath}/`, "?year=2030", "#sources"), `${newPath}?year=2030#sources`);
    assert.equal(renamedPublicUrl(newPath), null);
  }
});

test("Clean Canvas uses the clean energy ideas and actions URL", () => {
  assert.equal(renamedPublicUrl("/clean-canvas"), "/clean-energy-ideas-actions");
  assert.equal(renamedPublicUrl("/clean-canvas/", "?topic=Policy", "#idea-1"), "/clean-energy-ideas-actions?topic=Policy#idea-1");
});

test("unrelated public routes are not redirected", () => {
  assert.equal(renamedPublicUrl("/contact", "?address=Austin"), null);
  assert.equal(renamedPublicUrl("/"), null);
});
 test("assessment aliases preserve addresses, share tokens and anchors under the solar savings URL", () => {
  for (const path of ["/property-assessment", "/area-analysis", "/recommendations"]) {
    assert.equal(renamedPublicUrl(path, "?address=904%20WEST%20AVE&type=commercial", "#section-payback"), "/solar-savings-austin?address=904%20WEST%20AVE&type=commercial#section-payback");
    assert.equal(renamedPublicUrl(path, "?share=existing-token"), "/solar-savings-austin?share=existing-token");
  }
});
