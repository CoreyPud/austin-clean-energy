import {
  austinEnergyRebate,
  AUSTIN_INSTALL_COST_PER_KW,
  AUSTIN_ENERGY_RATES,
  PBI_MIN_KW,
  buildPbiModel,
  billToMonthlyKwh,
  buildYearModel,
  buildThirtyYearModel,
  buildSsoModel,
  mergePbiIntoThirtyYear,
  type CalcInputs,
  type YearResult,
  type ThirtyYearResult,
} from "@/lib/solar-model";
import { pickSsoScenario } from "@/lib/sso-proforma";

export function slugifyAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type PropertyClass = "residential" | "commercial" | "multifamily";

// Handles both naming conventions in use: TCAD's underscored types (PropertyPage.tsx) and the
// calculator's hyphenated ones (PropertyAssessment.tsx) — a single source both can feed.
export function classifyProperty(propertyType: string | null): PropertyClass {
  switch (propertyType) {
    case "single_family":
    case "single-family":
    case "condo":
      return "residential";
    case "multifamily":
    case "multi-family":
      return "multifamily";
    default:
      return "commercial";
  }
}

const RESIDENTIAL_ANNUAL_USAGE_KWH = 14_004; // Austin avg: 1167 kWh/mo × 12
const SYSTEM_DERATE = 0.86;                  // NREL PVWatts default performance ratio: inverter/wiring/
                                              // soiling/temperature losses on top of Google's geometry-
                                              // and-shading-adjusted sunshine hours. Not redundant with
                                              // anything Google already applies — a different loss category.
const VOS_RATE = AUSTIN_ENERGY_RATES.vosRate; // single-sourced from solar-model.ts
const MIN_SYSTEM_KW = 2;                     // floor for usage-based (VoS) default sizing
// Default monthly bill assumption when no real usage is known, by AE property type (matches
// the calculator's existing defaults) — used both as the static-render default and as the
// starting point a user's own bill input overrides.
export const DEFAULT_MONTHLY_BILL: Record<string, number> = { commercial: 3000, "non-profit": 800 };

/** Normalized input both data sources (TCAD row, live Google Solar API response) map into. */
export interface SolarSiteInput {
  maxPanels: number;
  panelCapacityWatts: number;
  sunshineHours: number | null;
  /** Raw property-type string from either source; classifyProperty()/the rebate lookup
   *  normalize it. Pass "non-profit" explicitly when known — TCAD data never has this
   *  distinction, only the calculator does. */
  propertyType: string | null;
}

export function fromTcadProperty(p: {
  solar_max_panels: number | null;
  solar_panel_capacity_w: number | null;
  solar_sunshine_hrs: number | null;
  property_type: string | null;
}): SolarSiteInput | null {
  if (!p.solar_max_panels || !p.solar_panel_capacity_w) return null;
  return {
    maxPanels: p.solar_max_panels,
    panelCapacityWatts: p.solar_panel_capacity_w,
    sunshineHours: p.solar_sunshine_hrs,
    propertyType: p.property_type,
  };
}

/** Same derate `computeRecommendation` applies internally — exposed for callers (chart
 *  components, PbiBreakdown, SsoProForma) that need a per-kW production estimate independent
 *  of any specific system size. */
export function estimateProductionPerKw(sunshineHours: number | null): number {
  return sunshineHours ? sunshineHours * SYSTEM_DERATE : 1500;
}

