/**
 * Commercial building savings model for the Commercial Clean Energy Plan.
 *
 * These are transparent planning estimates, not engineering calculations. Every
 * assumption is a named constant with a source note so the page can show its work.
 *
 * Sources:
 * - Rebate rates: Austin Energy commercial Property Improvements page (reviewed 02/18/2026)
 *   https://austinenergy.com/energy-efficiency/rebates-incentives/commercial/property-improvements
 * - Demand response: Austin Energy Commercial Demand Response / Load Cooperative programs
 *   pay participating businesses for kW curtailed during grid events. Payments are
 *   custom-quoted per facility; we default to $30/kW-year as a conservative planning
 *   figure and let the user override it.
 *   https://austinenergy.com/energy-efficiency/rebates-incentives/commercial
 * - Cooling share of commercial electricity in Austin's climate: ~35% for typical
 *   office/retail (EIA CBECS South region shows cooling as the largest single end use).
 * - Measure savings ranges: DOE/EIA commercial measure literature and Austin Energy
 *   program descriptions. We use the conservative end of published ranges.
 */

export interface OperatingHours {
  label: string;
  hoursPerWeek: number;
}

export const OPERATING_PROFILES: OperatingHours[] = [
  { label: "Standard office (Mon–Fri, ~50 hrs/wk)", hoursPerWeek: 50 },
  { label: "Extended retail (6 days, ~70 hrs/wk)", hoursPerWeek: 70 },
  { label: "Restaurant / long hours (~90 hrs/wk)", hoursPerWeek: 90 },
  { label: "24/7 operation", hoursPerWeek: 168 },
];

/** Fraction of annual electricity that is cooling in Austin's climate. */
export const COOLING_SHARE = 0.35;

/** Conservative fraction of cooling kWh each measure saves. */
export const MEASURE_COOLING_SAVINGS = {
  insulation: 0.08, // 5–15% published range; we use 8%
  reflectiveRoof: 0.15, // 10–25% for dark flat roofs; we use 15%
  windowsSingle: 0.2, // 15–30% for single-pane solar control; we use 20%
  windowsUnshaded: 0.12, // 10–20% for film on double-pane; we use 12%
} as const;

/** Default demand response payment assumption ($/kW-year), user-editable. */
export const DEFAULT_DR_RATE_PER_KW_YEAR = 30;

/** Default share of peak demand a building can curtail in a DR event. */
export const DEFAULT_DR_CURTAIL_FRACTION = 0.1;

export interface SavingsModelInputs {
  /** Annual electricity use in kWh (from bill upload or manual entry). */
  annualKwh: number;
  /** Energy-only rate $/kWh, excluding separately modeled demand and fixed charges. */
  ratePerKwh: number;
  /** Demand charge $/kW-month. 0 if the account has no demand charges. */
  demandChargePerKwMonth: number;
  /** Operating hours per week — used to estimate peak demand from annual kWh. */
  hoursPerWeek: number;
  /** DR: kW the building can curtail during events. */
  drCurtailKw: number;
  /** DR: payment $/kW-year. */
  drRatePerKwYear: number;
  /** Estimated installed cost per improvement (before rebate). */
  costs: {
    insulation: number;
    reflectiveRoof: number;
    windows: number;
  };
  /** Rebate areas. */
  roofSqFt: number;
  windowSqFt: number;
  /** Which measures apply (from the building questions). */
  applicable: {
    insulation: boolean;
    reflectiveRoof: boolean;
    windows: "single" | "unshaded" | null;
  };
}

export interface InitiativeResult {
  id: "demand-response" | "insulation" | "reflective-roof" | "windows";
  title: string;
  category: string;
  /** Annual kWh saved (0 for demand response — it shifts/curtails, not saves). */
  annualKwhSaved: number;
  /** Peak kW reduced or curtailed. */
  peakKwReduced: number;
  /** Annual dollar savings or payments. */
  annualSavingsUsd: number;
  /** Lower electricity charges from reduced kWh. */
  annualEnergySavingsUsd: number;
  /** Estimated reduction in demand charges, separate from energy charges. */
  annualDemandSavingsUsd: number;
  /** Demand-response payment, not a reduction in the electricity bill. */
  annualProgramPaymentUsd: number;
  /** Annual use after this initiative alone; DR does not imply annual kWh savings. */
  annualKwhAfter: number;
  /** One-time rebate from Austin Energy. */
  rebateUsd: number;
  /** User's estimated installed cost (0 for DR). */
  installedCostUsd: number;
  /** installedCost - rebate. */
  netCostUsd: number;
  /** netCost / annualSavings; null when cost is 0 or savings are 0. */
  paybackYears: number | null;
  /** 10-year net: 10 × annualSavings - netCost. */
  tenYearNetUsd: number;
  /** Plain-language note on how the number was derived. */
  basis: string;
}

/** Estimate peak demand (kW) from annual kWh and operating hours. */
export function estimatePeakKw(annualKwh: number, hoursPerWeek: number): number {
  const operatingHours = hoursPerWeek * 52;
  if (operatingHours <= 0) return 0;
  return annualKwh / operatingHours;
}

