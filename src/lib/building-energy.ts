export interface BuildingEnergyRow {
  permit_id: string;
  issued_date: string;
  property_type: string;
  sqft: number;
  est_annual_kwh: number;
  permit_class: string;
}

export interface YearPoint {
  year: number;
  [propertyType: string]: number;
}

export interface PropertyTypeAgg {
  property_type: string;
  sqft: number;
  mwh: number;
  count: number;
}

export interface Totals {
  permits: number;
  sqft: number;
  mwh: number;
  topType: string;
}

export const AUSTIN_ENERGY_ANNUAL_SALES_KWH = 14_000_000_000;
export const AUSTIN_ENERGY_PEAK_MW = 3067;
export const LOAD_FACTOR = 0.5;
export const HOURS_PER_YEAR = 8760;

export interface PeakMwPoint {
  year: number;
  peak_mw: number;
}

export interface SystemContext {
  totalKwh: number;
  pctOfAnnualSales: number;
  roughPeakMw: number;
  pctOfSystemPeak: number;
}

export function peakMwByYear(rows: BuildingEnergyRow[]): PeakMwPoint[] {
  const byYear = new Map<number, number>();
  for (const r of rows) {
    const year = Number((r.issued_date || "").slice(0, 4));
    if (!Number.isFinite(year) || year <= 0) continue;
    byYear.set(year, (byYear.get(year) ?? 0) + r.est_annual_kwh);
  }
  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, kwh]) => {
      const avgKw = kwh / HOURS_PER_YEAR;
      const peakMw = avgKw / LOAD_FACTOR / 1000;
      return { year, peak_mw: Math.round(peakMw * 100) / 100 };
    });
}

export function systemContext(rows: BuildingEnergyRow[]): SystemContext {
  let totalKwh = 0;
  for (const r of rows) totalKwh += r.est_annual_kwh;
  const roughPeakMw = totalKwh / HOURS_PER_YEAR / LOAD_FACTOR / 1000;
  return {
    totalKwh,
    pctOfAnnualSales: (totalKwh / AUSTIN_ENERGY_ANNUAL_SALES_KWH) * 100,
    roughPeakMw,
    pctOfSystemPeak: (roughPeakMw / AUSTIN_ENERGY_PEAK_MW) * 100,
  };
}



// Minimal CSV parser handling quoted fields with commas and escaped quotes ("").
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        field = "";
        if (row.some((v) => v.length > 0)) rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.length > 0)) rows.push(row);
  }
  return rows;
}

export async function loadBuildingEnergyCsv(
  url = "/data/building-energy-usage.csv"
): Promise<BuildingEnergyRow[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iPermit = idx("permit_id");
  const iDate = idx("issued_date");
  const iType = idx("property_type");
  const iSqft = idx("sqft");
  const iKwh = idx("est_annual_kwh");
  const iClass = idx("permit_class");

  const out: BuildingEnergyRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const sqft = Number(row[iSqft]);
    const kwh = Number(row[iKwh]);
    out.push({
      permit_id: row[iPermit] ?? "",
      issued_date: row[iDate] ?? "",
      property_type: row[iType] ?? "",
      sqft: Number.isFinite(sqft) ? sqft : 0,
      est_annual_kwh: Number.isFinite(kwh) ? kwh : 0,
      permit_class: row[iClass] ?? "",
    });
  }
  return out;
}

export function stackByYear(rows: BuildingEnergyRow[]): { data: YearPoint[]; types: string[] } {
  const typeSet = new Set<string>();
  const byYear = new Map<number, Record<string, number>>();
  for (const r of rows) {
    const year = Number((r.issued_date || "").slice(0, 4));
    if (!Number.isFinite(year) || year <= 0) continue;
    typeSet.add(r.property_type);
    if (!byYear.has(year)) byYear.set(year, {});
    const bucket = byYear.get(year)!;
    bucket[r.property_type] = (bucket[r.property_type] ?? 0) + r.est_annual_kwh / 1000;
  }
  const types = Array.from(typeSet).sort();
  const data: YearPoint[] = Array.from(byYear.keys())
    .sort((a, b) => a - b)
    .map((year) => {
      const point: YearPoint = { year };
      const bucket = byYear.get(year)!;
      for (const t of types) point[t] = Math.round((bucket[t] ?? 0) * 10) / 10;
      return point;
    });
  return { data, types };
}

export function byPropertyType(rows: BuildingEnergyRow[]): PropertyTypeAgg[] {
  const map = new Map<string, PropertyTypeAgg>();
  for (const r of rows) {
    const cur = map.get(r.property_type) ?? {
      property_type: r.property_type,
      sqft: 0,
      mwh: 0,
      count: 0,
    };
    cur.sqft += r.sqft;
    cur.mwh += r.est_annual_kwh / 1000;
    cur.count += 1;
    map.set(r.property_type, cur);
  }
  return Array.from(map.values())
    .map((v) => ({ ...v, mwh: Math.round(v.mwh * 10) / 10 }))
    .sort((a, b) => b.mwh - a.mwh);
}

export function totals(rows: BuildingEnergyRow[]): Totals {
  let sqft = 0;
  let kwh = 0;
  const byType = new Map<string, number>();
  for (const r of rows) {
    sqft += r.sqft;
    kwh += r.est_annual_kwh;
    byType.set(r.property_type, (byType.get(r.property_type) ?? 0) + r.est_annual_kwh);
  }
  let topType = "—";
  let topVal = -1;
  for (const [t, v] of byType) {
    if (v > topVal) {
      topVal = v;
      topType = t;
    }
  }
  return {
    permits: rows.length,
    sqft,
    mwh: Math.round(kwh / 1000),
    topType,
  };
}
