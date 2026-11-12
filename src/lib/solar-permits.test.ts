import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysAppliedToFinal, filterPermits, sortPermits, emptyPermitFilters, type SolarPermit } from './solar-permits';

const make = (id: string, patch: Partial<SolarPermit>): SolarPermit => ({ id, project_id: null, permit_number: null, address: null, installed_kw: null, contractor_company: null, permit_class: null, status_current: null, applied_date: null, issued_date: null, completed_date: null, original_zip: null, council_district: null, description: null, total_job_valuation: null, link: null, has_correction: false, host: null, host_pid: null, ...patch });
const rows = [make('a', { address: '100 Main St', installed_kw: 5, host: 'Example Church', contractor_company: 'Solar One', completed_date: '2026-11-01' }), make('b', { address: '200 Oak St', installed_kw: 200, host: 'Example Company', contractor_company: 'Solar Two', permit_class: 'Commercial', status_current: 'Final', issued_date: '2026-10-01' }), make('c', {})];
test('permit filters search addresses and combine host, contractor and size', () => {
  assert.deepEqual(filterPermits(rows, { ...emptyPermitFilters, search: 'MAIN', host: 'church', contractor: 'one', minKw: '5', maxKw: '5' }).map(r => r.id), ['a']);
});
test('permit filters apply status, type and fallback dates', () => {
  assert.deepEqual(filterPermits(rows, { ...emptyPermitFilters, status: 'Final', type: 'Commercial', from: '2026-10-01', to: '2026-10-31' }).map(r => r.id), ['b']);
});
test('system sizes sort numerically and missing data stays last in both directions', () => {
  assert.deepEqual(sortPermits(rows, 'installed_kw', true).map(r => r.id), ['a', 'b', 'c']);
  assert.deepEqual(sortPermits(rows, 'installed_kw', false).map(r => r.id), ['b', 'a', 'c']);
});
test('host sorting covers the complete result set without changing source order', () => {
  assert.deepEqual(sortPermits(rows, 'host', true).map(r => r.id), ['a', 'b', 'c']);
  assert.deepEqual(rows.map(r => r.id), ['a', 'b', 'c']);
});test('applied-to-final days count whole days and skip missing or reversed dates', () => {
  assert.equal(daysAppliedToFinal({ applied_date: '2026-01-01', completed_date: '2026-01-31' }), 30);
  assert.equal(daysAppliedToFinal({ applied_date: '2026-01-01', completed_date: null }), null);
  assert.equal(daysAppliedToFinal({ applied_date: '2026-02-01', completed_date: '2026-01-01' }), null);
});
