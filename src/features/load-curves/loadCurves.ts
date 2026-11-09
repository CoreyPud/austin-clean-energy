// loadCurves.ts: types, data loading and all math for the "See the Peak" page.
// No dependencies. Data file: public/data/load_curves.json

export type Controller = "perfect" | "forecast";
export type SizePct = 10 | 20;

export interface Curves {
  peak_day: number[]; // 96 points, kW per 100 kW annual building peak
  summer_weekday: number[]; // 96 points
  monthly_peak: number[]; // 12 points, Jan..Dec
}

export interface BuildingData {
  name: string;
  buildings_100kw_plus: number;
  median_peak_kw: number;
  summer_peak_hours: number[];
  peak_day: string; // ISO date in the weather year
  base: Curves & { annual_kwh_per_100kw: number };
  scen: Record<string, Curves>; // keys like "10_perfect"
}

export interface DataFile {
  meta: { interval_minutes: number; points_per_day: number; units: string; battery_hours: number; rte: number; source: string };
  buildings: Record<string, BuildingData>;
}

export const DEFAULT_RATE = 15.35; // $/kW-month: SV2 demand 10.32 + regulatory 5.03
export const POINTS = 96;
export const IDX_5PM = 68;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function loadData(url = "/data/load_curves.json"): Promise<DataFile> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return (await res.json()) as DataFile;
}

export const scenarioKey = (size: SizePct, controller: Controller) => `${size}_${controller}`;

export function timeLabel(i: number): string {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const ap = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

export function prettyDay(iso: string): string {
  const [, mm, dd] = iso.split("-").map(Number);
  const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[mm - 1]} ${dd}`;
}

export interface Results {
  scale: number;
  batteryKw: number;
  batteryKwh: number;
  peakBefore: number;
  peakAfter: number;
  peakReductionKw: number;
  peakReductionPct: number;
  monthlyCostBefore: number[];
  monthlyCostAfter: number[];
  annualCostBefore: number;
  annualCostAfter: number;
  annualSavings: number;
  savingsPerBatteryKw: number;
  kw5pmBefore: number;
  kw5pmAfter: number;
  annualKwh: number;
}

export function compute(b: BuildingData, peakKw: number, size: SizePct, controller: Controller, rate: number): Results {
  const sc = b.scen[scenarioKey(size, controller)];
  const scale = peakKw / 100;
  const batteryKw = (size / 100) * peakKw;
  const mb = b.base.monthly_peak.map((v) => v * scale);
  const ma = sc.monthly_peak.map((v) => v * scale);
  const monthlyCostBefore = mb.map((v) => v * rate);
  const monthlyCostAfter = ma.map((v) => v * rate);
  const annualCostBefore = monthlyCostBefore.reduce((a, c) => a + c, 0);
  const annualCostAfter = monthlyCostAfter.reduce((a, c) => a + c, 0);
  const annualSavings = annualCostBefore - annualCostAfter;
  const peakBefore = Math.max(...mb);
  const peakAfter = Math.max(...ma);
  return {
    scale,
    batteryKw,
    batteryKwh: batteryKw * 2,
    peakBefore,
    peakAfter,
    peakReductionKw: peakBefore - peakAfter,
    peakReductionPct: peakBefore > 0 ? ((peakBefore - peakAfter) / peakBefore) * 100 : 0,
    monthlyCostBefore,
    monthlyCostAfter,
    annualCostBefore,
    annualCostAfter,
    annualSavings,
    savingsPerBatteryKw: batteryKw > 0 ? annualSavings / batteryKw : 0,
    kw5pmBefore: b.base.summer_weekday[IDX_5PM] * scale,
    kw5pmAfter: sc.summer_weekday[IDX_5PM] * scale,
    annualKwh: b.base.annual_kwh_per_100kw * scale,
  };
}

export type View = "peak_day" | "summer_weekday";

export function series(b: BuildingData, view: View, size: SizePct, controller: Controller, peakKw: number) {
  const scale = peakKw / 100;
  const sc = b.scen[scenarioKey(size, controller)];
  return {
    without: b.base[view].map((v) => v * scale),
    withBattery: sc[view].map((v) => v * scale),
  };
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => (typeof c === "number" ? String(Math.round(c * 100) / 100) : `"${String(c).replace(/"/g, '""')}"`)).join(",")).join("\n");
}

export function download(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
export const kw = (v: number) => `${Math.round(v).toLocaleString("en-US")} kW`;
