// Austin Energy Standard Offer pro forma — third-party owner (TPO) economics.
// Ported from Standard_offer_financial_model_stand_alone.xlsx
// ("Standard Offer Ground" tab = under 1,300 kWdc; "Standard Offer Large" tab = 1,300 kWdc and above).

export const SSO_PROFORMA_TERM_YEARS = 25;
export const SSO_SCENARIO_BREAK_KW = 1300; // kWdc boundary between the two spreadsheet tabs

export interface SsoScenario {
  id: "ground" | "large";
  label: string;
  costPerWatt: number;        // $/Wdc
  wattsPerPanel: number;
  yieldKwhPerKw: number;      // kWh-ac per kWdc-year
  baseRate: number;           // $/kWh Standard Offer payment
}

/** Roof/land lease = 20% of year-1 solar revenue, held flat for the full term. */
export const SSO_LEASE_REVENUE_SHARE = 0.20;

export const SSO_SCENARIOS: Record<SsoScenario["id"], SsoScenario> = {
  ground: {
    id: "ground",
    label: "Under 1,300 kWdc",
    costPerWatt: 1.85,
    wattsPerPanel: 550,
    yieldKwhPerKw: 1350,
    baseRate: 0.11,
  },
  large: {
    id: "large",
    label: "1,300 kWdc and above",
    costPerWatt: 1.90,
    wattsPerPanel: 400,
    yieldKwhPerKw: 1450,
    baseRate: 0.08,
  },
};

// Shared assumptions (identical on both spreadsheet tabs)
export const SSO_DEGRADATION_RATE = 0.005;      // 0.5% / yr
export const SSO_OM_PER_KW_YEAR = 10;           // $/kWdc-yr, year 1
export const SSO_OM_ESCALATION = 0.02;          // 2% / yr
export const SSO_INVERTER_REPLACEMENT_YEAR = 14;
export const SSO_INVERTER_COST_PER_UNIT = 8000; // per 125 kW block
export const SSO_INVERTER_KW_PER_UNIT = 125;
export const SSO_ITC_RATE = 0.30;               // if commissioned before 12/31/2027
export const SSO_DEPRECIATION_CREDIT_RATE = 0.21; // simplified value of depreciation
export const SSO_INCENTIVE_YEAR = 2;            // ITC + depreciation credit received in year 2
export const SSO_PROPERTY_TAX_USD = 0;          // unknown — modeled as zero

export function pickSsoScenario(systemKw: number): SsoScenario {
  return systemKw >= SSO_SCENARIO_BREAK_KW ? SSO_SCENARIOS.large : SSO_SCENARIOS.ground;
}

/** Standard Offer rate steps up $0.02 in year 6, $0.04 in year 11, $0.06 in year 16. */
export function ssoRateForYear(baseRate: number, year: number): number {
  if (year >= 16) return baseRate + 0.06;
  if (year >= 11) return baseRate + 0.04;
  if (year >= 6) return baseRate + 0.02;
  return baseRate;
}

export function ssoInverterReplacementCost(systemKw: number): number {
  return SSO_INVERTER_COST_PER_UNIT * Math.ceil(Math.max(0, systemKw) / SSO_INVERTER_KW_PER_UNIT);
}

export interface SsoProFormaRow {
  year: number;
  productionKwh: number;
  rate: number;
  revenue: number;
  lease: number;
  om: number;
  propertyTax: number;
  expenses: number;
  incentives: number;
  capex: number;
  netCashFlow: number;
  cumulative: number;
}

export interface SsoProForma {
  scenario: SsoScenario;
  systemKw: number;
  panels: number;
  systemCost: number;
  itcUsd: number;
  depreciationCreditUsd: number;
  netCostUsd: number;
  year1ProductionKwh: number;
  year1RevenueUsd: number;
  annualLeaseUsd: number;
  inverterReplacementUsd: number;
  rows: SsoProFormaRow[];
  irr: number | null;
  paybackYear: number | null;
  totalNetCashFlow: number;
}

/** Internal rate of return via bisection. Returns null when the cash flows have no sign change. */
export function irr(cashFlows: number[]): number | null {
  const npv = (rate: number) =>
    cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);

  let lo = -0.9499;
  let hi = 1.5;
  let fLo = npv(lo);
  let fHi = npv(hi);
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi) || fLo * fHi > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-7) return mid;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export function buildSsoProForma(systemKwInput: number): SsoProForma {
  const systemKw = Math.max(0, systemKwInput);
  const scenario = pickSsoScenario(systemKw);

  const panels = Math.ceil((systemKw * 1000) / scenario.wattsPerPanel);
  const systemCost = systemKw * 1000 * scenario.costPerWatt;
  const itcUsd = systemCost * SSO_ITC_RATE;
  const depreciationCreditUsd = (systemCost - itcUsd) * SSO_DEPRECIATION_CREDIT_RATE;
  const netCostUsd = systemCost - (itcUsd + depreciationCreditUsd);
  const inverterReplacementUsd = ssoInverterReplacementCost(systemKw);

  const year1Production = systemKw * scenario.yieldKwhPerKw;
  const year1Revenue = year1Production * ssoRateForYear(scenario.baseRate, 1);
  const annualLeaseUsd = year1Revenue * SSO_LEASE_REVENUE_SHARE;
  const rows: SsoProFormaRow[] = [];
  let cumulative = 0;
  let paybackYear: number | null = null;

  for (let year = 1; year <= SSO_PROFORMA_TERM_YEARS; year++) {
    const productionKwh = year1Production * Math.pow(1 - SSO_DEGRADATION_RATE, year - 1);
    const rate = ssoRateForYear(scenario.baseRate, year);
    const revenue = productionKwh * rate;
    const lease = annualLeaseUsd;
    const om =
      SSO_OM_PER_KW_YEAR * systemKw * Math.pow(1 + SSO_OM_ESCALATION, year - 1) +
      (year === SSO_INVERTER_REPLACEMENT_YEAR ? inverterReplacementUsd : 0);
    const propertyTax = SSO_PROPERTY_TAX_USD;
    const expenses = lease + om + propertyTax;
    const incentives = year === SSO_INCENTIVE_YEAR ? itcUsd + depreciationCreditUsd : 0;
    const capex = year === 1 ? -systemCost : 0;
    const netCashFlow = revenue - expenses + incentives + capex;

    cumulative += netCashFlow;
    if (paybackYear === null && cumulative >= 0) paybackYear = year;

    rows.push({
      year,
      productionKwh,
      rate,
      revenue,
      lease,
      om,
      propertyTax,
      expenses,
      incentives,
      capex,
      netCashFlow,
      cumulative,
    });
  }

  return {
    scenario,
    systemKw,
    panels,
    systemCost,
    itcUsd,
    depreciationCreditUsd,
    netCostUsd,
    year1ProductionKwh: year1Production,
    year1RevenueUsd: rows[0]?.revenue ?? 0,
    annualLeaseUsd: scenario.leasePaymentUsd,
    inverterReplacementUsd,
    rows,
    // Excel IRR() treats the first value as occurring at t=0
    irr: irr(rows.map(r => r.netCashFlow)),
    paybackYear,
    totalNetCashFlow: cumulative,
  };
}
