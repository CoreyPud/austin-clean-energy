import { austinEnergyRebate, AUSTIN_INSTALL_COST_PER_KW } from "@/lib/solar-model";

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
  grossCost: number;
  aeRebate: number;
  netCost: number;
  annualSavings: number;
  paybackYears: number;
}

export function computeRecommendation(p: {
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_sunshine_hrs: number | null;
  property_type: string | null;
}): SolarRecommendation | null {
  if (!p.solar_max_panels || !p.solar_panel_capacity_w) return null;

  const maxKw = (p.solar_max_panels * p.solar_panel_capacity_w) / 1000;
  // Use Google's sunshine hours × derate as production estimate; fall back to Austin avg
  const productionPerKw = p.solar_sunshine_hrs
    ? p.solar_sunshine_hrs * SYSTEM_DERATE
    : 1500;

  const cls = classifyProperty(p.property_type);
  let recommendedKw =
    cls === "residential"
      ? Math.min(RESIDENTIAL_ANNUAL_USAGE_KWH / productionPerKw, maxKw)
      : maxKw;
  recommendedKw = Math.round(recommendedKw * 10) / 10;

  const annualProductionKwh = Math.round(recommendedKw * productionPerKw);
  const grossCost = Math.round(recommendedKw * AUSTIN_INSTALL_COST_PER_KW);

  const aePropertyType =
    cls === "multifamily" ? "multi-family" : cls === "commercial" ? "commercial" : "single-family";
  const aeRebate = Math.round(austinEnergyRebate(recommendedKw, aePropertyType));

  const netCost = Math.max(0, grossCost - aeRebate);
  const annualSavings = Math.round(annualProductionKwh * VOS_RATE);
  const paybackYears =
    annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : 0;

  return {
    recommendedKw,
    maxKw: Math.round(maxKw * 10) / 10,
    annualProductionKwh,
    grossCost,
    aeRebate,
    netCost,
    annualSavings,
    paybackYears,
  };
}
