// Import-free so browser and edge calculations use identical program thresholds.
export const PBI_MIN_KW = 100;
export const COMMERCIAL_CBI_PER_W = 0.70;
export const NONPROFIT_CBI_PER_W = 1.00;
export const NONPROFIT_CBI_CAP_KW = 200;
// Eligibility uses AC; calculator panel capacities are DC. Actual intake ratings win.
export const SOLAR_AC_DC_RATIO = 0.83;
export const BUSINESS_SOLAR_INCENTIVE_SOURCE = "https://austinenergy.com/about/news/news-releases/2026/Austin-Energy-increases-solar-incentives-for-residential-and-commercial-customers";
export function businessSolarIncentive(propertyType: string, systemKwAc: number): "cbi" | "pbi" | null {
  if (!Number.isFinite(systemKwAc) || systemKwAc <= 0) return null;
  if (propertyType === "non-profit") return systemKwAc < NONPROFIT_CBI_CAP_KW ? "cbi" : "pbi";
  if (propertyType === "commercial") return systemKwAc < PBI_MIN_KW ? "cbi" : "pbi";
  return null;
}
export const COMMERCIAL_PBI_YEARS = 5;
export const PBI_RATE_TIERS = [
  { minKw: 1000, rate: 0.06, label: "Extra-Large" },
  { minKw: 400, rate: 0.08, label: "Large" },
  { minKw: 0, rate: 0.10, label: "Medium" },
] as const;