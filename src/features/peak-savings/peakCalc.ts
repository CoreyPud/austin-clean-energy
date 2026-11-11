// peakCalc.ts: types, defaults and all math for the Peak Savings Calculator. No dependencies.

export type MeasureType = "led" | "hvac" | "dr" | "battery" | "custom";
export type Ownership = "buy" | "third";

export const MEASURES: Record<MeasureType, { label: string; kw: number; kwh: number; cost: number; om: number; life: number; omLabel: string }> = {
  led: { label: "Efficiency (lighting, controls)", kw: 10, kwh: 35000, cost: 3500, om: 0, life: 12, omLabel: "Annual operating cost, $/yr" },
  hvac: { label: "Efficiency (HVAC, chiller)", kw: 10, kwh: 12000, cost: 9000, om: 0, life: 15, omLabel: "Annual operating cost, $/yr" },
  dr: { label: "Demand response", kw: 25, kwh: 0, cost: 1500, om: 625, life: 10, omLabel: "Annual program cost, $/yr" },
  battery: { label: "Battery", kw: 25, kwh: 0, cost: 104000, om: 4400, life: 15, omLabel: "Annual operating cost, $/yr" },
  custom: { label: "Custom", kw: 0, kwh: 0, cost: 0, om: 0, life: 10, omLabel: "Annual operating cost, $/yr" },
};

export interface Inputs {
  demandCharge: number; // $/kW-month
  regCharge: number; // $/kW-month
  energyRate: number; // $/kWh
  capturePct: number; // % of months the measure lowers the billed peak
  rateEscPct: number;
  kw: number; // kW removed from monthly peak
  kwh: number; // kWh saved per year
  upfront: number;
  rebate: number;
  creditPct: number;
  om: number;
  degPct: number;
  life: number;
  discPct: number;
  omEscPct: number;
  annualOverride?: number; // replaces the first-year savings (used by the utility view)
  thirdPartySharePct?: number; // when set, owner pays this share of demand savings, no upfront cost
  extraIncome?: number; // flat yearly payment received (Design 2: Austin Energy pays the host); not escalated, loses the yearly degradation
}

export interface Outcome {
  netCost: number;
  savings: number[]; // index 0 = year 1
  om: number[];
  cashflow: number[]; // index 0 = year 0
  cumulative: number[];
  irr: number | null; // as a fraction
  npv: number;
  payback: number | null;
  y1Demand: number;
  y1Energy: number;
  y1Net: number;
  totalSavings: number;
  netGain: number;
  neededExtra: number; // extra yearly savings needed for the discount rate
  thirdParty: boolean;
  ownerPayment1: number;
  y1Extra: number;
}

export const totalDemandRate = (i: Pick<Inputs, "demandCharge" | "regCharge">) => i.demandCharge + i.regCharge;

export function irrOf(cf: number[]): number | null {
  const total = cf.reduce((a, c) => a + c, 0);
  if (!(total > 0) || cf[0] >= 0) return null;
  const f = (r: number) => cf.reduce((a, c, t) => a + c / Math.pow(1 + r, t), 0);
  let lo = -0.99, hi = 20;
  if (f(lo) * f(hi) > 0) return null;
  for (let k = 0; k < 300; k++) {
    const m = (lo + hi) / 2;
    if (f(lo) * f(m) <= 0) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
}

export function run(i: Inputs): Outcome {
  const D = totalDemandRate(i);
  const cap = i.capturePct / 100;
  const esc = i.rateEscPct / 100, deg = i.degPct / 100, infl = i.omEscPct / 100, disc = i.discPct / 100;
  const third = i.thirdPartySharePct !== undefined;
  const base = i.annualOverride !== undefined ? i.annualOverride : i.kw * D * 12 * cap + i.kwh * i.energyRate;
  const demandPart = i.annualOverride !== undefined ? i.annualOverride : i.kw * D * 12 * cap;
  const energyPart = i.annualOverride !== undefined ? 0 : i.kwh * i.energyRate;
  const netCost = third ? 0 : i.upfront * (1 - i.creditPct / 100) - i.rebate;
  const savings: number[] = [];
  const om: number[] = [];
  const cashflow: number[] = [-netCost];
  let ownerPayment1 = 0;
  for (let t = 1; t <= i.life; t++) {
    const g = Math.pow(1 + esc, t - 1) * Math.pow(1 - deg, t - 1);
    const extra = (i.extraIncome ?? 0) * Math.pow(1 - deg, t - 1);
    let s = base * g + extra;
    let o = i.om * Math.pow(1 + infl, t - 1);
    if (third) {
      const pay = demandPart * g * ((i.thirdPartySharePct as number) / 100);
      if (t === 1) ownerPayment1 = pay;
      s = demandPart * g - pay + extra;
      o = 0;
    }
    savings.push(s);
    om.push(o);
    cashflow.push(s - o);
  }
  const cumulative: number[] = [];
  cashflow.reduce((a, c, idx) => { const n = a + c; cumulative[idx] = n; return n; }, 0);
  const npv = cashflow.reduce((a, c, t) => a + c / Math.pow(1 + disc, t), 0);
  let payback: number | null = null;
  for (let t = 1; t <= i.life; t++) if (cumulative[t] >= 0) { payback = t; break; }
  const crf = disc === 0 ? 1 / i.life : disc / (1 - Math.pow(1 + disc, -i.life));
  const neededExtra = third ? 0 : Math.max(0, netCost * crf + (om[0] ?? 0) - (savings[0] ?? 0));
  const totalSavings = savings.reduce((a, c) => a + c, 0);
  const totalOm = om.reduce((a, c) => a + c, 0);
  return {
    netCost, savings, om, cashflow, cumulative,
    irr: third ? null : irrOf(cashflow),
    npv, payback,
    y1Demand: third ? demandPart - ownerPayment1 : demandPart,
    y1Energy: energyPart,
    y1Net: (savings[0] ?? 0) - (om[0] ?? 0),
    totalSavings, netGain: totalSavings - totalOm - netCost,
    neededExtra, thirdParty: third, ownerPayment1, y1Extra: i.extraIncome ?? 0,
  };
}

export function sensitivity(i: Inputs, captures = [25, 50, 75, 100], costPcts = [80, 100, 120]) {
  return costPcts.map((cp) => ({
    costPct: cp,
    cells: captures.map((c) => run({ ...i, capturePct: c, upfront: i.upfront * (cp / 100), rebate: i.rebate }).irr),
  }));
}

export interface UtilityInputs { kw: number; ratePerKwYear: number; lossPct: number; customers: number }
export function utilityValue(u: UtilityInputs) {
  const annual = u.kw * (1 + u.lossPct / 100) * u.ratePerKwYear;
  return { annual, perCustomer: u.customers > 0 ? annual / u.customers : 0 };
}

export const usd = (v: number) => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v)).toLocaleString("en-US")}`;
export const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map((c) => (typeof c === "number" ? String(Math.round(c * 100) / 100) : `"${String(c).replace(/"/g, '""')}"`)).join(",")).join("\n");
}
export function download(filename: string, text: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* Design 2 for a battery: held for the Austin Energy system peak, and Austin Energy pays the host. */
export const SUMMER_SHARE_LOST = 4 / 12; // June to September are given to the system peak
export function design2Terms(batteryKw: number, shaveKw: number, keepPct: number, hitPct: number, payPerKwYear: number) {
  return {
    ownerKw: shaveKw * (keepPct / 100), // kW removed from the owner's own monthly peaks
    payment: batteryKw * (hitPct / 100) * payPerKwYear, // yearly payment from Austin Energy
  };
}
