import { businessSolarIncentive, NONPROFIT_CBI_CAP_KW, PBI_MIN_KW } from "./commercial-solar-programs.ts";
// Shared private intake contract; no personal data belongs in public assessment shares.
export const solarTextFields = {
  property_type: "Property / applicant type", property_owner: "Property owner / legal entity",
  organization_name: "Business or nonprofit name", mailing_address: "Rebate check mailing address",
  applicant_role: "Applicant relationship to owner", system_ownership: "System ownership",
  contractor_name: "Solar contractor", contractor_email: "Contractor email", contractor_phone: "Contractor phone",
  contractor_license: "Contractor license", authorized_representative: "Authorized representative",
  representative_email: "Representative email", tcad_pid: "TCAD parcel ID", equipment_description: "Modules and inverters",
  installation_date: "Expected installation date", production_source: "Annual production source",
} as const;
export const solarNumberFields = {
  system_kw_dc: "System size (kW DC)", system_kw_ac: "System rating (kW AC)",
  installed_cost: "Total installed cost ($)", annual_production_kwh: "Estimated annual production (kWh)",
} as const;
export type SolarApplicationFields = Partial<Record<keyof typeof solarTextFields, string> & Record<keyof typeof solarNumberFields, number | null>>;
export type SolarPropertyType = "single-family" | "condo" | "commercial" | "non-profit" | "multifamily" | "unknown";
export const solarForms = {
  residential: { label: "Residential guidelines and customer agreement", url: "https://austinenergy.com/-/media/project/websites/austinenergy/green-power/solar/res-solar-pv-guidelines.pdf" },
  cbi: { label: "Commercial / nonprofit CBI customer agreement", url: "https://austinenergy.com/-/media/Project/Websites/AustinEnergy/Green-Power/Solar/CBI_CustomerAgreementForm.pdf" },
  pbi: { label: "Commercial 5-year PBI customer agreement", url: "https://austinenergy.com/-/media/Project/Websites/AustinEnergy/Green-Power/Solar/PBI_CustomerAgreementForm.pdf" },
  dgpa: { label: "Distributed generation planning application", url: "https://austinenergy.com/-/media/Project/Websites/AustinEnergy/Contractors/PDFs/DGPA-FillableForm.pdf" },
} as const;
export function solarFormRoute(d: SolarApplicationFields): { program: string | null; forms: (keyof typeof solarForms)[]; note: string } {
  const type = normalizeSolarType(d.property_type ?? "");
  if (type === "single-family" || type === "condo") return { program: "Residential solar", forms: ["residential", "dgpa"], note: "Residential service, eligibility, required education and interconnection agreement must be verified." };
  if (type !== "commercial" && type !== "non-profit") return { program: null, forms: [], note: "Confirm service / applicant type with Austin Energy. Multifamily and unclassified properties require individual review." };
  if (!d.system_kw_ac || !Number.isFinite(d.system_kw_ac)) return { program: null, forms: [], note: "Enter the actual design AC rating. Do not substitute DC size or an estimated conversion." };
  const cbi = businessSolarIncentive(type, d.system_kw_ac) === "cbi";
  const threshold = type === "non-profit" ? NONPROFIT_CBI_CAP_KW : PBI_MIN_KW;
  return { program: cbi ? "Commercial solar CBI" : "Commercial solar PBI", forms: [cbi ? "cbi" : "pbi", "dgpa"], note: `Suggested by AC size: CBI below ${threshold} kW AC; PBI at ${threshold} kW AC or above. Based on Austin Energy's July 2026 announcement. Older nonprofit guidelines allow CBI at any size; Austin Energy must confirm the applicable program, funding and packet. Nonprofit status requires verification.` };
}
export function normalizeSolarType(value: string): SolarPropertyType {
  const normalized = value.replace(/_/g, "-");
  if (normalized === "multi-family") return "multifamily";
  return ["single-family", "condo", "commercial", "non-profit", "multifamily"].includes(normalized) ? normalized as SolarPropertyType : "unknown";
}
export function mergeMissing<T extends object>(current: T, incoming: Partial<T>): T {
  const next = { ...current };
  for (const key of Object.keys(incoming) as (keyof T)[]) {
    const value = incoming[key];
    if ((current[key] === "" || current[key] === null || current[key] === undefined) && value !== undefined && value !== null && value !== "") next[key] = value as T[keyof T];
  }
  return next;
}