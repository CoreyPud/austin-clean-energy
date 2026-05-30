// Solar financial model for Austin Energy (Value of Solar plan).
// Ported from solar-austin/personal-solar/{config,calculations,solar-model}.js

// ── Constants ─────────────────────────────────────────────────────────────────

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_DAYS  = [31,28,31,30,31,30,31,31,30,31,30,31];
export const FINANCIAL_HORIZON_YEARS = 30;

const DAYLIGHT_HOURS_BY_MONTH = [10.2,10.8,11.8,12.8,13.6,14.1,13.8,13.1,12.2,11.3,10.5,10.0];
const FALLBACK_SOLAR_PROFILE_EXPONENT = 1.35;

// Normalised monthly solar production weights (Austin, Jan–Dec)
const RAW_SOLAR_PROFILE = [0.78,0.86,0.99,1.06,1.11,1.10,1.07,1.01,0.96,0.91,0.82,0.74];

// Normalised hourly load profile (midnight → 11 pm)
const RAW_HOURLY_LOAD = [0.62,0.56,0.53,0.51,0.52,0.58,0.71,0.82,0.85,0.81,0.77,0.75,
                          0.76,0.79,0.84,0.92,1.00,0.98,0.94,0.90,0.88,0.83,0.76,0.68];

export const MONTHLY_SOLAR_PROFILE = normalizeProfile(RAW_SOLAR_PROFILE);
const HOURLY_LOAD_PROFILE          = normalizeProfile(RAW_HOURLY_LOAD);

// Austin Energy tiered rates (2025)
export const AUSTIN_ENERGY_RATES = {
  customerCharge: 16.50,
  vosRate: 0.126,
  citySalesTaxRate: 0.01,
  tierRates: [
    { maxKwh: 300,      rate: 0.04640 },
    { maxKwh: 900,      rate: 0.05138 },
    { maxKwh: 2000,     rate: 0.07525 },
    { maxKwh: Infinity, rate: 0.10884 },
  ],
  perKwhCharges: {
    powerSupplyAdjustment: 0.04118,
    psaAdminAdjustment:   -0.00206,
    regulatoryCharge:      0.01338,
    communityBenefitCharge:0.01275,
  },
};

export const AUSTIN_ENERGY_SOLAR_REBATE = 2500; // residential default

export function austinEnergyRebate(systemKw: number, propertyType: string): number {
  const watts = systemKw * 1000;
  switch (propertyType) {
    case "commercial":
      return watts * 0.50; // $0.50/W, no cap specified
    case "non-profit":
      return watts * 0.70; // $0.70/W, no cap specified
    case "multi-family":
      return 0; // virtual net metering — separate program, no upfront rebate
    default: // single-family, condo
      return 2500;
  }
}
// Berkeley Lab 2024 regression for Austin residential installs
const AUSTIN_INSTALL_COST_INTERCEPT  = 4800;
export const AUSTIN_INSTALL_COST_PER_KW = 2950;
const AUSTIN_BATTERY_COST_PER_KWH   = 1000;

export const DEFAULT_PRODUCTION_PER_KW = 1500; // kWh/kW-year (Austin avg)
export const DEFAULT_MONTHLY_USAGE_KWH = 1167;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeProfile(values: number[]): number[] {
  const total = values.reduce((s, v) => s + v, 0);
  if (!Number.isFinite(total) || total <= 0) {
    const w = values.length > 0 ? 1 / values.length : 0;
    return values.map(() => w);
  }
  return values.map(v => v / total);
}

function sumBy<T>(rows: T[], key: keyof T): number {
  return rows.reduce((s, r) => s + (r[key] as number), 0);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// ── Austin Energy billing ─────────────────────────────────────────────────────

export function calculateAustinEnergyUsageBill(usageKwh: number, vosSolarCredit = 0) {
  const safe = Math.max(0, usageKwh);
  let remaining = safe;
  let prev = 0;
  let tierCharge = 0;

  for (const tier of AUSTIN_ENERGY_RATES.tierRates) {
    if (remaining <= 0) break;
    const span = Number.isFinite(tier.maxKwh) ? Math.max(0, tier.maxKwh - prev) : remaining;
    const billed = Math.min(remaining, span);
    tierCharge += billed * tier.rate;
    remaining -= billed;
    prev = tier.maxKwh;
  }

  const perKwh = Object.values(AUSTIN_ENERGY_RATES.perKwhCharges).reduce((s, r) => s + r, 0);
  const kwhCharges = tierCharge + safe * perKwh;
  // VoS credits offset kWh-based charges only; the fixed customer charge is always owed
  const creditsApplied = Math.min(Math.max(0, vosSolarCredit), kwhCharges);
  const unusedCredit = Math.max(0, vosSolarCredit - kwhCharges);
  const subtotal = AUSTIN_ENERGY_RATES.customerCharge + kwhCharges - creditsApplied;
  const tax = subtotal * AUSTIN_ENERGY_RATES.citySalesTaxRate;
  return { subtotalBeforeTax: subtotal, citySalesTax: tax, total: subtotal + tax, unusedCredit };
}

/** Binary-search inverse of calculateAustinEnergyUsageBill. */
export function billToMonthlyKwh(monthlyBill: number): number {
  let lo = 0, hi = 100000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (calculateAustinEnergyUsageBill(mid).total < monthlyBill) lo = mid;
    else hi = mid;
  }
  return Math.max(0, Math.round((lo + hi) / 2));
}

