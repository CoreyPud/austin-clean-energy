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

export interface TimingMonth extends TimingYear {
  month: string;
}

export function timingPermitType(description: string | null): 'solar' | 'batteryOnly' | 'unclassified' {
  const text = description ?? '';
  if (/\b(solar|photovoltaic|pv)\b/i.test(text)) return 'solar';
  if (/\b(bess|battery|batteries|powerwalls?)\b|energy\s+storage/i.test(text)) return 'batteryOnly';
  return 'unclassified';
}

/** Application cohorts: calendar months or Austin fiscal years (Oct–Sep, named by ending year). */
export function permitTimingStats(records: TimingPermit[], period: 'year' | 'month' = 'year') {
  const unique = new Map<string, TimingPermit>();
  for (const row of [...records].sort((a, b) =>
    (b.completed_date ?? '').localeCompare(a.completed_date ?? '') || a.id.localeCompare(b.id))) {
    const key = row.project_id || row.id;
    if (!unique.has(key)) unique.set(key, row);
  }
  const groups = { solar: new Map<string, number[]>(), batteryOnly: new Map<string, number[]>() };
  let unclassifiedCount = 0;
  for (const row of unique.values()) {
    if (!row.applied_date || !row.completed_date) continue;
    const year = Number(row.applied_date.slice(0, 4));
    const days = Math.round((Date.parse(row.completed_date) - Date.parse(row.applied_date)) / 86400000);
    if (!Number.isFinite(days) || days <= 0 || year < 2014) continue;
    const type = timingPermitType(row.description);
    if (type === 'unclassified') { unclassifiedCount++; continue; }
    const fiscalYear = year + (Number(row.applied_date.slice(5, 7)) >= 10 ? 1 : 0);
    const key = period === 'month' ? row.applied_date.slice(0, 7) : String(fiscalYear);
    const values = groups[type].get(key) ?? [];
    values.push(days);
    groups[type].set(key, values);
  }
  const summarize = (group: Map<string, number[]>) => [...group].sort(([a], [b]) => a.localeCompare(b)).map(([key, days]) => {
    const sorted = [...days].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return {
      year: Number(key.slice(0, 4)),
      ...(period === 'month' ? { month: key } : {}),
      averageDays: Math.round(days.reduce((sum, day) => sum + day, 0) / days.length),
      medianDays: Math.round(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2),
      count: days.length,
    };
  });
  return { solar: summarize(groups.solar), batteryOnly: summarize(groups.batteryOnly), unclassifiedCount };
}