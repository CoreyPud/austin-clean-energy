import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compute, computeDesign2, design2Day, type DataFile } from './loadCurves';

const data: DataFile = JSON.parse(readFileSync('public/data/load_curves.json', 'utf8'));
const office = data.buildings.largeoffice;

test('supplied large office example retains Design 1 annual demand savings', () => {
  assert.equal(Math.round(compute(office, 668, 10, 'perfect', 15.35).annualSavings), 8398);
});

test('supplied Design 2 example separates system value from owner bill savings', () => {
  const result = computeDesign2(office, 668, 10, 'perfect', 15.35, 0.86, 100, 65, 6);
  assert.equal(Math.round(result.expectedKwCut), 67);
  assert.equal(Math.round(result.aeValue), 4603);
  assert.equal(Math.round(result.ownerSavings), 5599);
});

test('system dispatch uses the supplied two-hour window and overnight recharge', () => {
  const base = Array(96).fill(100);
  const after = design2Day(base, 10, 0.86);
  assert.equal(after[61], 100);
  assert.equal(after[62], 90);
  assert.equal(after[69], 90);
  assert.equal(after[70], 100);
  assert.equal(after[0], 100 + 20 / 0.86 / 6);
  assert.equal(after[24], 100);
});