// ── Install cost ─────────────────────────────────────────────────────────────

export function austinInstallCost(systemKw: number, batteryKwh = 0): number {
  const solar = AUSTIN_INSTALL_COST_INTERCEPT + AUSTIN_INSTALL_COST_PER_KW * Math.max(0, systemKw);
  const battery = batteryKwh * AUSTIN_BATTERY_COST_PER_KWH;
  return solar + battery;
}

// ── Hourly solar shape ────────────────────────────────────────────────────────

function buildMonthlySolarHourlyProfile(monthIndex: number): number[] {
  const daylightHours = DAYLIGHT_HOURS_BY_MONTH[monthIndex] ?? 12;
  const sunrise = 12 - daylightHours / 2;
  const sunset  = 12 + daylightHours / 2;
  const raw = Array.from({ length: 24 }, (_, hour) => {
    const h = hour + 0.5;
    if (h <= sunrise || h >= sunset) return 0;
    const progress = (h - sunrise) / Math.max(0.01, sunset - sunrise);
    return Math.pow(Math.sin(Math.PI * progress), FALLBACK_SOLAR_PROFILE_EXPONENT);
  });
  return normalizeProfile(raw);
}

// ── Monthly energy flow (hourly battery dispatch) ─────────────────────────────

function simulateMonthlyFlow(
  monthlyUsage: number,
  monthlySolar: number,
  monthIndex: number,
  daysInMonth: number,
  batteryCapacityKwh = 0,
) {
  const solarProfile = buildMonthlySolarHourlyProfile(monthIndex);
  const batteryPower = batteryCapacityKwh / 2; // 2-hour discharge rate
  let imported = 0, exported = 0, directSolar = 0, batteryDischarge = 0;

  for (let day = 0; day < daysInMonth; day++) {
    let soc = 0;
    for (let hour = 0; hour < 24; hour++) {
      const load  = (monthlyUsage * HOURLY_LOAD_PROFILE[hour]) / daysInMonth;
      const solar = (monthlySolar * solarProfile[hour]) / daysInMonth;
      directSolar += Math.min(load, solar);
      const net = solar - load;

      if (net >= 0) {
        const charge = Math.min(net, batteryPower, batteryCapacityKwh - soc);
        soc += charge;
        exported += Math.max(0, net - charge);
      } else {
        const deficit = Math.max(0, load - solar);
        const discharge = Math.min(deficit, batteryPower, soc);
        soc -= discharge;
        batteryDischarge += discharge;
        imported += Math.max(0, deficit - discharge);
      }
    }
  }
  return { imported, exported, directSolar, batteryDischarge };
}

// ── Model types ───────────────────────────────────────────────────────────────

export interface CalcInputs {
  annualUsageKwh: number;
  systemKw: number;
  batteryKwh: number;
  loanTermYears: number;
  loanInterestRate: number;   // decimal
  productionPerKw: number;    // kWh/kW-year
  monthlyUsageKwh?: number[]; // 12-element array from uploaded bill; overrides annualUsageKwh profile
}

export interface MonthRow {
  month: string;
  usage: number;
  solar: number;
  billWithoutSolar: number;
  billWithSolar: number;
  billSavings: number;
  exportCredits: number;
}

export interface YearResult {
  monthlyRows: MonthRow[];
  billWithoutSolar: number;
  billWithSolar: number;
  savings: number;
  solarTotal: number;
  usageTotal: number;
}

export interface ThirtyYearResult {
  yearlyResults: YearResult[];
  totalInstallCost: number;
  totalSavings: number;
  paybackYear: number | null;
  hasLoan: boolean;
  annualLoanPayment: number;
  cumulativeByYear: { year: number; cumulative: number }[];
}

// ── Year model ────────────────────────────────────────────────────────────────