export function buildSavingsModel(inputs: SavingsModelInputs): InitiativeResult[] {
  const results: InitiativeResult[] = [];
  const peakKw = estimatePeakKw(inputs.annualKwh, inputs.hoursPerWeek);
  const coolingKwh = inputs.annualKwh * COOLING_SHARE;

  // 1. Demand response — first initiative, no capital cost.
  {
    const payment = inputs.drCurtailKw * inputs.drRatePerKwYear;
    const demandSavings = inputs.drCurtailKw * inputs.demandChargePerKwMonth * 12 * 0.5;
    // 0.5 factor: DR events only shave some monthly peaks, not all 12.
    const annual = payment + demandSavings;
    results.push({
      id: "demand-response",
      title: "Enroll in demand response",
      category: "Grid Programs",
      annualKwhSaved: 0,
      peakKwReduced: inputs.drCurtailKw,
      annualSavingsUsd: annual,
      annualEnergySavingsUsd: 0,
      annualDemandSavingsUsd: demandSavings,
      annualProgramPaymentUsd: payment,
      annualKwhAfter: inputs.annualKwh,
      rebateUsd: 0,
      installedCostUsd: 0,
      netCostUsd: 0,
      paybackYears: null, // no capital cost — immediate return
      tenYearNetUsd: annual * 10,
      basis: `${inputs.drCurtailKw.toLocaleString()} kW curtailed × $${inputs.drRatePerKwYear}/kW-yr program payment${inputs.demandChargePerKwMonth > 0 ? `, plus demand-charge relief at $${inputs.demandChargePerKwMonth}/kW-mo on roughly half of monthly peaks` : ""}. No upfront cost.`,
    });
  }

  const envelope = (
    id: "insulation" | "reflective-roof" | "windows",
    title: string,
    category: string,
    coolingSavingsFraction: number,
    cost: number,
    rebate: number,
    basisDetail: string,
  ) => {
    const kwhSaved = coolingKwh * coolingSavingsFraction;
    const energySavings = kwhSaved * inputs.ratePerKwh;
    // Cooling measures also trim the summer peak; assume peak kW falls by the
    // same fraction of cooling's share of peak.
    const kwReduced = peakKw * COOLING_SHARE * coolingSavingsFraction;
    const demandSavings = kwReduced * inputs.demandChargePerKwMonth * 12;
    const annual = energySavings + demandSavings;
    const net = Math.max(0, cost - rebate);
    results.push({
      id,
      title,
      category,
      annualKwhSaved: Math.round(kwhSaved),
      peakKwReduced: Math.round(kwReduced * 10) / 10,
      annualSavingsUsd: annual,
      annualEnergySavingsUsd: energySavings,
      annualDemandSavingsUsd: demandSavings,
      annualProgramPaymentUsd: 0,
      annualKwhAfter: inputs.annualKwh - Math.round(kwhSaved),
      rebateUsd: rebate,
      installedCostUsd: cost,
      netCostUsd: net,
      paybackYears: annual > 0 ? net / annual : null,
      tenYearNetUsd: annual * 10 - net,
      basis: basisDetail,
    });
  };

  if (inputs.applicable.insulation) {
    envelope(
      "insulation",
      "Add ceiling or roof insulation",
      "Building Envelope",
      MEASURE_COOLING_SAVINGS.insulation,
      inputs.costs.insulation,
      inputs.roofSqFt * 1.0,
      `Saves ~${Math.round(MEASURE_COOLING_SAVINGS.insulation * 100)}% of cooling electricity (cooling ≈ ${Math.round(COOLING_SHARE * 100)}% of your annual kWh), plus a $1.00/sq ft Austin Energy rebate on ${inputs.roofSqFt.toLocaleString()} sq ft.`,
    );
  }

  if (inputs.applicable.reflectiveRoof) {
    envelope(
      "reflective-roof",
      "Apply a reflective roof coating",
      "Roof",
      MEASURE_COOLING_SAVINGS.reflectiveRoof,
      inputs.costs.reflectiveRoof,
      inputs.roofSqFt * 0.25,
      `Saves ~${Math.round(MEASURE_COOLING_SAVINGS.reflectiveRoof * 100)}% of cooling electricity on a dark flat roof, plus a $0.25/sq ft Austin Energy rebate on ${inputs.roofSqFt.toLocaleString()} sq ft.`,
    );
  }

  if (inputs.applicable.windows) {
    const frac =
      inputs.applicable.windows === "single"
        ? MEASURE_COOLING_SAVINGS.windowsSingle
        : MEASURE_COOLING_SAVINGS.windowsUnshaded;
    envelope(
      "windows",
      "Treat or replace windows",
      "Windows",
      frac,
      inputs.costs.windows,
      inputs.windowSqFt * 2.25,
      `Saves ~${Math.round(frac * 100)}% of cooling electricity (${inputs.applicable.windows === "single" ? "single-pane" : "unshaded double-pane"} windows), plus up to $2.25/sq ft Austin Energy rebate on ${inputs.windowSqFt.toLocaleString()} sq ft.`,
    );
  }

  return results;
}
