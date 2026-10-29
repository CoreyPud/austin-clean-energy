import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarPermitCohorts, commercialPermitCost, type SolarPermitRecord } from '../../supabase/functions/_shared/solar-permit-cohorts';
const record = (id: string, kw: number | null, date = '2025-01-01'): SolarPermitRecord => ({ id, project_id: id, permit_class: 'Commercial', installed_kw: kw, completed_date: date, issued_date: '2024-01-01' });
test('commercial CBI is $0.70/W only below 100 kW', () => {
  const [c] = solarPermitCohorts([record('a',99),record('b',100)]);
  assert.equal(c.cbiUsd,69300); assert.equal(c.cbiCount,1); assert.equal(c.pbiCounts[2],1);
});
test('PBI size tiers are 10, 8 and 6 cents per kWh', () => {
  const [c] = solarPermitCohorts([record('a',399),record('b',400),record('c',1000)]);
  assert.deepEqual(c.pbiCounts,[1,1,1]); assert.equal(c.pbiRateWeightedKw,131.9);
});
test('PBI cost spreads five years of payments over 25-year production', () => {
  const [c] = solarPermitCohorts([record('a',100)]);
  assert.equal(commercialPermitCost(c,1450,25).pbiRate,20);
});
test('CBI is amortized by actual system capacity rather than residential average', () => {
  const [c] = solarPermitCohorts([record('a',50)]);
  assert.equal(commercialPermitCost(c,1450,25).cbiRate,35000/1812.5);
});
test('missing capacity remains disclosed and excluded from incentive weights', () => {
  const [c] = solarPermitCohorts([record('a',null),record('b',0),record('c',50)]);
  assert.equal(c.commercialMissingKw,2); assert.equal(c.commercialKnownCount,1); assert.equal(c.commercialKw,50);
});
test('cohorts deduplicate projects and prioritize completion year with per-record issued fallback', () => {
  const rows = solarPermitCohorts([record('a',50,'2024-01-01'),record('a',60),{...record('b',100),completed_date:null}]);
  assert.equal(rows[0].commercialKw,100); assert.equal(rows[1].commercialKw,160);
});