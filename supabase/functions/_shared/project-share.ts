import { DEFAULT_PRODUCTION_PER_KW, SYSTEM_DERATE } from "./solar-rates.ts";
import { solarFormRoute, solarForms } from "./rebate-form-model.ts";

const rec = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const pos = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;

export interface ProjectSummary {
  title: string; address: string; property_type: string;
  system_kw_dc: number | null; installed_cost: number | null; annual_production_kwh: number | null;
  production_basis: string | null; program: string | null; note: string;
  forms: { label: string; url: string }[]; updated_at: string;
}

export function buildProjectSummary(row: { address: string; property_type: string; label: string | null; calculator_state: unknown; results: unknown; updated_at: string }): ProjectSummary {
  const s = rec(row.calculator_state);
  const kw = pos(s.systemKw), perW = pos(s.costPerW);
  const hours = pos(rec(rec(row.results).solarInsights).sunshineHours);
  const route = solarFormRoute({ property_type: row.property_type, system_kw_dc: kw });
  return {
    title: row.label || row.address, address: row.address, property_type: row.property_type,
    system_kw_dc: kw, installed_cost: kw && perW ? Math.round(kw * perW * 1000) : null,
    annual_production_kwh: kw ? Math.round(kw * (hours ? hours * SYSTEM_DERATE : DEFAULT_PRODUCTION_PER_KW)) : null,
    production_basis: kw ? (hours ? "Google Solar sunshine hours × system derate" : "Austin default production per kW") : null,
    program: route.program, note: route.note,
    forms: route.forms.map((f) => solarForms[f]), updated_at: row.updated_at,
  };
}

const esc = (v: unknown) => { const t = v == null ? "" : String(v); return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
export function summaryCsv(p: ProjectSummary): string {
  const rows: [string, unknown][] = [
    ["Project", p.title], ["Service address", p.address], ["Property type", p.property_type],
    ["System size (kW DC)", p.system_kw_dc], ["Estimated installed cost ($)", p.installed_cost],
    ["Estimated annual production (kWh)", p.annual_production_kwh], ["Production basis", p.production_basis],
    ["Suggested Austin Energy program", p.program ?? "Needs individual review"], ["Program note", p.note],
    ...p.forms.map((f) => [`Form: ${f.label}`, f.url] as [string, unknown]),
    ["Last updated", p.updated_at], ["Disclaimer", "Estimates only; confirm with installer and Austin Energy."],
  ];
  return ["field,value", ...rows.map(([k, v]) => `${esc(k)},${esc(v)}`)].join("\n");
}
