import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUSTIN_REF_HRS,
  COMMERCIAL_MIN_ROOF_SEGMENT_M2,
  GOOGLE_PANEL_KW,
  TSRF_MIN,
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

test("panels below 80% TSRF are excluded and panels at 80% TSRF are kept", () => {
  assert.equal(TSRF_MIN, 0.8);
  const idealKwh = GOOGLE_PANEL_KW * AUSTIN_REF_HRS;
  const below: SolarPanel = { ...panel(1), yearlyEnergyDcKwh: idealKwh * 0.79 };
  const atMin: SolarPanel = { ...panel(2), yearlyEnergyDcKwh: idealKwh * 0.80 };
  const kept = applySolarFilters([below, atMin], { propertyType: "single-family" }).panels;
  assert.deepEqual(kept.map(p => p.segmentIndex), [2]);
});

test("commercial filter keeps panels on multiple separate campus buildings", () => {
  const buildGrid = (baseLat: number, baseLon: number, segmentIndex: number): SolarPanel[] => {
    const out: SolarPanel[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        out.push({
          lat: baseLat + r * 0.000018,
          lon: baseLon + c * 0.000012,
          orientation: "PORTRAIT",
          yearlyEnergyDcKwh: 700,
          segmentIndex,
        });
      }
    }
    return out;
  };
  // Two separate commercial roofs ~60 m apart
  const combined = [...buildGrid(30.25, -97.75, 0), ...buildGrid(30.2506, -97.75, 1)];
  const res = applySolarFilters(combined, { propertyType: "commercial" });
  const keptSegs = new Set(res.panels.map(p => p.segmentIndex));
  assert.equal(keptSegs.has(0), true);
  assert.equal(keptSegs.has(1), true);
});
