import Papa from "papaparse";

export type Priority = 1 | 2 | 3 | 4;

export interface Site {
  id: number;
  category: string;
  name: string;
  address: string;
  zip: string;
  lat: number;
  lon: number;
  solarKw: number;
  detail: string;
  approx: boolean;
  zipGwh: number;
  zipRank: number | null;
  highGrowth: boolean;
  priority: Priority;
}

export interface ZipGrowth {
  zip: string;
  permits: number;
  gwhAll: number;
  gwh2024p: number;
  mwAvg: number;
  rank: number;
  high: boolean;
  lat: number;
  lon: number;
}

export interface Substation { name: string; voltageKv: number; capacityKva: number; lat: number; lon: number }

export const PRIORITY_INFO: Record<Priority, { label: string; desc: string }> = {
  1: { label: "Priority 1", desc: "Existing solar in a top-12 growth ZIP. A battery can attach now, near growing load." },
  2: { label: "Priority 2", desc: "Existing solar in any other ZIP." },
  3: { label: "Priority 3", desc: "Schools with solar potential. Needs new solar plus a battery." },
  4: { label: "Priority 4", desc: "Commercial roofs with solar potential. Needs new solar plus a battery." },
};

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const b = (v: unknown) => String(v).trim().toLowerCase() === "true";

export function parseSites(csv: string): Site[] {
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return data.map((r, i) => ({
    id: i,
    category: r.category ?? "",
    name: r.name ?? "",
    address: r.address ?? "",
    zip: String(r.zip ?? "").trim(),
    lat: n(r.lat),
    lon: n(r.lon),
    solarKw: n(r.solar_kw),
    detail: r.detail ?? "",
    approx: b(r.approx),
    zipGwh: n(r.zip_gwh),
    zipRank: r.zip_rank ? n(r.zip_rank) : null,
    highGrowth: b(r.high_growth),
    priority: Math.min(4, Math.max(1, Math.round(n(r.priority)))) as Priority,
  })).filter((s) => s.lat && s.lon);
}

export function parseZips(csv: string): ZipGrowth[] {
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return data.map((r) => ({
    zip: String(r.zip).trim(), permits: n(r.permits), gwhAll: n(r.gwh_all), gwh2024p: n(r.gwh_2024p),
    mwAvg: n(r.mw_avg), rank: n(r.rank), high: b(r.high), lat: n(r.lat), lon: n(r.lon),
  })).filter((z) => z.lat && z.lon);
}

/** Returns null unless the text is a real substations CSV (hosting may answer missing files with the app page). */
export function parseSubstations(csv: string): Substation[] | null {
  if (!/^\s*name\s*,/i.test(csv)) return null;
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const rows = data.map((r) => ({ name: r.name ?? "", voltageKv: n(r.voltage_kv), capacityKva: n(r.capacity_kva), lat: n(r.lat), lon: n(r.lon) })).filter((s) => s.lat && s.lon);
  return rows.length ? rows : null;
}

export interface Filters {
  priorities: Priority[];
  highOnly: boolean;
  minKw: number;
  zip: string; // "" = all
  q: string;
  ratio: number;
}

export const DEFAULT_FILTERS: Filters = { priorities: [1, 2, 3, 4], highOnly: false, minKw: 0, zip: "", q: "", ratio: 0.5 };

/** Filter and rank: priority asc, then ZIP new load desc, then solar kW desc. */
export function filterSites(sites: Site[], f: Filters): Site[] {
  const q = f.q.trim().toLowerCase();
  return sites
    .filter((s) => f.priorities.includes(s.priority)
      && (!f.highOnly || s.highGrowth)
      && s.solarKw >= f.minKw
      && (!f.zip || s.zip === f.zip)
      && (!q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)))
    .sort((a, b) => a.priority - b.priority || b.zipGwh - a.zipGwh || b.solarKw - a.solarKw);
}

export function siteStats(sites: Site[], ratio: number) {
  const solarMw = sites.reduce((t, s) => t + s.solarKw, 0) / 1000;
  const existing = sites.filter((s) => s.priority <= 2);
  const existingSolarMw = existing.reduce((t, s) => t + s.solarKw, 0) / 1000;
  return { count: sites.length, solarMw, batteryMw: solarMw * ratio, existingBatteryMw: existingSolarMw * ratio, existingCount: existing.length };
}

function pct(sorted: number[], p: number) { return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))]; }

/** Map bounds from the 1st–99th percentile of site coordinates. */
export function percentileBounds(sites: Site[]): [[number, number], [number, number]] | null {
  if (!sites.length) return null;
  const lats = sites.map((s) => s.lat).sort((a, b) => a - b);
  const lons = sites.map((s) => s.lon).sort((a, b) => a - b);
  return [[pct(lats, 0.01), pct(lons, 0.01)], [pct(lats, 0.99), pct(lons, 0.99)]];
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function filtersFromParams(p: URLSearchParams): Filters {
  const pr = p.get("p");
  const priorities = pr != null ? pr.split("").map(Number).filter((x): x is Priority => x >= 1 && x <= 4) : DEFAULT_FILTERS.priorities;
  const ratio = Number(p.get("ratio"));
  return {
    priorities,
    highOnly: p.get("high") === "1",
    minKw: Math.max(0, Math.min(1000, Number(p.get("min")) || 0)),
    zip: p.get("zip") ?? "",
    q: p.get("q") ?? "",
    ratio: ratio >= 0.25 && ratio <= 1 ? ratio : DEFAULT_FILTERS.ratio,
  };
}

export function filtersToParams(f: Filters, base: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  const set = (k: string, v: string | null) => (v == null ? p.delete(k) : p.set(k, v));
  set("p", f.priorities.length === 4 ? null : [...f.priorities].sort().join(""));
  set("high", f.highOnly ? "1" : null);
  set("min", f.minKw ? String(f.minKw) : null);
  set("zip", f.zip || null);
  set("q", f.q || null);
  set("ratio", f.ratio === DEFAULT_FILTERS.ratio ? null : String(f.ratio));
  return p;
}
