// Pure math for "See the Peak". Values in the data file are kW per 100 kW of annual building peak.

export interface Curves { peak_day: number[]; summer_weekday: number[]; monthly_peak: number[] }
export interface BuildingType {
  name: string;
  buildings_100kw_plus: number;
  median_peak_kw: number;
  summer_peak_hours: number[];
  peak_day: string;
  base: Curves & { annual_kwh_per_100kw: number };
  scen: Record<string, Curves>;
}
export interface LoadCurveData {
  meta: { interval_minutes: number; points_per_day: number; units: string; battery_hours: number; rte: number; source: string };
  buildings: Record<string, BuildingType>;
}

export type Size = 10 | 20;
export type Controller = "perfect" | "forecast";

export const scenKey = (size: Size, c: Controller) => `${size}_${c}`;

export function results(b: BuildingType, peakKw: number, size: Size, c: Controller, rate: number, hours = 2) {
  const scale = peakKw / 100;
  const s = b.scen[scenKey(size, c)];
  const peakBefore = Math.max(...b.base.monthly_peak) * scale;
  const peakAfter = Math.max(...s.monthly_peak) * scale;
  const monthly = b.base.monthly_peak.map((v, m) => {
    const before = v * scale * rate;
    const after = s.monthly_peak[m] * scale * rate;
    return { before, after, savings: before - after, kwBefore: v * scale, kwAfter: s.monthly_peak[m] * scale };
  });
  const costBefore = monthly.reduce((x, m) => x + m.before, 0);
  const costAfter = monthly.reduce((x, m) => x + m.after, 0);
  const annualSavings = costBefore - costAfter;
  const batteryKw = (size / 100) * peakKw;
  return {
    scale,
    peakBefore,
    peakAfter,
    reductionKw: peakBefore - peakAfter,
    reductionPct: peakBefore > 0 ? ((peakBefore - peakAfter) / peakBefore) * 100 : 0,
    monthly,
    costBefore,
    costAfter,
    annualSavings,
    batteryKw,
    batteryKwh: batteryKw * hours,
    savingsPerBatteryKw: batteryKw > 0 ? annualSavings / batteryKw : 0,
    kw5pmBefore: b.base.summer_weekday[68] * scale,
    kw5pmAfter: s.summer_weekday[68] * scale,
    annualKwh: b.base.annual_kwh_per_100kw * scale,
  };
}

export function timeLabel(i: number): string {
  const mins = i * 15;
  const h = Math.floor(mins / 60), m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
