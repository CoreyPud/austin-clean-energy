import { daysAppliedToFinal, daysIssuedToFinal, permitFilterDate, type SolarPermit } from '@/lib/solar-permits';

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
  permits: number;  totalKw: number;
  appliedToIssued: number | null;
  appliedToIssuedCount: number;
  appliedToFinal: number | null;
  appliedToFinalCount: number;
  issuedToFinal: number | null;
  issuedToFinalCount: number;
}
/**
 * Bar thickness (pixels) used by the contractor timing charts, so a thick bar
 * means a busy contractor. Square-root scaled: a contractor with 4x the permits
 * gets roughly 2x the thickness, which matches how people read bar area.
 */
export const BAR_THICKNESS = { min: 4, max: 26 };

export function barThickness(permits: number, maxPermits: number, scale = BAR_THICKNESS) {
  const p = Number(permits), max = Number(maxPermits);
  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(max) || max <= 0) return scale.min;
  const ratio = Math.sqrt(Math.min(p, max) / max);
  return scale.min + (scale.max - scale.min) * ratio;
}

export type ContractorSort = 'contractor' | 'permits' | 'totalKw' | 'appliedToIssued' | 'appliedToFinal' | 'issuedToFinal';

/** First click on a column header: contractor names go A→Z, every number puts its largest value on top. */
export function firstClickAscending(field: ContractorSort) {
  return field === 'contractor';
}

export function contractorTiming(rows: SolarPermit[]): { contractors: ContractorTiming[]; excluded: number } {
  const groups = new Map<string, { permits: number; kw: number; ai: number[]; af: number[]; if: number[] }>();
  let excluded = 0;
  for (const row of rows) {
    if (isSuspectTiming(row)) { excluded++; continue; }
    const name = (row.contractor_company || '').trim() || 'Not reported';
    const g = groups.get(name) ?? { permits: 0, kw: 0, ai: [], af: [], if: [] };
    g.permits++; g.kw += row.installed_kw ?? 0;
    const ai = daysAppliedToIssued(row); if (ai !== null) g.ai.push(ai);
    const af = daysAppliedToFinal(row); if (af !== null) g.af.push(af);
    const fi = daysIssuedToFinal(row); if (fi !== null) g.if.push(fi);
    groups.set(name, g);
  }
  return { excluded, contractors: [...groups].map(([contractor, g]) => ({ contractor, permits: g.permits, totalKw: g.kw, appliedToIssued: median(g.ai), appliedToIssuedCount: g.ai.length, appliedToFinal: median(g.af), appliedToFinalCount: g.af.length, issuedToFinal: median(g.if), issuedToFinalCount: g.if.length })) };
}

export interface PermitDateRange { earliest: string | null; latest: string | null; dated: number }

/** The earliest and latest dates the from/through filters compare against, across these permits. */
export function permitDateRange(rows: SolarPermit[]): PermitDateRange {
  let earliest: string | null = null, latest: string | null = null, dated = 0;
  for (const row of rows) {
    const d = permitFilterDate(row);
    if (!d) continue;
    const key = d.slice(0, 10);
    dated++;
    if (earliest === null || key < earliest) earliest = key;
    if (latest === null || key > latest) latest = key;
  }
  return { earliest, latest, dated };
}

/** "Nov 20, 2026" from a YYYY-MM-DD date; empty when there is nothing to show. */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const t = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Same day of the month, n months back, pulled back to the last real day when that month is shorter. */
function monthsAgo(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() - n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}

export type QuickRange = 'ytd' | '3m' | '6m';
export const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'ytd', label: 'Year to date' },
  { key: '3m', label: 'Last 3 months' },
  { key: '6m', label: 'Last 6 months' },
];

/** Inclusive from/through dates for a quick range button. */
export function quickDateRange(kind: QuickRange, today = new Date()): { from: string; to: string } {
  const to = isoDate(today);
  const from = kind === 'ytd' ? `${to.slice(0, 4)}-01-01` : isoDate(monthsAgo(today, kind === '3m' ? 3 : 6));
  return { from, to };
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
