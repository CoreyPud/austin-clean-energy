export const PROGRAMS = ["Residential solar", "Commercial solar CBI", "Commercial solar PBI", "Commercial property improvements"];
export interface ApplicationDetails {
  customer_name: string; service_address: string; account_number: string;
  email: string; phone: string; project_description: string;
  months: { label: string; kwh: number }[]; source: string;
}
export function validateDetails(input: unknown): ApplicationDetails {
  if (!input || typeof input !== "object") throw new Error("Invalid details");
  const d = input as Record<string, unknown>;
  const result = {} as ApplicationDetails;
  for (const field of ["customer_name", "service_address", "account_number", "email", "phone", "project_description", "source"] as const) {
    if (typeof d[field] !== "string" || d[field].length > 2000) throw new Error("Invalid field");
    result[field] = d[field].trim();
  }
  if (!Array.isArray(d.months) || d.months.length > 120) throw new Error("Invalid usage");
  result.months = d.months.map((m: { label: string; kwh: number }) => {
    if (!m || typeof m.label !== "string" || m.label.length > 40 || !Number.isFinite(m.kwh) || m.kwh < 0) throw new Error("Invalid usage");
    return { label: m.label, kwh: m.kwh };
  });
  return result;
}
export function reviewComplete(d: ApplicationDetails) {
  return Boolean(d.customer_name && d.service_address && d.account_number && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) && d.project_description);
}
export function canAdminAccess(row: { consent_at: string | null; status: string }) {
  return Boolean(row.consent_at && row.status !== "draft");
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Account identifiers stay text; neutralize spreadsheet formulas, including leading whitespace.
  if (/^[\s]*[=+\-@]/.test(text) || /^\d+$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
async function key(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptDetails(details: ApplicationDetails, secret: string, binding: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(binding) }, await key(secret), new TextEncoder().encode(JSON.stringify(details)));
  return JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) });
}
export async function decryptDetails(payload: string, secret: string, binding: string): Promise<ApplicationDetails> {
  const { iv, data } = JSON.parse(payload);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv), additionalData: new TextEncoder().encode(binding) }, await key(secret), new Uint8Array(data));
  return JSON.parse(new TextDecoder().decode(plain));
}