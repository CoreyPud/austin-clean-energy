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