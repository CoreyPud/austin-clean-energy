import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildProjectSummary, summaryCsv } from "./project-share.ts";

const base = { address: "1 Main St", property_type: "single-family", label: null, updated_at: "2026-01-01" };

Deno.test("summary computes cost from kW × $/W and production from sunshine", () => {
  const p = buildProjectSummary({ ...base, calculator_state: { systemKw: 8, costPerW: 2.5 }, results: { solarInsights: { sunshineHours: 1500 } } });
  assertEquals(p.installed_cost, 20000);
  assertEquals(p.annual_production_kwh, Math.round(8 * 1500 * 0.86));
  assertEquals(p.program, "Residential solar");
});

Deno.test("summary leaves unknown values empty instead of inventing them", () => {
  const p = buildProjectSummary({ ...base, calculator_state: {}, results: {} });
  assertEquals(p.system_kw_dc, null);
  assertEquals(p.installed_cost, null);
  assertEquals(p.annual_production_kwh, null);
});

Deno.test("csv escapes commas", () => {
  const p = buildProjectSummary({ ...base, address: "1 Main St, Austin", calculator_state: {}, results: {} });
  assertEquals(summaryCsv(p).includes('"1 Main St, Austin"'), true);
});
