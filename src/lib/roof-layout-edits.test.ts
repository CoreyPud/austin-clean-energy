import { test } from "node:test";
import assert from "node:assert/strict";
import { activeRoofPanelCounts, orderedLayoutPanels, roofToggleSystemKw, filterBlockedPanels, mergeAddedRoof, type BlockedArea } from "./roof-layout-edits";
import type { SolarPanel } from "./solar-filters";

const makePanel = (lat: number, lon: number, segmentIndex = 0): SolarPanel => ({
  lat,
  lon,
  orientation: "PORTRAIT",
  yearlyEnergyDcKwh: 700,
  segmentIndex,
});

test("deselecting an active array reduces DC size by its selected panel capacity, not the entire possible roof", () => {
  const ordered = orderedLayoutPanels([makePanel(30.3, -97.7, 0), makePanel(30.29999, -97.7, 0), makePanel(30.29, -97.7, 1)]);
  const counts = activeRoofPanelCounts(ordered, 0.8, 400);
  assert.deepEqual(counts, { 0: 2 });
  assert.equal(roofToggleSystemKw(0.8, counts[0], 3, 400), 0);
});

test("including a possible but inactive array adds its panel capacity to DC size", () => {
  assert.equal(roofToggleSystemKw(8, 0, 10, 400), 12);
});

test("blue available panels are not included in active roof counts", () => {
  const ordered = orderedLayoutPanels([makePanel(30.3, -97.7, 0), makePanel(30.29999, -97.7, 0), makePanel(30.29, -97.7, 1)]);
  assert.deepEqual(activeRoofPanelCounts(ordered, 0.4, 400), { 0: 1 });
  assert.deepEqual(activeRoofPanelCounts(ordered, 0, 400), {});
});

test("adding a blue roof selects that roof rather than increasing panels on unrelated roofs", () => {
  const panels = [makePanel(30.3, -97.7, 0), makePanel(30.29999, -97.7, 0), makePanel(30.29, -97.7, 1)];
  const ordered = orderedLayoutPanels(panels, [1]);
  assert.deepEqual(activeRoofPanelCounts(ordered, 0.4, 400), { 1: 1 });
});

test("filterBlockedPanels removes panels inside any blocked box and keeps panels outside", () => {
  const panels = [makePanel(30.2501, -97.7501, 0), makePanel(30.2515, -97.7515, 1)];
  const boxes: BlockedArea[] = [{ minLat: 30.251, maxLat: 30.252, minLon: -97.752, maxLon: -97.751 }];
  const kept = filterBlockedPanels(panels, boxes);
  assert.deepEqual(kept.map((p) => p.segmentIndex), [0]);
});

test("mergeAddedRoof offsets segment indices and skips duplicate panels from already-loaded roofs", () => {
  const existing = [makePanel(30.2501, -97.7501, 0), makePanel(30.2502, -97.7502, 2)];
  const merged = mergeAddedRoof(
    existing,
    { 0: 180, 2: 90 },
    { 0: 5, 2: 10 },
    { 0: 300, 2: 250 },
    {
      panels: [
        makePanel(30.250101, -97.750101, 0), // duplicate of existing panel 0
        makePanel(30.2509, -97.7509, 0),     // new roof panel
      ],
      roofSegments: [{ segmentIndex: 0, azimuthDeg: 270, pitchDeg: 8, areaM2: 400 }],
    },
  );
  assert.equal(merged.addedCount, 1);
  assert.equal(merged.panels.length, 3);
  assert.equal(merged.panels[2].segmentIndex, 3);
  assert.equal(merged.azimuths[3], 270);
  assert.equal(merged.pitches[3], 8);
  assert.equal(merged.segmentAreas[3], 400);
});