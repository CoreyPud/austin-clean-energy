import { austinEnergyRebate, AUSTIN_INSTALL_COST_PER_KW, PBI_MIN_KW, buildPbiModel } from "@/lib/solar-model";
import { pickSsoScenario } from "@/lib/sso-proforma";

export function slugifyAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type PropertyClass = "residential" | "commercial" | "multifamily";

export function classifyProperty(propertyType: string | null): PropertyClass {
  switch (propertyType) {
    case "single_family":
    case "condo":
      return "residential";
    case "multifamily":
      return "multifamily";
    default:
      return "commercial";
  }
}

const RESIDENTIAL_ANNUAL_USAGE_KWH = 14_004; // Austin avg: 1167 kWh/mo × 12
const SYSTEM_DERATE = 0.86;                  // NREL PVWatts default performance ratio
const VOS_RATE = 0.126;                      // Austin Energy Value of Solar rate $/kWh

export interface SolarRecommendation {
  recommendedKw: number;
  maxKw: number;
  annualProductionKwh: number;
  costPerW: number;
  grossCost: number;
  aeRebate: number;
  netCost: number;
  annualSavings: number;
  paybackYears: number;
  /** For-profit commercial systems >= PBI_MIN_KW: not CBI-eligible, gets a 5-year PBI credit instead. */
  pbiEligible: boolean;
  /** Year-1 PBI credit; $0 when not pbiEligible. Ongoing VoS (annualSavings) is unaffected — this
   *  is a separate, time-limited stream (see buildPbiModel/mergePbiIntoThirtyYear for the full
   *  year-by-year picture used in the payback chart). */
  pbiAnnualCredit: number;
}

export function computeRecommendation(
  p: {
    solar_max_panels: number | null;
    solar_panel_capacity_w: number | null;
    solar_sunshine_hrs: number | null;
    property_type: string | null;
  },
  opts: {
    /** Residential: size the default system to offset this yearly consumption
     *  (from the user's bill). Falls back to the Austin average when omitted. */
    annualUsageKwh?: number | null;
    /** User-chosen system size in kW. Overrides the default sizing, clamped to
     *  the roof's maximum. */
    systemKwOverride?: number | null;
  } = {},
): SolarRecommendation | null {
  if (!p.solar_max_panels || !p.solar_panel_capacity_w) return null;

  const maxKw = (p.solar_max_panels * p.solar_panel_capacity_w) / 1000;
  // Use Google's sunshine hours × derate as production estimate; fall back to Austin avg
  const productionPerKw = p.solar_sunshine_hrs
    ? p.solar_sunshine_hrs * SYSTEM_DERATE
    : 1500;

  const cls = classifyProperty(p.property_type);
  const usageKwh = opts.annualUsageKwh ?? RESIDENTIAL_ANNUAL_USAGE_KWH;
  let recommendedKw =
    cls === "residential"
      ? Math.min(usageKwh / productionPerKw, maxKw)
      : maxKw;
  // A manual size selection wins over the default, clamped to the roof capacity.
  if (opts.systemKwOverride != null) {
    recommendedKw = Math.max(0, Math.min(opts.systemKwOverride, maxKw));
  }
  recommendedKw = Math.round(recommendedKw * 10) / 10;

  const annualProductionKwh = Math.round(recommendedKw * productionPerKw);
  // Commercial install cost is single-sourced from the Standard Offer pro forma's tiered
  // rate (sso-proforma.ts) rather than the Berkeley Lab figure below, which is a residential
  // regression that doesn't reflect commercial economies of scale.
  const costPerW = cls === "commercial"
    ? pickSsoScenario(recommendedKw).costPerWatt
    : AUSTIN_INSTALL_COST_PER_KW / 1000;
  const grossCost = Math.round(recommendedKw * costPerW * 1000);

  const aePropertyType =
    cls === "multifamily" ? "multi-family" : cls === "commercial" ? "commercial" : "single-family";
  const aeRebate = Math.round(austinEnergyRebate(recommendedKw, aePropertyType));

  const netCost = Math.max(0, grossCost - aeRebate);
  const annualSavings = Math.round(annualProductionKwh * VOS_RATE);
  const paybackYears =
    annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : 0;

  const pbiEligible = cls === "commercial" && recommendedKw >= PBI_MIN_KW;
  const pbiAnnualCredit = pbiEligible ? Math.round(buildPbiModel(recommendedKw, productionPerKw).annualCredit) : 0;

  return {
    recommendedKw,
    maxKw: Math.round(maxKw * 10) / 10,
    annualProductionKwh,
    costPerW,
    grossCost,
    aeRebate,
    netCost,
    annualSavings,
    paybackYears,
    pbiEligible,
    pbiAnnualCredit,
  };
}
