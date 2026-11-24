import { test } from "node:test";
import assert from "node:assert/strict";
import { filterBlockedPanels, mergeAddedRoof, type BlockedArea } from "./roof-layout-edits";
import type { SolarPanel } from "./solar-filters";

const makePanel = (lat: number, lon: number, segmentIndex = 0): SolarPanel => ({
  lat,
  lon,
  orientation: "PORTRAIT",
  yearlyEnergyDcKwh: 700,
  segmentIndex,
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