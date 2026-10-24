import { test } from "node:test";
import assert from "node:assert/strict";
import { supplyDemandGapTable } from "./load-zone-outlook-data";

test("supplied outlook spans all years from 2027 through 2045", () => {
  assert.deepEqual(supplyDemandGapTable.map(row => row.year), Array.from({ length: 19 }, (_, i) => 2027 + i));
});

test("supplied outlook keeps the uploaded capacity and positive-to-negative gap", () => {
  assert.equal(supplyDemandGapTable[0]?.supplyMw, 5130.64);
  assert.equal(supplyDemandGapTable[0]?.gapMw, 1924.9);
  assert.equal(supplyDemandGapTable[18]?.gapMw, -731.4);
  for (const row of supplyDemandGapTable) {
    assert.ok(Math.abs(row.gapMw - (row.supplyMw - row.demandMw)) < 0.11);
  }
});