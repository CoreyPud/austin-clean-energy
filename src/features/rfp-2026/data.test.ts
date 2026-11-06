import { describe, expect, it } from "bun:test";
import { filterSites, filtersFromParams, filtersToParams, parseSites, siteStats, DEFAULT_FILTERS } from "./data";

const csv = `category,name,address,zip,lat,lon,solar_kw,detail,approx,zip_gwh,zip_rank,high_growth,priority
Commercial rooftop with solar potential,Roof,1 A ST,78701,30.2,-97.7,500,,True,180,1,True,4
Existing commercial solar,Small,2 B ST,78702,30.2,-97.7,50,,False,20,20,False,2
Existing commercial solar,Big,3 C ST,78701,30.2,-97.7,80,,False,180,1,True,1
Existing commercial solar,Low,4 D ST,78703,30.2,-97.7,100,,False,90,5,True,1`;

describe("rfp 2026 site ranking", () => {
  const sites = parseSites(csv);
  it("sorts by priority, then ZIP new load, then solar kW", () => {
    expect(filterSites(sites, DEFAULT_FILTERS).map((s) => s.name)).toEqual(["Big", "Low", "Small", "Roof"]);
  });
  it("battery MW is solar MW times the ratio; existing solar is priorities 1 and 2", () => {
    const s = siteStats(sites, 0.5);
    expect(s.solarMw).toBeCloseTo(0.73);
    expect(s.batteryMw).toBeCloseTo(0.365);
    expect(s.existingCount).toBe(3);
    expect(s.existingBatteryMw).toBeCloseTo(0.115);
  });
  it("top-growth and minimum size filters", () => {
    expect(filterSites(sites, { ...DEFAULT_FILTERS, highOnly: true, minKw: 90 }).map((s) => s.name)).toEqual(["Low", "Roof"]);
  });
  it("filters round-trip through the URL", () => {
    const f = { ...DEFAULT_FILTERS, priorities: [1, 3] as const as never, zip: "78701", ratio: 0.75 };
    expect(filtersFromParams(filtersToParams(f, new URLSearchParams()))).toEqual(f);
  });
});
