import { test } from 'node:test';
import assert from 'node:assert/strict';
import { permitBarWidth } from './permit-timing-chart';

test('annual bar width is proportional to the number of qualifying permits', () => {
  assert.equal(permitBarWidth(100, 200, 40), 20);
  assert.equal(permitBarWidth(200, 200, 40), 40);
  assert.equal(permitBarWidth(50, 200, 40), 10);
});

test('empty permit counts do not produce a bar', () => {
  assert.equal(permitBarWidth(0, 200, 40), 0);
  assert.equal(permitBarWidth(10, 0, 40), 0);
});