export function buildYearModel(
  inputs: CalcInputs,
  yearIndex = 0,
  startingCreditBalance = 0,
): YearResult {
  const degradation = Math.pow(1 - 0.005, yearIndex);
  const annualSolar = inputs.systemKw * inputs.productionPerKw * degradation;
  let creditBalance = Math.max(0, startingCreditBalance);

  const monthlyRows: MonthRow[] = MONTHS.map((month, mi) => {
    const usage = inputs.monthlyUsageKwh
      ? (inputs.monthlyUsageKwh[mi] ?? inputs.annualUsageKwh / 12)
      : inputs.annualUsageKwh * MONTHLY_SOLAR_PROFILE[mi];
    const solar = annualSolar * MONTHLY_SOLAR_PROFILE[mi];

    const flow = simulateMonthlyFlow(usage, solar, mi, MONTH_DAYS[mi], inputs.batteryKwh);

    const billWithoutSolar = calculateAustinEnergyUsageBill(usage).total;
    const exportCredits = solar * AUSTIN_ENERGY_RATES.vosRate;
    // Combine new export credits with any carryover; unused portion rolls to next month
    const billedResult = calculateAustinEnergyUsageBill(usage, exportCredits + creditBalance);
    const billWithSolar = billedResult.total;
    creditBalance = billedResult.unusedCredit;

    return {
      month,
      usage,
      solar,
      billWithoutSolar,
      billWithSolar,
      billSavings: billWithoutSolar - billWithSolar,
      exportCredits,
    };
  });

  return {
    monthlyRows,
    billWithoutSolar: sumBy(monthlyRows, 'billWithoutSolar'),
    billWithSolar: sumBy(monthlyRows, 'billWithSolar'),
    savings: sumBy(monthlyRows, 'billSavings'),
    solarTotal: sumBy(monthlyRows, 'solar'),
    usageTotal: sumBy(monthlyRows, 'usage'),
  };
}

// ── 30-year model ─────────────────────────────────────────────────────────────

export function calculateAnnualLoanPayment(principal: number, annualRate: number, termYears: number) {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / termYears;
  const r = annualRate / 12;
  const n = termYears * 12;
  return (principal * r / (1 - Math.pow(1 + r, -n))) * 12;
}

export function buildThirtyYearModel(inputs: CalcInputs, installCost: number): ThirtyYearResult {
  let creditBalance = 0;
  const yearlyResults: YearResult[] = [];

  for (let y = 0; y < FINANCIAL_HORIZON_YEARS; y++) {
    const result = buildYearModel(inputs, y, creditBalance);
    creditBalance = 0; // simplified: no credit carryover across years for now
    yearlyResults.push(result);
  }

  const hasLoan = inputs.loanTermYears > 0;
  const annualLoanPayment = hasLoan
    ? calculateAnnualLoanPayment(installCost, inputs.loanInterestRate, inputs.loanTermYears)
    : 0;

  let cumulative = hasLoan ? 0 : -installCost;
  let paybackYear: number | null = null;
  const cumulativeByYear: { year: number; cumulative: number }[] = [];

  yearlyResults.forEach((r, i) => {
    const loanPayment = i < inputs.loanTermYears ? annualLoanPayment : 0;
    cumulative += r.savings - loanPayment;
    if (paybackYear === null && cumulative >= 0) paybackYear = i + 1;
    cumulativeByYear.push({ year: i + 1, cumulative: Math.round(cumulative) });
  });

  return {
    yearlyResults,
    totalInstallCost: installCost,
    totalSavings: sumBy(yearlyResults, 'savings'),
    paybackYear,
    hasLoan,
    annualLoanPayment,
    cumulativeByYear,
  };
}

// ── Environmental impact ──────────────────────────────────────────────────────

// Fallback matches Google's carbonOffsetFactorKgPerMwh methodology for ERCOT/Austin (~400 kg/MWh).
// Use the live Google value when available — pass carbonOffsetKgPerMwh in kg/MWh.
const CO2_PER_KWH_FALLBACK   = 0.000400; // metric tons CO2 / kWh (ERCOT grid approx)
const TONS_CO2_PER_CAR_MILE  = 0.000404; // metric tons CO2 / mile
const TONS_CO2_PER_TREE      = 0.021;    // metric tons CO2 / tree / year
const TONS_CO2_PER_FLIGHT    = 1.0;      // metric tons CO2 / long-haul flight

export function environmentalImpact(annualSolarKwh: number, carbonOffsetKgPerMwh?: number | null) {
  const co2PerKwh = carbonOffsetKgPerMwh ? carbonOffsetKgPerMwh / 1_000_000 : CO2_PER_KWH_FALLBACK;
  const metricTonsCo2 = annualSolarKwh * co2PerKwh;
  return {
    metricTonsCo2: Math.round(metricTonsCo2 * 10) / 10,
    carMilesAvoided: Math.round(metricTonsCo2 / TONS_CO2_PER_CAR_MILE),
    treesEquivalent: Math.round(metricTonsCo2 / TONS_CO2_PER_TREE),
    flightsAvoided: Math.round(metricTonsCo2 / TONS_CO2_PER_FLIGHT),
  };
}
