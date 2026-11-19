import { test as it } from 'node:test';
import assert from 'node:assert/strict';
import { contractorTiming, daysAppliedToIssued, firstClickAscending, sortContractors } from './contractor-timing';
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
