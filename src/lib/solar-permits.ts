export interface SolarPermit {
  id: string;
  project_id: string | null;
  permit_number: string | null;
  address: string | null;
  installed_kw: number | null;
  contractor_company: string | null;
  permit_class: string | null;
  status_current: string | null;
  applied_date: string | null;
  issued_date: string | null;
  completed_date: string | null;
  original_zip: string | null;
  council_district: string | null;
  description: string | null;
  total_job_valuation: number | null;
  link: string | null;
  has_correction: boolean | null;
  host: string | null;
  host_pid: string | null;
}

export type PermitSort = 'address' | 'installed_kw' | 'host' | 'contractor_company' | 'permit_class' | 'status_current' | 'issued_date' | 'completed_date' | 'permit_number';
export interface PermitFilters {
  search: string;
  contractor: string;
  host: string;
  status: string;
  type: string;
  minKw: string;
  maxKw: string;
  from: string;
  to: string;
}
export const emptyPermitFilters: PermitFilters = { search: '', contractor: '', host: '', status: 'all', type: 'all', minKw: '', maxKw: '', from: '', to: '' };

export function filterPermits(rows: SolarPermit[], f: PermitFilters) {
  const contains = (value: string | null, text: string) => (value || '').toLowerCase().includes(text.trim().toLowerCase());
  return rows.filter(row => {
    const date = row.completed_date || row.issued_date || row.applied_date;
    return (!f.search.trim() || [row.address, row.permit_number, row.project_id, row.original_zip, row.description].some(value => contains(value, f.search)))
      && contains(row.contractor_company, f.contractor) && contains(row.host, f.host)
      && (f.status === 'all' || row.status_current === f.status)
      && (f.type === 'all' || row.permit_class === f.type)
      && (!f.minKw || (row.installed_kw !== null && row.installed_kw >= Number(f.minKw)))
      && (!f.maxKw || (row.installed_kw !== null && row.installed_kw <= Number(f.maxKw)))
      && (!f.from || (date !== null && date >= f.from))
      && (!f.to || (date !== null && date <= f.to));
  });
}

export function sortPermits(rows: SolarPermit[], field: PermitSort, ascending: boolean) {
  return [...rows].sort((a, b) => {
    const av = a[field], bv = b[field];
    if (av === null || av === '') return bv === null || bv === '' ? a.id.localeCompare(b.id) : 1;
    if (bv === null || bv === '') return -1;
    const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return (ascending ? result : -result) || a.id.localeCompare(b.id);
  });
}
/** Whole days from application to final inspection, or null when either date is missing or out of order. */
export function daysAppliedToFinal(row: Pick<SolarPermit, 'applied_date' | 'completed_date'>): number | null {
  if (!row.applied_date || !row.completed_date) return null;
  const a = Date.parse(`${row.applied_date.slice(0, 10)}T00:00:00Z`), f = Date.parse(`${row.completed_date.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(f) || f < a) return null;
  return Math.round((f - a) / 86400000);
}
