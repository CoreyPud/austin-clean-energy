// Pure cash-flow engine for the Peak Savings Calculator. All math runs in the browser.

export type MeasureType = "lighting" | "hvac" | "dr" | "battery" | "custom";

export const MEASURE_LABELS: Record<MeasureType, string> = {
  lighting: "Efficiency (lighting, controls)",
  hvac: "Efficiency (HVAC, chiller)",
  dr: "Demand response",
  battery: "Battery",
  custom: "Custom",
};

export interface Inputs {
  type: MeasureType;
  thirdParty: boolean;
  demandCharge: number;
  regulatoryCharge: number;
  energyRate: number;
  capturePct: number;
  rateEscPct: number;
  kwRemoved: number;
  kwhSaved: number;
  upfront: number;
  rebate: number;
  creditPct: number;
  om: number;
  degPct: number;
  life: number;
  discountPct: number;
  omEscPct: number;
  batteryKw: number;
  batteryHours: number;
  costPerKwh: number;
  shave: number;
  sharePct: number;
  buildingPeakKw: number | null;
}

const COMMON = {
  thirdParty: false,
  demandCharge: 10.32,
  regulatoryCharge: 5.03,
  energyRate: 0.0594,
  capturePct: 75,
  rateEscPct: 3,
  rebate: 0,
  discountPct: 8,
  omEscPct: 2.5,
  batteryKw: 100,
  batteryHours: 2,
  costPerKwh: 520,
  shave: 0.5,
  sharePct: 50,
  buildingPeakKw: null,
};

export function defaultsFor(type: MeasureType): Inputs {
  const base = { ...COMMON, type, creditPct: 0, degPct: 0 };
  switch (type) {
    case "lighting":
      return { ...base, kwRemoved: 10, kwhSaved: 35000, upfront: 3500, om: 0, life: 12 };
    case "hvac":
      return { ...base, kwRemoved: 10, kwhSaved: 12000, upfront: 9000, om: 0, life: 15 };
    case "dr":
      return { ...base, kwRemoved: 25, kwhSaved: 0, upfront: 1500, om: 625, life: 10 };
    case "battery":
      return { ...base, kwRemoved: 50, kwhSaved: 0, upfront: 104000, om: 4400, life: 15, creditPct: 30, degPct: 2 };
    default:
      return { ...base, kwRemoved: 0, kwhSaved: 0, upfront: 0, om: 0, life: 10 };
  }
}

/** Battery inputs override kW removed and upfront cost. */
export function effective(i: Inputs): Inputs {
  if (i.type !== "battery") return i;
  return {
    ...i,
    kwRemoved: i.batteryKw * i.shave,
    upfront: i.batteryKw * i.batteryHours * i.costPerKwh,
  };
}

export function npv(rate: number, flows: number[]): number {
  return flows.reduce((s, f, t) => s + f / Math.pow(1 + rate, t), 0);
}

export function irr(flows: number[]): number | null {
  let lo = -0.99, hi = 20;
  let flo = npv(lo, flows), fhi = npv(hi, flows);
  if (!isFinite(flo) || flo * fhi > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid, flows);
    if (fm * flo > 0) { lo = mid; flo = fm; } else { hi = mid; }
  }
  return (lo + hi) / 2;
}

export function crf(rate: number, n: number): number {
  if (rate === 0) return 1 / n;
  return (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
}

export interface YearRow { year: number; savings: number; demand: number; energy: number; om: number; payment: number; net: number; cumulative: number }

export interface Results {
  D: number;
  netCost: number;
  rows: YearRow[];
  flows: number[];
  irr: number | null;
  npv: number;
  payback: number | null;
  year1Demand: number;
  year1Energy: number;
  year1Om: number;
  year1Net: number;
  totalSavings: number;
  netGain: number;
  neededExtra: number;
  thirdParty: boolean;
}

export function calculate(raw: Inputs, overrides?: { capturePct?: number; costFactor?: number }): Results {
  const i = effective(raw);
  const D = i.demandCharge + i.regulatoryCharge;
  const cap = (overrides?.capturePct ?? i.capturePct) / 100;
  const esc = i.rateEscPct / 100, deg = i.degPct / 100, infl = i.omEscPct / 100;
  const tp = i.type === "battery" && i.thirdParty;
  const upfront = i.upfront * (overrides?.costFactor ?? 1);
  const netCost = tp ? 0 : upfront * (1 - i.creditPct / 100) - i.rebate;
  const life = Math.max(1, Math.round(i.life));
  const rows: YearRow[] = [];
  const flows = [-netCost];
  let cum = -netCost;
  for (let t = 1; t <= life; t++) {
    const f = Math.pow(1 + esc, t - 1) * Math.pow(1 - deg, t - 1);
    const demand = i.kwRemoved * D * 12 * cap * f;
    const energy = i.kwhSaved * i.energyRate * f;
    const savings = demand + energy;
    const om = tp ? 0 : i.om * Math.pow(1 + infl, t - 1);
    const payment = tp ? savings * (i.sharePct / 100) : 0;
    const net = savings - om - payment;
    cum += net;
    flows.push(net);
    rows.push({ year: t, savings, demand, energy, om, payment, net, cumulative: cum });
  }
  const paybackRow = netCost > 0 ? rows.find((r) => r.cumulative >= 0) : undefined;
  const r = i.discountPct / 100;
  const totalSavings = rows.reduce((s, x) => s + x.net, 0);
  const y1 = rows[0];
  return {
    D,
    netCost,
    rows,
    flows,
    irr: tp || netCost <= 0 ? null : irr(flows),
    npv: npv(r, flows),
    payback: paybackRow ? paybackRow.year : null,
    year1Demand: y1.demand,
    year1Energy: y1.energy,
    year1Om: y1.om,
    year1Net: y1.net,
    totalSavings,
    netGain: totalSavings - netCost,
    neededExtra: Math.max(0, netCost * crf(r, life) + y1.om - y1.savings),
    thirdParty: tp,
  };
}

export function utilityView(kw: number, ratePerKwYear: number, lossPct: number, customers: number) {
  const annual = kw * (1 + lossPct / 100) * ratePerKwYear;
  return { annual, perCustomer: customers > 0 ? annual / customers : 0 };
}

/** Same cash-flow engine applied to a flat annual utility savings stream. */
export function utilityCashFlow(annual: number, i: Inputs) {
  const e = effective(i);
  const netCost = e.upfront * (1 - e.creditPct / 100) - e.rebate;
  const flows = [-netCost];
  for (let t = 1; t <= Math.max(1, Math.round(e.life)); t++) {
    flows.push(annual * Math.pow(1 + e.rateEscPct / 100, t - 1) * Math.pow(1 - e.degPct / 100, t - 1) - e.om * Math.pow(1 + e.omEscPct / 100, t - 1));
  }
  let cum = 0, payback: number | null = null;
  flows.forEach((f, t) => { cum += f; if (payback === null && t > 0 && cum >= 0) payback = t; });
  return { netCost, irr: netCost > 0 ? irr(flows) : null, npv: npv(e.discountPct / 100, flows), payback };
}
