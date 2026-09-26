// Solar financial model for Austin Energy (Value of Solar plan).
// Ported from solar-austin/personal-solar/{config,calculations,solar-model}.js

// ── Constants ─────────────────────────────────────────────────────────────────

// Shared with the edge functions and scripts; see that file. Re-exported so app code keeps
// importing everything solar from "@/lib/solar-model".
import {
  VOS_RATE,
  AUSTIN_ENERGY_SOLAR_REBATE,
  AUSTIN_ENERGY_SOLAR_REBATE_MIN_KW,
  PANEL_DEGRADATION_RATE,
} from "../../supabase/functions/_shared/solar-rates";
export {
  VOS_RATE,
  AUSTIN_ENERGY_SOLAR_REBATE,
  AUSTIN_ENERGY_SOLAR_REBATE_MIN_KW,
  AUSTIN_INSTALL_COST_PER_KW,
  SYSTEM_DERATE,
  DEFAULT_PRODUCTION_PER_KW,
  PANEL_DEGRADATION_RATE,
} from "../../supabase/functions/_shared/solar-rates";

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const FINANCIAL_HORIZON_YEARS = 30;

// Normalised monthly solar production weights (Austin, Jan–Dec)
const RAW_SOLAR_PROFILE = [0.78,0.86,0.99,1.06,1.11,1.10,1.07,1.01,0.96,0.91,0.82,0.74];

export const MONTHLY_SOLAR_PROFILE = normalizeProfile(RAW_SOLAR_PROFILE);

