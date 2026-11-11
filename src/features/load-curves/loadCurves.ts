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

/* ---------------- Design 2: battery held for the Austin Energy system peak ---------------- */
// Design 1 (owner): the battery cuts the building's own monthly peak (the scenarios in the data file).
// Design 2 (AE system peak): on forecast system-peak days the battery discharges at full power for two
// hours across the utility peak (3:30 to 5:30 pm standard time = 4:30 to 6:30 pm daylight time) and
// recharges overnight. Times in the data are standard time.
export type Design = "owner" | "ae";
export const AE_FIRST = 62; // 3:30 pm standard
export const AE_LAST = 69; // last 15-minute step of the 2-hour window
export const SYS_FIRST = 64; // 4:00 pm standard = 5:00 pm daylight, where the 4CP intervals have landed
export const SYS_LAST = 67;
export const DEFAULT_TRANS_RATE = 65; // $/kW-year, rough estimate
export const DEFAULT_LOSS_PCT = 6;
export const SUMMER_MONTHS = [5, 6, 7, 8]; // Jun..Sep (0-based)

export function design2Day(base: number[], size: SizePct, rte: number): number[] {
  const P = size; // kW per 100 kW building peak
  const out = base.slice();
  for (let i = AE_FIRST; i <= AE_LAST; i++) out[i] = base[i] - Math.min(P, base[i]);
  const chargeKw = (2 * P) / rte / 6; // 2 hours of output, spread over six overnight hours
  for (let i = 0; i < 24; i++) out[i] = base[i] + chargeKw;
  return out;
}

export interface Design2Results {
  kwCutAtSystemPeak: number; // kW cut at the system-peak intervals if the battery is ready
  expectedKwCut: number; // times the chance the battery is ready
  aeValue: number; // $/year value to the utility system
  ownerSavings: number; // $/year the owner still saves on the bill
  ownerSavingsDesign1: number;
  ownerGivesUp: number; // owner savings given up versus Design 1
  surplus: number; // AE value minus what the owner gives up
  monthlyAfter: number[]; // kW by month, Design 2
  monthlyCostAfter: number[];
  summerPeakCutPct: number; // how much the worst-day building peak falls under Design 2
}

export function computeDesign2(b: BuildingData, peakKw: number, size: SizePct, controller: Controller, rate: number, rte: number, hitPct: number, transRate: number, lossPct: number): Design2Results {
  const scale = peakKw / 100;
  const d1 = compute(b, peakKw, size, controller, rate);
  const pd = b.base.peak_day;
  const pd2 = design2Day(pd, size, rte);
  const f = Math.max(0, (Math.max(...pd) - Math.max(...pd2)) / Math.max(...pd));
  const sc = b.scen[scenarioKey(size, controller)];
  const monthlyAfter = b.base.monthly_peak.map((v, m) => (SUMMER_MONTHS.includes(m) ? v * (1 - f * (hitPct / 100)) : sc.monthly_peak[m]) * scale);
  const monthlyCostAfter = monthlyAfter.map((v) => v * rate);
  const ownerSavings = d1.annualCostBefore - monthlyCostAfter.reduce((a, c) => a + c, 0);
  let cut = Infinity;
  for (let i = SYS_FIRST; i <= SYS_LAST; i++) cut = Math.min(cut, pd[i] - pd2[i]);
  const kwCutAtSystemPeak = Math.max(0, cut) * scale;
  const expectedKwCut = kwCutAtSystemPeak * (hitPct / 100);
  const aeValue = expectedKwCut * (1 + lossPct / 100) * transRate;
  const ownerGivesUp = Math.max(0, d1.annualSavings - ownerSavings);
  return { kwCutAtSystemPeak, expectedKwCut, aeValue, ownerSavings, ownerSavingsDesign1: d1.annualSavings, ownerGivesUp, surplus: aeValue - ownerGivesUp, monthlyAfter, monthlyCostAfter, summerPeakCutPct: f * (hitPct / 100) * 100 };
}

export function seriesDesign2(b: BuildingData, view: View, size: SizePct, peakKw: number, rte: number) {
  const scale = peakKw / 100;
  return { without: b.base[view].map((v) => v * scale), withBattery: design2Day(b.base[view], size, rte).map((v) => v * scale) };
}
