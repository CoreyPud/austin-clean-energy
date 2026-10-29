// Import-free so browser and edge calculations use identical program thresholds.
export const PBI_MIN_KW = 100;
export const COMMERCIAL_CBI_PER_W = 0.70;
export const NONPROFIT_CBI_PER_W = 1.00;
export const NONPROFIT_CBI_CAP_KW = 200;
export const COMMERCIAL_PBI_YEARS = 5;
export const PBI_RATE_TIERS = [
  { minKw: 1000, rate: 0.06, label: "Extra-Large" },
  { minKw: 400, rate: 0.08, label: "Large" },
  { minKw: 0, rate: 0.10, label: "Medium" },
] as const;