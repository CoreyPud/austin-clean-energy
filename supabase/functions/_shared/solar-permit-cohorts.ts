import { COMMERCIAL_CBI_PER_W, PBI_MIN_KW, PBI_RATE_TIERS, COMMERCIAL_PBI_YEARS } from './commercial-solar-programs.ts';

export interface SolarPermitRecord {
  id: string;
  project_id: string | null;
  permit_class: string | null;
  installed_kw: number | string | null;
  completed_date: string | null;
  issued_date: string | null;
}
export interface SolarPermitCohort {
  year: number;
  residentialKw: number;
  commercialKw: number;
  commercialCount: number;
  commercialKnownCount: number;
  commercialMissingKw: number;
  cbiCount: number;
  cbiKw: number;
  cbiUsd: number;
  pbiCounts: number[];
  pbiKw: number[];
  pbiRateWeightedKw: number;
}

/** Cumulative, corrected permit fleet at calendar year-end; no inferred size or enrollment. */
export function solarPermitCohorts(records: SolarPermitRecord[]): SolarPermitCohort[] {
  const unique = new Map<string, SolarPermitRecord>();
  for (const record of [...records].sort((a, b) =>
    (b.completed_date ?? b.issued_date ?? '').localeCompare(a.completed_date ?? a.issued_date ?? '') || a.id.localeCompare(b.id))) {
    const key = record.project_id || record.id;
    if (!unique.has(key)) unique.set(key, record);
  }
  const dated = [...unique.values()].filter(r => r.completed_date || r.issued_date);
  const years = [...new Set(dated.map(r => Number((r.completed_date ?? r.issued_date ?? '').slice(0, 4))))].filter(Number.isFinite).sort((a,b) => a-b);
  return years.map(year => {
    const cohort: SolarPermitCohort = { year, residentialKw: 0, commercialKw: 0, commercialCount: 0, commercialKnownCount: 0, commercialMissingKw: 0, cbiCount: 0, cbiKw: 0, cbiUsd: 0, pbiCounts: [0,0,0], pbiKw: [0,0,0], pbiRateWeightedKw: 0 };
    for (const record of dated) {
      if (Number((record.completed_date ?? record.issued_date ?? '').slice(0,4)) > year) continue;
      const kw = Number(record.installed_kw);
      const valid = Number.isFinite(kw) && kw > 0;
      if (record.permit_class === 'Residential') {
        if (valid) cohort.residentialKw += kw;
        continue;
      }
      if (record.permit_class !== 'Commercial') continue;
      cohort.commercialCount++;
      if (!valid) { cohort.commercialMissingKw++; continue; }
      cohort.commercialKnownCount++;
      cohort.commercialKw += kw;
      if (kw < PBI_MIN_KW) {
        cohort.cbiCount++; cohort.cbiKw += kw;
        cohort.cbiUsd += kw * 1000 * COMMERCIAL_CBI_PER_W;
      } else {
        const index = PBI_RATE_TIERS.findIndex(t => kw >= t.minKw);
        const tier = PBI_RATE_TIERS[index];
        if (!tier) continue;
        cohort.pbiCounts[index]++; cohort.pbiKw[index] += kw;
        cohort.pbiRateWeightedKw += kw * tier.rate;
      }
    }
    return cohort;
  });
}

/** Undiscounted lifetime AE incentive cost per MWh; PBI is paid for five years, not 25. */
export function commercialPermitCost(cohort: SolarPermitCohort, yieldKwhPerKwYear: number, lifeYears: number) {
  const lifetimeMwh = cohort.commercialKw * yieldKwhPerKwYear * lifeYears / 1000;
  const pbiUsd = cohort.pbiRateWeightedKw * yieldKwhPerKwYear * COMMERCIAL_PBI_YEARS;
  return {
    cbiRate: lifetimeMwh > 0 ? cohort.cbiUsd / lifetimeMwh : 0,
    pbiRate: lifetimeMwh > 0 ? pbiUsd / lifetimeMwh : 0,
  };
}