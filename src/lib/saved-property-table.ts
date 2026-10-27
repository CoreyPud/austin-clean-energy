import { computeRecommendation, fromGoogleSolarInsights, classifyProperty, isSsoEligible } from "./property-solar";
import type { FederalSolarOptions } from "./solar-federal-incentives";

export interface SavedPropertyData {
  address: string;
  property_type: string;
  calculator_state: Record<string, unknown>;
  results: unknown;
  updated_at: string;
}

export const PROPERTY_TYPE_NAMES: Record<string, string> = {
  "single-family": "Single family", single_family: "Single family",
  "multi-family": "Multifamily", multifamily: "Multifamily",
  "non-profit": "Nonprofit", commercial: "Commercial", condo: "Condo", other: "Other",
};
export const propertyTypeName = (type: string) => PROPERTY_TYPE_NAMES[type] ?? type;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : undefined;

export function savedPropertyMetrics(row: SavedPropertyData) {
  const state = row.calculator_state;
  const options = (state.federalOptions ?? {}) as FederalSolarOptions;
  const si = (row.results as { solarInsights?: { maxPanels: number; panelCapacityWatts: number; sunshineHours: number } } | null)?.solarInsights;
  const site = si ? fromGoogleSolarInsights(si, row.property_type) : null;
  const rec = computeRecommendation(site, {
    billingMode: state.billingMode === "sso" ? "sso" : "vos",
    systemKwOverride: number(state.systemKw) ?? (state.maxFit && site ? site.maxPanels * site.panelCapacityWatts / 1000 : undefined),
    annualUsageKwh: number(state.uploadedKwh),
    costPerWOverride: number(state.costPerW), federalOptions: options,
  });
  const ssoEligible = rec ? isSsoEligible(rec, classifyProperty(row.property_type), row.property_type === "non-profit") : false;
  return {
    systemKw: rec?.recommendedKw ?? number(state.systemKw) ?? null,
    ssoKw: ssoEligible ? rec?.maxKw ?? null : null,
    lowIncome: options.lowIncome === true,
    canSetLowIncome: !!rec?.federal?.eligible && rec.recommendedKw < 5000,
    creditUsd: rec?.federal?.eligible ? rec.federal.creditUsd : null,
  };
}

export function withSavedLowIncome(state: Record<string, unknown>, lowIncome: boolean) {
  return { ...state, federalOptions: { ...(state.federalOptions as FederalSolarOptions | undefined), lowIncome } };
}

export type SavedSortColumn = "address" | "type" | "systemKw" | "ssoKw" | "lowIncome" | "creditUsd" | "updated_at";
export function selectSavedProperties<T extends SavedPropertyData>(rows: T[], search: string, type: string, column: SavedSortColumn, ascending: boolean): T[] {
  const value = (row: T): string | number | null => {
    if (column === "address") return row.address;
    if (column === "type") return propertyTypeName(row.property_type);
    if (column === "updated_at") return Date.parse(row.updated_at);
    const metrics = savedPropertyMetrics(row);
    return column === "lowIncome" ? Number(metrics.lowIncome) : metrics[column];
  };
  return rows.filter(row => row.address.toLowerCase().includes(search.trim().toLowerCase()) && (type === "all" || propertyTypeName(row.property_type) === type))
    .sort((a, b) => {
      const av = value(a), bv = value(b);
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      const comparison = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : Number(av) - Number(bv);
      return ascending ? comparison : -comparison;
    });
}