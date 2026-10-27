import { test } from "node:test";
import assert from "node:assert/strict";
import { detectAssessmentPropertyType } from "./assessment-property-type";

test("address checks detect commercial properties using the street and ZIP", async () => {
  const type = await detectAssessmentPropertyType("1901 E Ben White Blvd, Austin, TX 78741, USA", async (match) => {
    assert.deepEqual(match, { pattern: "1901 E Ben White %", zip: "78741" });
    return [{ property_type: "commercial" }];
  });
  assert.equal(type, "commercial");
});
test("address checks recognize multifamily and nonprofit property types", async () => {
  for (const [dbType, expected] of [["multifamily", "multi-family"], ["non_profit", "non-profit"]]) {
    assert.equal(await detectAssessmentPropertyType("123 Main St, Austin, TX 78701", async () => [{ property_type: dbType }]), expected);
  }
});
test("ambiguous or missing TCAD matches do not assign a property type", async () => {
  for (const rows of [[], [{ property_type: "other" }], [{ property_type: "commercial" }, { property_type: "single_family" }]]) {
    assert.equal(await detectAssessmentPropertyType("123 Main St, Austin, TX 78701", async () => rows), null);
  }
});