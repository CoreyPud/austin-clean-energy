// Constants and category metadata for the Load Growth Estimator.
// Mirrors the formulas used by the Austin Clean Energy building-permit tool
// this estimator extends: https://austincleanenergy.net/building-energy-usage

// Single-family home benchmark: EIA RECS, avg. Texas home (13,152 kWh/yr), 0.5 load factor.
export const SFH_KWH = 13152;
export const SFH_LF = 0.5;

// Multifamily: assumption, set at 65% of the single-family per-unit figure.
export const MF_KWH = 13152 * 0.65;
export const MF_LF = 0.5;

// Data center tiers, entered directly as peak MW per facility (near-continuous draw).
export const DC1_MW = 10; // existing-pattern, matches AE's current ~10MW facilities
export const DC2_MW = 45; // mid-size inquiry, matches the City's 20-74MW cited range
export const DC3_MW = 200; // hyperscale, hypothetical -- not yet requested in AE territory

// Austin Energy's real, sourced baseline (Austin Clean Energy building-permit tool).
export const CURRENT_PEAK = 3067; // MW, record system peak, August 2023
export const COMMITTED = 533.1; // MW, committed permit pipeline

// EV fleet charging: assumption, ~7 kW/vehicle average managed depot draw.
export const EV_KW_PER_VEHICLE = 7;

// Dog's Head development: real, approved 2,600-acre mixed-use project (Hwy 183/130,
// Colorado River) annexed by Austin City Council in 2026. Amazon's robotics division
// is the anchor tenant. Housing counts are the approved program; the 9M sqft of
// industrial/retail/office/hospitality uses an assumed blended commercial EUI (not an
// Austin ECAD figure, since ECAD medians for that specific mix weren't available here).
export const DOGSHEAD_SFH_N = 6195;
export const DOGSHEAD_MF_N = 6200;
export const DOGSHEAD_COMM_SQFT = 9_000_000;
export const DOGSHEAD_COMM_EUI = 12; // kWh/sqft/yr, assumption
export const DOGSHEAD_COMM_LF = 0.5;

export type CatKey = "sfh" | "mf" | "dc" | "mfg" | "other" | "ev" | "dogshead";

export type Cat = {
  key: CatKey;
  label: string;
  colorVar: string; // CSS custom property, e.g. "var(--le-sfh)"
};

export const CATS: Cat[] = [
  { key: "sfh", label: "Single-family homes", colorVar: "var(--le-sfh)" },
  { key: "mf", label: "Multifamily units", colorVar: "var(--le-mf)" },
  { key: "dc", label: "Data centers", colorVar: "var(--le-dc)" },
  { key: "mfg", label: "Manufacturing / industrial", colorVar: "var(--le-mfg)" },
  { key: "other", label: "Other / custom", colorVar: "var(--le-other)" },
  { key: "ev", label: "EV fleet charging", colorVar: "var(--le-ev)" },
  { key: "dogshead", label: "Dog's Head development", colorVar: "var(--le-dogshead)" },
];
