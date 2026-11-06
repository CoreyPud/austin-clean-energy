export interface TimingPermit {
  id: string;
  project_id: string | null;
  description: string | null;
  applied_date: string | null;
  completed_date: string | null;
}

export interface TimingYear {
  year: number;
  averageDays: number;
  medianDays: number;
  count: number;
}

export function timingPermitType(description: string | null): 'solar' | 'batteryOnly' | 'unclassified' {
  const text = description ?? '';
  if (/\b(solar|photovoltaic|pv)\b/i.test(text)) return 'solar';
  if (/\b(bess|battery|batteries|powerwalls?)\b|energy\s+storage/i.test(text)) return 'batteryOnly';
  return 'unclassified';
}

/** Corrected, deduplicated projects timed by application calendar year, not completion year. */
export function permitTimingStats(records: TimingPermit[]) {
  const unique = new Map<string, TimingPermit>();
  for (const row of [...records].sort((a, b) =>
    (b.completed_date ?? '').localeCompare(a.completed_date ?? '') || a.id.localeCompare(b.id))) {
    const key = row.project_id || row.id;
    if (!unique.has(key)) unique.set(key, row);
  }
  const groups = { solar: new Map<number, number[]>(), batteryOnly: new Map<number, number[]>() };
  let unclassifiedCount = 0;
  for (const row of unique.values()) {
    if (!row.applied_date || !row.completed_date) continue;
    const year = Number(row.applied_date.slice(0, 4));
    const days = Math.round((Date.parse(row.completed_date) - Date.parse(row.applied_date)) / 86400000);
    if (!Number.isFinite(days) || days <= 0 || year < 2014) continue;
    const type = timingPermitType(row.description);
    if (type === 'unclassified') { unclassifiedCount++; continue; }
    const values = groups[type].get(year) ?? [];
    values.push(days);
    groups[type].set(year, values);
  }
  const summarize = (group: Map<number, number[]>): TimingYear[] => [...group].map(([year, days]) => {
    const sorted = [...days].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return {
      year,
      averageDays: Math.round(days.reduce((sum, day) => sum + day, 0) / days.length),
      medianDays: Math.round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2),
      count: days.length,
    };
  }).sort((a, b) => a.year - b.year);
  return { solar: summarize(groups.solar), batteryOnly: summarize(groups.batteryOnly), unclassifiedCount };
}