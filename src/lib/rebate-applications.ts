import { supabase } from "@/integrations/supabase/client";
import type { SolarApplicationFields } from "../../supabase/functions/_shared/rebate-form-model";
export interface RebateDetails extends SolarApplicationFields {
  customer_name: string; service_address: string; account_number: string; email: string;
  phone: string; project_description: string; source: string; months: { label: string; kwh: number }[];
}
export interface RebateSummary { id: string; program: string; status: string; created_at: string; updated_at: string }
export const rebatePrograms = ["Residential solar", "Commercial solar CBI", "Commercial solar PBI", "Commercial property improvements"];
export const emptyRebate: RebateDetails = { customer_name: "", service_address: "", account_number: "", email: "", phone: "", project_description: "", source: "manual", months: [] };
export async function rebateRequest(body: Record<string, unknown>, admin = false) {
  const token = admin ? sessionStorage.getItem("admin_token") : null;
  if (admin && !token) throw new Error("Sign in as an administrator");
  const { data, error } = await supabase.functions.invoke("rebate-applications", { body, ...(token ? { headers: { "x-admin-token": token } } : {}) });
  if (error) {
    let message = "Unable to process application. Please sign in or retry.";
    try { const parsed = await error.context?.json(); if (parsed?.error) message = parsed.error; } catch { /* generic fallback */ }
    throw new Error(message);
  }
  return data;
}