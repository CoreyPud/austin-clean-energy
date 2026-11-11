import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOURCE_KEYS, computeHour, dayIndexOf, parseFlowCsv, type FlowModel } from "./grid-flow-engine";

const model = JSON.parse(readFileSync("public/data/grid-flow-model.json", "utf8")) as FlowModel;
const data = parseFlowCsv(readFileSync("public/data/grid-flow-hourly-fy2024.csv", "utf8"), model.plants.length);

function hourIndex(date: string, hour: number) {
  const day = dayIndexOf(data.stamp, date);
  assert.ok(day >= 0, `Missing supplied day ${date}`);
  return day * 24 + hour;
}

test("supplied hourly file covers the 8,784 hours of FY2024", () => {
  assert.equal(data.hours, 8784);
  assert.equal(data.stamp[0], "2023-10-01T00");
  assert.equal(data.stamp[data.hours - 1], "2024-09-30T23");
  assert.equal(data.load[0], 1581);
  assert.equal(data.mw.length, 21);
});

test("summer peak allocation balances every source and substation to Austin load", () => {
  const state = computeHour(model, data, hourIndex("2024-08-21", 16));
  const sourceTotal = SOURCE_KEYS.reduce((sum, key) => sum + state.bySource[key], 0);
  const subTotal = state.subLoad.reduce((sum, value) => sum + value, 0);
  const deliveredTotal = state.plantMw.reduce((sum, value) => sum + value, 0) + state.imported;
  assert.ok(Math.abs(sourceTotal - state.load) < 0.01);
  assert.ok(Math.abs(subTotal - state.load) < 0.01);
  assert.ok(Math.abs(deliveredTotal - state.load) < 0.01);
});

test("windy-night preset exports surplus fleet output without ERCOT imports", () => {
  const state = computeHour(model, data, hourIndex("2024-01-08", 2));
  assert.ok(state.gen > state.load);
  assert.ok(state.exported > 0);
  assert.equal(state.imported, 0);
  assert.equal(state.delivered, state.load);
});
