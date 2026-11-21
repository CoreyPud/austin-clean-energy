import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_MIN_ROOF_SEGMENT_M2,
  applySolarFilters,
  filterPanelsByRoofSegmentArea,
  type SolarPanel,
} from "./solar-filters.ts";

const panel = (segmentIndex: number): SolarPanel => ({
  lat: 30.25 + segmentIndex / 1000,
  lon: -97.75,
  orientation: "PORTRAIT",
  yearlyEnergyDcKwh: 700,
  segmentIndex,
});

const panels = [panel(0), panel(1), panel(2)];
const areas = {
  0: COMMERCIAL_MIN_ROOF_SEGMENT_M2 - 0.000001,
  1: COMMERCIAL_MIN_ROOF_SEGMENT_M2,
  2: COMMERCIAL_MIN_ROOF_SEGMENT_M2 + 10,
};

test("commercial arrays exclude surfaces below 2,000 square feet and keep the exact threshold", () => {
  assert.deepEqual(filterPanelsByRoofSegmentArea(panels, "commercial", areas).map(p => p.segmentIndex), [1, 2]);
  assert.deepEqual(applySolarFilters(panels, { propertyType: "non-profit", segmentAreas: areas }).panels.map(p => p.segmentIndex), [1, 2]);
});

test("the 2,000-square-foot minimum applies to nonprofit and multifamily properties", () => {
  for (const propertyType of ["non-profit", "multi-family", "multifamily"]) {
    assert.deepEqual(filterPanelsByRoofSegmentArea(panels, propertyType, areas).map(p => p.segmentIndex), [1, 2]);
  }
});

test("residential arrays and surfaces with unknown area are not removed by the commercial minimum", () => {
  assert.deepEqual(filterPanelsByRoofSegmentArea(panels, "single-family", areas), panels);
  assert.deepEqual(filterPanelsByRoofSegmentArea(panels, "commercial", {}).map(p => p.segmentIndex), [0, 1, 2]);
});
