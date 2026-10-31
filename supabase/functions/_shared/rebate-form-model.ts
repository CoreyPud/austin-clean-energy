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
  if (type === "non-profit") return { program: "Commercial solar CBI", forms: ["cbi", "dgpa"], note: "Nonprofit CBI requires proof of status and Austin Energy approval; size alone does not verify eligibility." };
  if (type !== "commercial") return { program: null, forms: [], note: "Confirm service / applicant type with Austin Energy. Multifamily and unclassified properties require individual review." };
  if (!d.system_kw_ac || !Number.isFinite(d.system_kw_ac)) return { program: null, forms: [], note: "Enter the actual design AC rating. Do not substitute DC size or an estimated conversion." };
  const cbi = d.system_kw_ac < 100;
  return { program: cbi ? "Commercial solar CBI" : "Commercial solar PBI", forms: [cbi ? "cbi" : "pbi", "dgpa"], note: "Suggested by commercial AC size: CBI below 100 kW AC; PBI at 100 kW AC or above. Austin Energy must confirm eligibility, funding and the current document packet." };
}
export function normalizeSolarType(value: string): SolarPropertyType {
  const normalized = value.replace(/_/g, "-");
  if (normalized === "multi-family") return "multifamily";
  return ["single-family", "condo", "commercial", "non-profit", "multifamily"].includes(normalized) ? normalized as SolarPropertyType : "unknown";
}
export function mergeMissing<T extends Record<string, unknown>>(current: T, incoming: Partial<T>): T {
  const next = { ...current };
  for (const key of Object.keys(incoming) as (keyof T)[]) {
    const value = incoming[key];
    if ((current[key] === "" || current[key] === null || current[key] === undefined) && value !== undefined && value !== null && value !== "") next[key] = value as T[keyof T];
  }
  return next;
}