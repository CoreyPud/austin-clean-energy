import { test as it } from 'node:test';
import assert from 'node:assert/strict';
import { barThickness, BAR_THICKNESS, contractorTiming, daysAppliedToIssued, firstClickAscending, formatDate, permitDateRange, quickDateRange, QUICK_RANGES, sortContractors } from './contractor-timing';
import type { SolarPermit } from './solar-permits';

const p = (o: Partial<SolarPermit>): SolarPermit => ({ id: Math.random().toString(), project_id: null, permit_number: null, address: null, installed_kw: null, contractor_company: 'A', permit_class: null, status_current: 'Final', applied_date: null, issued_date: null, completed_date: null, original_zip: null, council_district: null, description: null, total_job_valuation: null, link: null, has_correction: null, host: null, host_pid: null, ...o });

  it('computes applied to issued days', () => {
    assert.equal(daysAppliedToIssued({ applied_date: '2025-01-01', issued_date: '2025-01-11' }), 10);
  });
  it('excludes permits under 10 days applied to final', () => {
    const r = contractorTiming([p({ applied_date: '2025-01-01', issued_date: '2025-01-02', completed_date: '2025-01-05' }), p({ applied_date: '2025-01-01', issued_date: '2025-01-11', completed_date: '2025-02-10' })]);
    assert.equal(r.excluded, 1);
    assert.deepEqual([r.contractors[0].permits, r.contractors[0].appliedToIssued, r.contractors[0].issuedToFinal], [1, 10, 30]);
    assert.deepEqual([r.contractors[0].appliedToFinal, r.contractors[0].appliedToFinalCount], [40, 1]);
  });
  it('ignores issued to final for non-final permits', () => {
    const r = contractorTiming([p({ status_current: 'Active', applied_date: '2025-01-01', issued_date: '2025-01-05', completed_date: '2025-03-01' })]);
    assert.equal(r.contractors[0].issuedToFinal, null);
    assert.equal(r.contractors[0].appliedToFinal, null);
    assert.equal(r.contractors[0].appliedToFinalCount, 0);
    assert.equal(r.contractors[0].appliedToIssued, 4);
  });
  it('medians applied to final across a contractor permits', () => {
    const r = contractorTiming([
      p({ applied_date: '2025-01-01', issued_date: '2025-01-05', completed_date: '2025-01-21' }),
      p({ applied_date: '2025-01-01', issued_date: '2025-01-11', completed_date: '2025-02-10' }),
      p({ status_current: 'Active', applied_date: '2025-01-01', issued_date: '2025-01-06', completed_date: '2025-03-01' }),
    ]);
    assert.equal(r.contractors[0].permits, 3);
    assert.equal(r.contractors[0].appliedToFinal, 30);
    assert.equal(r.contractors[0].appliedToFinalCount, 2);
    assert.equal(r.contractors[0].issuedToFinal, 23);
  });
  it('sorts by median days with missing last', () => {
    const list = [{ contractor: 'X', permits: 1, totalKw: 0, appliedToIssued: null, appliedToIssuedCount: 0, appliedToFinal: null, appliedToFinalCount: 0, issuedToFinal: 5, issuedToFinalCount: 1 }, { contractor: 'Y', permits: 1, totalKw: 0, appliedToIssued: 3, appliedToIssuedCount: 1, appliedToFinal: 12, appliedToFinalCount: 1, issuedToFinal: 9, issuedToFinalCount: 1 }];
    assert.deepEqual(sortContractors(list, 'appliedToIssued', false).map(c => c.contractor), ['Y', 'X']);
    assert.deepEqual(sortContractors(list, 'appliedToFinal', false).map(c => c.contractor), ['Y', 'X']);
  });

  it('puts the largest numbers on top for a first click', () => {
    assert.equal(firstClickAscending('permits'), false);
    assert.equal(firstClickAscending('totalKw'), false);
    assert.equal(firstClickAscending('appliedToIssued'), false);
    assert.equal(firstClickAscending('appliedToFinal'), false);
    assert.equal(firstClickAscending('issuedToFinal'), false);
    assert.equal(firstClickAscending('contractor'), true);
  });
  it('moves the largest values to the top, then the bottom, when the order flips', () => {
    const list = sortContractors([
      { contractor: 'Small Co', permits: 12, totalKw: 40, appliedToIssued: 3, appliedToIssuedCount: 12, appliedToFinal: 9, appliedToFinalCount: 12, issuedToFinal: 9, issuedToFinalCount: 12 },
      { contractor: 'Big Co', permits: 60, totalKw: 900, appliedToIssued: 21, appliedToIssuedCount: 60, appliedToFinal: 44, appliedToFinalCount: 60, issuedToFinal: 44, issuedToFinalCount: 60 },
      { contractor: 'No Final Co', permits: 30, totalKw: 200, appliedToIssued: 7, appliedToIssuedCount: 30, appliedToFinal: null, appliedToFinalCount: 0, issuedToFinal: null, issuedToFinalCount: 0 },
    ], 'issuedToFinal', false).map(c => c.contractor);
    assert.deepEqual(list, ['Big Co', 'Small Co', 'No Final Co']);
    assert.deepEqual(sortContractors([
      { contractor: 'Small Co', permits: 12, totalKw: 40, appliedToIssued: 3, appliedToIssuedCount: 12, appliedToFinal: 9, appliedToFinalCount: 12, issuedToFinal: 9, issuedToFinalCount: 12 },
      { contractor: 'Big Co', permits: 60, totalKw: 900, appliedToIssued: 21, appliedToIssuedCount: 60, appliedToFinal: 44, appliedToFinalCount: 60, issuedToFinal: 44, issuedToFinalCount: 60 },
      { contractor: 'No Final Co', permits: 30, totalKw: 200, appliedToIssued: 7, appliedToIssuedCount: 30, appliedToFinal: null, appliedToFinalCount: 0, issuedToFinal: null, issuedToFinalCount: 0 },
    ], 'issuedToFinal', true).map(c => c.contractor), ['Small Co', 'Big Co', 'No Final Co']);
  });

  it('makes bar thickness grow with the permit count', () => {
    assert.equal(barThickness(100, 100), BAR_THICKNESS.max);
    assert.equal(barThickness(0, 100), BAR_THICKNESS.min);
    assert.equal(barThickness(25, 100), BAR_THICKNESS.min + (BAR_THICKNESS.max - BAR_THICKNESS.min) * 0.5);
    assert.ok(barThickness(60, 100) > barThickness(12, 100));
  });
  it('keeps bar thickness inside its range for odd counts', () => {
    assert.equal(barThickness(500, 100), BAR_THICKNESS.max);
    assert.equal(barThickness(Number.NaN, 100), BAR_THICKNESS.min);
    assert.equal(barThickness(10, 0), BAR_THICKNESS.min);
    assert.ok(barThickness(1, 100) >= BAR_THICKNESS.min && barThickness(1, 100) <= BAR_THICKNESS.max);
  });

  it('reports the dates the permit data covers', () => {
    const r = permitDateRange([
      p({ status_current: 'Final', applied_date: '2020-01-05', issued_date: '2020-02-05', completed_date: '2021-06-10' }),
      p({ status_current: 'Active', applied_date: '2019-03-01', issued_date: '2019-04-01', completed_date: null }),
      p({ applied_date: null, issued_date: null, completed_date: null }),
    ]);
    assert.deepEqual([r.earliest, r.latest, r.dated], ['2019-04-01', '2021-06-10', 2]);
  });
  it('says nothing is covered when no permit has a date', () => {
    assert.deepEqual(permitDateRange([]), { earliest: null, latest: null, dated: 0 });
  });
  it('builds quick date ranges from today', () => {
    const today = new Date(2026, 10, 20);
    assert.deepEqual(quickDateRange('ytd', today), { from: '2026-01-01', to: '2026-11-20' });
    assert.deepEqual(quickDateRange('3m', today), { from: '2026-08-20', to: '2026-11-20' });
    assert.deepEqual(quickDateRange('6m', today), { from: '2026-05-20', to: '2026-11-20' });
  });
  it('pulls a quick range back when that month has no such day', () => {
    assert.equal(quickDateRange('3m', new Date(2026, 4, 31)).from, '2026-02-28');
  });
  it('offers the three quick ranges the page shows', () => {
    assert.deepEqual(QUICK_RANGES.map(q => q.key), ['ytd', '3m', '6m']);
    assert.deepEqual(QUICK_RANGES.map(q => q.label), ['Year to date', 'Last 3 months', 'Last 6 months']);
  });
  it('formats a permit date for reading', () => {
    assert.equal(formatDate('2026-11-20'), 'Nov 20, 2026');
    assert.equal(formatDate(null), '');
    assert.equal(formatDate('not a date'), '');
  });
