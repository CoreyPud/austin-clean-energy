import { daysAppliedToFinal, daysIssuedToFinal, type SolarPermit } from '@/lib/solar-permits';

/** Same data-error rule as the Solar Progress timing charts: applied→final under 10 days is excluded. */
export const MIN_VALID_APPLIED_TO_FINAL_DAYS = 10;

export function daysAppliedToIssued(row: Pick<SolarPermit, 'applied_date' | 'issued_date'>): number | null {
  if (!row.applied_date || !row.issued_date) return null;
  const a = Date.parse(`${row.applied_date.slice(0, 10)}T00:00:00Z`), i = Date.parse(`${row.issued_date.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(i) || i < a) return null;
  return Math.round((i - a) / 86400000);
}

export function isSuspectTiming(row: SolarPermit) {
  const d = daysAppliedToFinal(row);
  return d !== null && d < MIN_VALID_APPLIED_TO_FINAL_DAYS;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface ContractorTiming {
  contractor: string;
  permits: number;
  totalKw: number;
  appliedToIssued: number | null;
  appliedToIssuedCount: number;
  issuedToFinal: number | null;
  issuedToFinalCount: number;
}
export type ContractorSort = 'contractor' | 'permits' | 'totalKw' | 'appliedToIssued' | 'issuedToFinal';

/** First click on a column header: contractor names go A→Z, every number puts its largest value on top. */
export function firstClickAscending(field: ContractorSort) {
  return field === 'contractor';
}

export function contractorTiming(rows: SolarPermit[]): { contractors: ContractorTiming[]; excluded: number } {
  const groups = new Map<string, { permits: number; kw: number; ai: number[]; if: number[] }>();
  let excluded = 0;
  for (const row of rows) {
    if (isSuspectTiming(row)) { excluded++; continue; }
    const name = (row.contractor_company || '').trim() || 'Not reported';
    const g = groups.get(name) ?? { permits: 0, kw: 0, ai: [], if: [] };
    g.permits++; g.kw += row.installed_kw ?? 0;
    const ai = daysAppliedToIssued(row); if (ai !== null) g.ai.push(ai);
    const fi = daysIssuedToFinal(row); if (fi !== null) g.if.push(fi);
    groups.set(name, g);
  }
  return { excluded, contractors: [...groups].map(([contractor, g]) => ({ contractor, permits: g.permits, totalKw: g.kw, appliedToIssued: median(g.ai), appliedToIssuedCount: g.ai.length, issuedToFinal: median(g.if), issuedToFinalCount: g.if.length })) };
}

export function sortContractors(list: ContractorTiming[], field: ContractorSort, ascending: boolean) {
  return [...list].sort((a, b) => {
    const av = a[field], bv = b[field];
    if (av === null) return bv === null ? a.contractor.localeCompare(b.contractor) : 1;
    if (bv === null) return -1;
    const r = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
    return (ascending ? r : -r) || a.contractor.localeCompare(b.contractor);
  });
}
