import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterSites, filtersFromParams, filtersToParams, parseSites, parseSubstations, nearestSubstation, siteStats, DEFAULT_FILTERS, batteryEstimate, hasDistinctSiteName, siteDisplayName } from "./data";

const csv = `category,name,address,zip,lat,lon,solar_kw,detail,approx,zip_gwh,zip_rank,high_growth,priority
Commercial rooftop with solar potential,Roof,1 A ST,78701,30.2,-97.7,500,,True,180,1,True,4
Existing commercial solar,Small,2 B ST,78702,30.2,-97.7,50,,False,20,20,False,2
Existing commercial solar,Big,3 C ST,78701,30.2,-97.7,80,,False,180,1,True,1
Existing commercial solar,Low,4 D ST,78703,30.2,-97.7,100,,False,90,5,True,1`;

describe("rfp 2026 site ranking", () => {
  const sites = parseSites(csv);
  it("sorts by priority, then ZIP new load, then solar kW", () => {
    assert.deepEqual(filterSites(sites, DEFAULT_FILTERS).map((s) => s.name), ["Big", "Low", "Small", "Roof"]);
  });
  it("battery MW is solar MW times the ratio; existing solar is priorities 1 and 2", () => {
    const s = siteStats(sites, 0.5);
    assert.ok(Math.abs(s.solarMw - 0.73) < 1e-6);
    assert.ok(Math.abs(s.batteryMw - 0.365) < 1e-6);
    assert.equal(s.existingCount, 3);
    assert.ok(Math.abs(s.existingBatteryMw - 0.115) < 1e-6);
  });
  it("top-growth and minimum size filters", () => {
    assert.deepEqual(filterSites(sites, { ...DEFAULT_FILTERS, highOnly: true, minKw: 90 }).map((s) => s.name), ["Low", "Roof"]);
  });
  it("filters round-trip through the URL", () => {
    const f = { ...DEFAULT_FILTERS, priorities: [1, 3] as const as never, zip: "78701", ratio: 0.75 };
    assert.deepEqual(filtersFromParams(filtersToParams(f, new URLSearchParams())), f);
  });
});

describe("substation screening", () => {
  it("preserves all 20 supplied voltage/bus records without asserting surveyed locations or capacity", () => {
    const subs = parseSubstations(readFileSync("public/data/substations.csv", "utf8"));
    assert.equal(subs?.length, 20);
    assert.ok(subs?.every((s) => s.voltageKv === 138 && s.capacityKva === null && s.approx));
    const elroy = subs?.find((s) => s.name === "ELROY");
    assert.equal(elroy?.buses, "ELROY138Z");
    assert.equal(elroy?.zipGuesses, "78617");
    assert.equal(elroy?.lat, 30.163577625);
    assert.equal(subs?.find((s) => s.name === "LAKEWAY")?.positionMethod, "Mean of supplied candidate-site coordinates in guessed ZIPs (no ZIP centers available)");
  });
  it("keeps unknown voltage and capacity unreported and rejects invalid coordinates", () => {
    const subs = parseSubstations("name,voltage_kv,capacity_kva,lat,lon\nUnknown,,,30.3,-97.7\nKnown,138,50000,30.4,-97.8\nInvalid,138,50000,999,-97.7");
    assert.equal(subs?.length, 2);
    assert.equal(subs?.[0].voltageKv, null);
    assert.equal(subs?.[0].capacityKva, null);
    assert.equal(subs?.[1].capacityKva, 50000);
    assert.equal(parseSubstations("<html>Not a CSV</html>"), null);
  });
  it("finds the closest location rather than the first row", () => {
    const subs = parseSubstations("name,voltage_kv,capacity_kva,lat,lon\nFar,,,30.4,-97.7\nNear,,,30.3,-97.7");
    const result = nearestSubstation({ lat: 30.3, lon: -97.7 }, subs);
    assert.equal(result?.sub.name, "Near");
    assert.equal(result?.km, 0);
    assert.equal(nearestSubstation({ lat: 30.3, lon: -97.7 }, null), null);
  });
});

test("site labels avoid duplicate addresses and replace unnamed placeholders", () => {
  assert.equal(siteDisplayName({ name: "Unnamed", address: "1901 E Ben White Blvd" }), "1901 E Ben White Blvd");
  assert.equal(hasDistinctSiteName({ name: "Unnamed", address: "1901 E Ben White Blvd" }), false);
  assert.equal(hasDistinctSiteName({ name: "904 WEST AVE", address: "904 WEST AVE" }), false);
  assert.equal(siteDisplayName({ name: "Austin Church", address: "1 Main St" }), "Austin Church");
  assert.equal(hasDistinctSiteName({ name: "Austin Church", address: "1 Main St" }), true);
});

test("battery energy = solar kW x ratio x duration hours", () => {
  const e = batteryEstimate(200, 0.5, 4);
  assert.equal(e.kw, 100);
  assert.equal(e.kwh, 400);
  assert.equal(filtersFromParams(new URLSearchParams("h=4")).hours, 4);
  assert.equal(filtersFromParams(new URLSearchParams("h=3")).hours, 2);
});
