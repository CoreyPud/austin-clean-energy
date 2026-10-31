import { estimateProductionPerKw } from "@/lib/property-solar";
import { normalizeSolarType } from "../../supabase/functions/_shared/rebate-form-model";
import type { RebateDetails } from "./rebate-applications";
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const positive = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
export function assessmentRebatePrefill(row: { address: string; property_type: string; calculator_state: unknown; results: unknown }): Partial<RebateDetails> {
  const state = record(row.calculator_state);
  const insights = record(record(row.results).solarInsights);
  const kw = positive(state.systemKw);
  const perW = positive(state.costPerW);
  const hours = positive(insights.sunshineHours);
  return {
    service_address: row.address, property_type: normalizeSolarType(row.property_type),
    ...(kw ? { system_kw_dc: kw } : {}),
    ...(kw && perW ? { installed_cost: Math.round(kw * perW * 1000) } : {}),
    ...(kw && hours ? { annual_production_kwh: Math.round(kw * estimateProductionPerKw(hours)), production_source: "Assessment estimate · Google Solar sunshine × shared derate; confirm with installer" } : {}),
  };
}