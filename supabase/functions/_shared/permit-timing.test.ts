import { test } from 'node:test';
import assert from 'node:assert/strict';
import { permitTimingStats, timingPermitType, type TimingPermit } from './permit-timing.ts';

const row = (id: string, description: string, completed_date = '2024-01-11'): TimingPermit => ({
  id, project_id: id, description, applied_date: '2024-01-01', completed_date,
});
test('monthly timing separates application months and keeps completion dates out of cohort selection', () => {
  const stats = permitTimingStats([
    row('jan', 'solar'),
    { ...row('feb', 'solar', '2024-03-02'), applied_date: '2024-02-01' },
    { ...row('battery', 'battery', '2024-02-21'), applied_date: '2024-02-01' },
  ], 'month');
  assert.deepEqual(stats.solar, [
    { year: 2024, month: '2024-01', averageDays: 10, medianDays: 10, count: 1 },
    { year: 2024, month: '2024-02', averageDays: 30, medianDays: 30, count: 1 },
  ]);
  assert.deepEqual(stats.batteryOnly, [
    { year: 2024, month: '2024-02', averageDays: 20, medianDays: 20, count: 1 },
  ]);
});
test('solar timing excludes battery-only permits', () => {
  const stats = permitTimingStats([row('s', 'Install solar panels'), row('b', 'Install New 54kw Battery Storage System', '2024-01-31')]);
  assert.deepEqual(stats.solar, [{ year: 2024, averageDays: 10, medianDays: 10, count: 1 }]);
  assert.deepEqual(stats.batteryOnly, [{ year: 2024, averageDays: 30, medianDays: 30, count: 1 }]);
});
test('solar with battery remains in solar rather than battery-only', () => {
  assert.equal(timingPermitType('PV installation with Powerwall'), 'solar');
  const stats = permitTimingStats([row('sb', 'Photovoltaic with battery')]);
  assert.equal(stats.solar[0]?.count, 1);
  assert.equal(stats.batteryOnly.length, 0);
});
test('battery terms identify battery-only without treating generic backup work as storage', () => {
  for (const description of ['BESS', 'batteries', 'energy storage system', 'Powerwall', 'backup battery']) {
    assert.equal(timingPermitType(description), 'batteryOnly');
  }
  assert.equal(timingPermitType('backup generator'), 'unclassified');
});
test('application year and positive completed durations determine average and median', () => {
  const stats = permitTimingStats([
    row('a', 'solar'), row('b', 'solar', '2024-01-21'), row('c', 'solar', '2024-04-10'),
    row('d', 'solar', '2023-12-31'), { ...row('e', 'solar'), completed_date: null },
    { ...row('f', 'solar', '2024-01-10'), applied_date: '2023-12-31' },
  ]);
  assert.deepEqual(stats.solar, [
    { year: 2023, averageDays: 10, medianDays: 10, count: 1 },
    { year: 2024, averageDays: 43, medianDays: 20, count: 3 },
  ]);
});
test('duplicate projects count once and unclassified descriptions are disclosed', () => {
  const stats = permitTimingStats([row('a', 'solar'), { ...row('b', 'solar', '2024-01-21'), project_id: 'a' }, row('c', 'electrical work')]);
  assert.equal(stats.solar[0]?.count, 1);
  assert.equal(stats.solar[0]?.averageDays, 20);
  assert.equal(stats.unclassifiedCount, 1);
});