// Austin Energy tiered rates (2025)
export const AUSTIN_ENERGY_RATES = {
  customerCharge: 16.50,
  vosRate: VOS_RATE,
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

// Capacity-Based Incentive (CBI) eligibility cutoff for for-profit commercial: per Austin
// Energy's CBI guidelines, only systems under this size can choose CBI; at or above it, the
// system is PBI-only (see PBI section below) and gets $0 CBI, not a capped amount.
export const PBI_MIN_KW = 100;
export const COMMERCIAL_CBI_PER_W = 0.70;   // $/W, for-profit commercial, only under PBI_MIN_KW
export const NONPROFIT_CBI_PER_W = 1.00;    // $/W
export const NONPROFIT_CBI_CAP_KW = 200;    // non-profit rebate applies to the first 200 kW

export function austinEnergyRebate(systemKw: number, propertyType: string): number {
  switch (propertyType) {
    case "commercial":
      return systemKw < PBI_MIN_KW ? systemKw * 1000 * COMMERCIAL_CBI_PER_W : 0;
    case "non-profit":
      return Math.min(systemKw, NONPROFIT_CBI_CAP_KW) * 1000 * NONPROFIT_CBI_PER_W;
    case "multi-family":
      return 0; // AE multifamily CBI ($0.60/W, cap $2,500/unit) not modeled yet: needs unit count
    default: // single-family, condo: flat rebate at or above the minimum size
      return systemKw >= AUSTIN_ENERGY_SOLAR_REBATE_MIN_KW ? AUSTIN_ENERGY_SOLAR_REBATE : 0;
  }
}

// Performance-Based Incentive (PBI) — paid per kWh generated over 5 years
export const COMMERCIAL_PBI_YEARS = 5;

/** PBI rate tiers by system size, largest first. $/kWh. */
export const PBI_RATE_TIERS = [
  { minKw: 1000, rate: 0.06, label: "Extra-Large" },
  { minKw: 400,  rate: 0.08, label: "Large" },
  { minKw: 0,    rate: 0.10, label: "Medium" },
] as const;

export function pbiTier(systemKw: number) {
  return PBI_RATE_TIERS.find(t => systemKw >= t.minKw) ?? PBI_RATE_TIERS[PBI_RATE_TIERS.length - 1];
}

export function commercialPbiRate(systemKw: number): number {
  return pbiTier(systemKw).rate;
}

export function commercialPbiBenefit(systemKw: number, productionPerKw: number): number {
  return systemKw * productionPerKw * commercialPbiRate(systemKw) * COMMERCIAL_PBI_YEARS;
}

// ── Long-run assumptions behind the breakeven / payback year ──────────────────
// (Panel degradation, PANEL_DEGRADATION_RATE, is in the shared solar-rates file.)
// Electricity price escalation applied to avoided-bill savings. Austin Energy's residential
// rates have risen a little over 2%/yr on a long-run average; 2.5% is a deliberately
// conservative middle figure. Without it, payback is overstated because the model would
// hold 2025 rates flat for 30 years while system cost is paid in today's dollars.
export const UTILITY_RATE_ESCALATION = 0.025;
// One inverter replacement partway through the term -- a real owner cost that a payback
// figure has to carry. String inverters typically last 12-15 years; $0.20/W is in line with
// current replacement pricing including labor.
export const INVERTER_REPLACEMENT_YEAR = 15;    // 1-indexed
export const INVERTER_REPLACEMENT_PER_W = 0.20; // $/W of DC system size

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

// ── Model types ───────────────────────────────────────────────────────────────

export interface CalcInputs {
  annualUsageKwh: number;
  systemKw: number;
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
  const degradation = Math.pow(1 - PANEL_DEGRADATION_RATE, yearIndex);
  const annualSolar = inputs.systemKw * inputs.productionPerKw * degradation;
  let creditBalance = Math.max(0, startingCreditBalance);

  const monthlyRows: MonthRow[] = MONTHS.map((month, mi) => {
    const usage = inputs.monthlyUsageKwh
      ? (inputs.monthlyUsageKwh[mi] ?? inputs.annualUsageKwh / 12)
      : inputs.annualUsageKwh * MONTHLY_SOLAR_PROFILE[mi];
    const solar = annualSolar * MONTHLY_SOLAR_PROFILE[mi];

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
  let totalSavings = 0;
  const cumulativeByYear: { year: number; cumulative: number }[] = [];

  // Each year's bill savings are computed at today's rates (with panel degradation already
  // applied in buildYearModel), then escalated for electricity price inflation. The one-time
  // inverter replacement is charged in its year, so breakeven reflects a real owner cost
  // rather than assuming the hardware never needs work.
  yearlyResults.forEach((r, i) => {
    const year = i + 1;
    const loanPayment = i < inputs.loanTermYears ? annualLoanPayment : 0;
    const escalatedSavings = r.savings * Math.pow(1 + UTILITY_RATE_ESCALATION, i);
    const inverterCost = year === INVERTER_REPLACEMENT_YEAR
      ? inputs.systemKw * 1000 * INVERTER_REPLACEMENT_PER_W
      : 0;
    totalSavings += escalatedSavings - inverterCost;
    cumulative += escalatedSavings - inverterCost - loanPayment;
    if (paybackYear === null && cumulative >= 0) paybackYear = year;
    cumulativeByYear.push({ year, cumulative: Math.round(cumulative) });
  });

  return {
    yearlyResults,
    totalInstallCost: installCost,
    totalSavings: Math.round(totalSavings),

    paybackYear,
    hasLoan,
    annualLoanPayment,
    cumulativeByYear,
  };
}

// ── Performance-Based Incentive (PBI) ────────────────────────────────────────
// On-bill credit for the first 5 years, paid in addition to Value of Solar (not a
// replacement, and not an upfront rebate like CBI). Rate tier is fixed by system size.

export interface PbiYearRow {
  year: number;
  credit: number;
}

export interface PbiModel {
  rate: number;
  annualCredit: number;
  totalFiveYearCredit: number;
  yearlyRows: PbiYearRow[];
}

export function buildPbiModel(systemKw: number, productionPerKw: number): PbiModel {
  const rate = commercialPbiRate(systemKw);
  const annualKwh = systemKw * productionPerKw;
  const annualCredit = annualKwh * rate;

  const yearlyRows: PbiYearRow[] = [];
  let totalFiveYearCredit = 0;
  for (let y = 0; y < FINANCIAL_HORIZON_YEARS; y++) {
    const year = y + 1;
    const credit = year <= COMMERCIAL_PBI_YEARS ? annualKwh * Math.pow(1 - PANEL_DEGRADATION_RATE, y) * rate : 0;
    if (year <= COMMERCIAL_PBI_YEARS) totalFiveYearCredit += credit;
    yearlyRows.push({ year, credit: Math.round(credit) });
  }

  return { rate, annualCredit, totalFiveYearCredit: Math.round(totalFiveYearCredit), yearlyRows };
}

/**
 * Layers PBI's yearly credits onto an existing VoS cumulative stream and recomputes payback.
 * Overlays on `cumulativeByYear` (which already correctly accounts for loan payments, if any)
 * rather than re-deriving cumulative cash flow from scratch, since ThirtyYearResult doesn't
 * expose per-year loan payment data outside of buildThirtyYearModel's own internal loop.
 */
export function mergePbiIntoThirtyYear(thirtyYear: ThirtyYearResult, pbi: PbiModel): ThirtyYearResult {
  let paybackYear: number | null = null;
  let runningPbi = 0;
  const cumulativeByYear = thirtyYear.cumulativeByYear.map((row, i) => {
    runningPbi += pbi.yearlyRows[i]?.credit ?? 0;
    const cumulative = row.cumulative + runningPbi;
    if (paybackYear === null && cumulative >= 0) paybackYear = row.year;
    return { year: row.year, cumulative };
  });

  return {
    ...thirtyYear,
    totalSavings: thirtyYear.totalSavings + pbi.totalFiveYearCredit,
    paybackYear,
    cumulativeByYear,
  };
}

// ── Solar Standard Offer (SSO) ───────────────────────────────────────────────

export const SSO_RATE_UNDER_1MW = 0.11;    // $/kWh, systems < 1 MW-ac
export const SSO_RATE_OVER_1MW  = 0.0841;  // $/kWh, systems >= 1 MW-ac
export const SSO_MIN_KW         = 50;       // program minimum -- also the threshold for showing the SSO/VoS toggle at all

// Rate escalation, O&M, and inverter replacement, backed out of a TPO pro forma for a
// sub-1MW commercial system. The pro forma prices third-party ownership (lease payment
// out, tax benefits kept by the TPO); we instead assume the property owner installs and
// owns the system outright, so no lease payment and no ITC/depreciation modeled here —
// the federal ITC's commissioning-deadline status is not something to hardcode as a
// live constant.
//
// The rate-step schedule below is the pro forma author's own projection, not Austin
// Energy policy — confirmed against AE's actual Solar Standard Offer Rider tariff
// (effective 11/1/2025). The real mechanism: the rate holds for 3 years, then resets
// based on the trailing 5-year average of ERCOT-market-derived avoided energy,
// transmission, and ancillary-services costs — it can rise or fall, and there's no
// guaranteed floor beyond the currently published rate. Kept as a fixed step-up here
// as a simplifying stand-in so the SSO model isn't flat forever, not because we
// believe the rate is contractually guaranteed to rise on this schedule.
export const SSO_RATE_STEP = 0.02;               // $/kWh added at each escalation year
export const SSO_RATE_STEP_YEARS = [6, 11, 16];  // 1-indexed year each step starts, then holds

export const SSO_OM_PER_KW_YEAR = 10;                          // $/kW/year: insurance, monitoring, maintenance
export const SSO_OM_ESCALATION = 0.02;                         // per year
export const SSO_INVERTER_REPLACEMENT_PER_KW = 88_000 / 1300;  // $/kW, one-time
export const SSO_INVERTER_REPLACEMENT_YEAR = 14;               // 1-indexed year of the swap

export function ssoRate(systemKw: number, year = 1): number {
  const base = systemKw >= 1000 ? SSO_RATE_OVER_1MW : SSO_RATE_UNDER_1MW;
  const steps = SSO_RATE_STEP_YEARS.filter(stepYear => year >= stepYear).length;
  return base + steps * SSO_RATE_STEP;
}

export function buildSsoModel(systemKw: number, productionPerKw: number, installCost: number) {
  const annualKwh = systemKw * productionPerKw;
  const rate = ssoRate(systemKw, 1);
  const annualRevenue = annualKwh * rate;

  let cumulative = -installCost;
  let paybackYear: number | null = null;
  const cumulativeByYear: { year: number; cumulative: number }[] = [];

  for (let y = 0; y < FINANCIAL_HORIZON_YEARS; y++) {
    const year = y + 1;
    const degradedKwh = annualKwh * Math.pow(1 - PANEL_DEGRADATION_RATE, y);
    const revenue = degradedKwh * ssoRate(systemKw, year);
    const om = systemKw * SSO_OM_PER_KW_YEAR * Math.pow(1 + SSO_OM_ESCALATION, y);
    const inverterCost = year === SSO_INVERTER_REPLACEMENT_YEAR
      ? systemKw * SSO_INVERTER_REPLACEMENT_PER_KW
      : 0;
    cumulative += revenue - om - inverterCost;
    if (paybackYear === null && cumulative >= 0) paybackYear = year;
    cumulativeByYear.push({ year, cumulative: Math.round(cumulative) });
  }

  const monthlyRevenue = MONTHS.map((month, mi) => ({
    month,
    revenue: Math.round(annualKwh * MONTHLY_SOLAR_PROFILE[mi] * rate),
  }));

  return { rate, annualKwh, annualRevenue, cumulativeByYear, paybackYear, monthlyRevenue };
}

// ── Environmental impact ──────────────────────────────────────────────────────

// Fallback matches Google's carbonOffsetFactorKgPerMwh methodology for ERCOT/Austin (~400 kg/MWh).
// Use the live Google value when available — pass carbonOffsetKgPerMwh in kg/MWh.
export const CO2_FALLBACK_KG_PER_MWH = 400; // ERCOT grid approx, same units as Google's factor
const CO2_PER_KWH_FALLBACK   = CO2_FALLBACK_KG_PER_MWH / 1_000_000; // metric tons CO2 / kWh
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