export function fromGoogleSolarInsights(
  si: { maxPanels: number; panelCapacityWatts: number; sunshineHours: number },
  propertyType: string,
): SolarSiteInput | null {
  if (!si.maxPanels || !si.panelCapacityWatts) return null;
  return {
    maxPanels: si.maxPanels,
    panelCapacityWatts: si.panelCapacityWatts,
    sunshineHours: si.sunshineHours,
    propertyType,
  };
}

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
  input: SolarSiteInput | null,
  opts: {
    /** Size the default system to offset this yearly consumption (e.g. from an uploaded
     *  bill). Falls back to a property-type default (Austin residential average, or the
     *  DEFAULT_MONTHLY_BILL assumption for commercial/non-profit) when omitted. Ignored
     *  when billingMode is "sso" — that program is bill-independent by design. */
    annualUsageKwh?: number | null;
    /** User-chosen system size in kW. Overrides the default sizing, clamped to
     *  the roof's maximum. */
    systemKwOverride?: number | null;
    /** "vos" (default): size to usage, floor MIN_SYSTEM_KW, ceiling the roof max.
     *  "sso": bill-independent — size to the full buildable roof capacity. */
    billingMode?: "vos" | "sso";
    /** User-supplied installer quote ($/W), overriding the default tiered/flat rate below.
     *  A manual override, not a data-derived default — omit for the data-driven figure. */
    costPerWOverride?: number | null;
  } = {},
): SolarRecommendation | null {
  if (!input) return null;

  const maxKw = (input.maxPanels * input.panelCapacityWatts) / 1000;
  const productionPerKw = estimateProductionPerKw(input.sunshineHours);

  const cls = classifyProperty(input.propertyType);
  const billingMode = opts.billingMode ?? "vos";

  let recommendedKw: number;
  if (cls === "multifamily") {
    // Virtual net metering, not a per-unit-usage or SSO/VoS billing concept -- always size to
    // the full buildable roof capacity, independent of billingMode.
    recommendedKw = maxKw;
  } else if (cls === "commercial" && billingMode === "sso") {
    recommendedKw = maxKw;
  } else {
    // Residential, or commercial/non-profit on VoS: usage-based, floored, roof-capped.
    const defaultUsageKwh = cls === "residential"
      ? RESIDENTIAL_ANNUAL_USAGE_KWH
      : billToMonthlyKwh(DEFAULT_MONTHLY_BILL[input.propertyType ?? ""] ?? 150) * 12;
    const usageKwh = opts.annualUsageKwh ?? defaultUsageKwh;
    const unconstrainedKw = productionPerKw > 0 ? usageKwh / productionPerKw : 0;
    recommendedKw = Math.min(Math.max(unconstrainedKw, MIN_SYSTEM_KW), maxKw);
  }
  // A manual size selection wins over the default, clamped to the roof capacity.
  if (opts.systemKwOverride != null) {
    recommendedKw = Math.max(0, Math.min(opts.systemKwOverride, maxKw));
  }
  recommendedKw = Math.round(recommendedKw * 10) / 10;

  // "non-profit" only ever comes from the calculator's own propertyType — TCAD data has no
  // such distinction, so it always falls through to the class-based mapping below.
  const aePropertyType = input.propertyType === "non-profit"
    ? "non-profit"
    : cls === "multifamily" ? "multi-family" : cls === "commercial" ? "commercial" : "single-family";

  const annualProductionKwh = Math.round(recommendedKw * productionPerKw);
  // For-profit commercial install cost is single-sourced from the Standard Offer pro forma's
  // tiered rate (sso-proforma.ts) rather than the Berkeley Lab figure below, which is a
  // residential regression that doesn't reflect commercial economies of scale. Scoped to
  // aePropertyType, not cls, so nonprofits (which classify as "commercial" too) keep the
  // generic rate -- matches the calculator's existing costPerW default, which only special-cases
  // literal "commercial".
  const costPerW = opts.costPerWOverride ?? (aePropertyType === "commercial"
    ? pickSsoScenario(recommendedKw).costPerWatt
    : AUSTIN_INSTALL_COST_PER_KW / 1000);
  const grossCost = Math.round(recommendedKw * costPerW * 1000);

  const aeRebate = Math.round(austinEnergyRebate(recommendedKw, aePropertyType));

  const netCost = Math.max(0, grossCost - aeRebate);
  const annualSavings = Math.round(annualProductionKwh * VOS_RATE);
  const paybackYears =
    annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : 0;

  // aePropertyType, not cls: nonprofits classify as "commercial" too (no TCAD/calculator
  // distinction otherwise) but are explicitly out of scope for PBI -- they keep the existing
  // CBI-only treatment (see solar-model.ts's PBI_MIN_KW comment).
  const pbiEligible = aePropertyType === "commercial" && recommendedKw >= PBI_MIN_KW;
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

export interface ProgramFinancials {
  yearOne: YearResult;
  /** VoS 30-year model, with PBI credits layered on when rec.pbiEligible. Computed
   *  regardless of billing mode -- harmless when isSSO, and lets a caller show both. */
  thirtyYear: ThirtyYearResult;
  /** Standard Offer 30-year model, computed regardless of billing mode for the same reason. */
  sso: ReturnType<typeof buildSsoModel>;
  isSSO: boolean;
  /** Net cumulative total at year 25, from whichever model (sso/thirtyYear) matches isSSO. */
  net25: number;
  paybackYear: number | null;
  /** The single "$/yr" headline figure for whichever billing mode is active: SSO revenue,
   *  or VoS savings plus PBI credit (year 1) when pbiEligible. */
  annualAmount: number;
}

/** Single source for the year-by-year / cumulative financial modeling both PropertyPage.tsx
 *  and PropertyAssessment.tsx chart and summarize from -- built once here instead of each
 *  page separately calling buildYearModel/buildThirtyYearModel/buildSsoModel/buildPbiModel
 *  and merging them by hand. */
export function buildProgramFinancials(
  rec: SolarRecommendation,
  opts: {
    annualUsageKwh: number;
    productionPerKw: number;
    isSSO: boolean;
    batteryKwh?: number;
    loanTermYears?: number;
    loanInterestRate?: number;
    monthlyUsageKwh?: number[];
  },
): ProgramFinancials {
  const inputs: CalcInputs = {
    annualUsageKwh: opts.annualUsageKwh,
    systemKw: rec.recommendedKw,
    batteryKwh: opts.batteryKwh ?? 0,
    loanTermYears: opts.loanTermYears ?? 0,
    loanInterestRate: opts.loanInterestRate ?? 0,
    productionPerKw: opts.productionPerKw,
    monthlyUsageKwh: opts.monthlyUsageKwh,
  };
  const yearOne = buildYearModel(inputs, 0);
  const thirtyYearBase = buildThirtyYearModel(inputs, rec.netCost);
  // rec.netCost already reflects CBI/PBI-threshold-aware rebate eligibility (see
  // computeRecommendation above); PBI itself is a separate on-bill credit stream layered
  // on top, not baked into netCost.
  const thirtyYear = rec.pbiEligible
    ? mergePbiIntoThirtyYear(thirtyYearBase, buildPbiModel(rec.recommendedKw, opts.productionPerKw))
    : thirtyYearBase;
  // Gross cost, not netCost: Standard Offer systems don't qualify for the AE capacity rebate.
  const sso = buildSsoModel(rec.recommendedKw, opts.productionPerKw, rec.grossCost);

  const cumulativeSource = opts.isSSO ? sso.cumulativeByYear : thirtyYear.cumulativeByYear;
  const net25 = cumulativeSource[24]?.cumulative ?? 0;
  const paybackYear = opts.isSSO ? sso.paybackYear : thirtyYear.paybackYear;
  // yearOne.savings (the real month-by-month AE tiered-rate/credit-carryover simulation) is
  // more accurate than rec.annualSavings (a flat production * VOS_RATE approximation used only
  // for computeRecommendation's own quick payback estimate) -- use it for the headline figure.
  const annualAmount = opts.isSSO
    ? sso.annualRevenue
    : yearOne.savings + (rec.pbiEligible ? rec.pbiAnnualCredit : 0);

  return { yearOne, thirtyYear, sso, isSSO: opts.isSSO, net25, paybackYear, annualAmount };
}

/** Single source for the contact-CTA copy shown at the bottom of both PropertyPage.tsx and
 *  PropertyAssessment.tsx -- tailored by property class and SSO eligibility rather than the
 *  generic ContactCtaCard default. */
export function getCtaCopy(cls: PropertyClass, ssoEligible: boolean): { title: string; description: string } {
  if (cls === "residential") {
    return {
      title: "Want help navigating your solar options?",
      description: "We're an independent resource, not a solar installer. We help Austin homeowners understand rebates, what questions to ask installers, and whether solar actually pencils out for their situation.",
    };
  }
  if (cls === "multifamily") {
    return {
      title: "Questions about multifamily solar in Austin?",
      description: "We're not a solar company — we're an independent resource. Austin Energy's multifamily programs change frequently and eligibility can be complicated. We can help you figure out what's currently available and whether it makes sense for your building.",
    };
  }
  if (ssoEligible) {
    return {
      title: "Want help evaluating the Standard Offer for your property?",
      description: "We're not a solar installer — we're an independent resource. The Standard Offer is compelling for large commercial properties, but navigating AE's interconnection process and finding the right installer takes work. We can help you ask the right questions.",
    };
  }
  return {
    title: "Want help evaluating solar for your commercial property?",
    description: "We're not a solar installer — we're an independent resource. We can help you evaluate whether solar makes financial sense for your property and what to ask commercial installers about sizing, rates, and AE's rebate process.",
  };
}
