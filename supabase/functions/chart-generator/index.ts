import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Internal (admin-gated) chart generator. Two plain "return JSON only" LLM calls,
// no function/tool-calling -- matches how classify-new-votes / parse-bill /
// generate-recommendations already talk to the Lovable AI gateway in this repo.
//
//   1. ROUTE   prompt + view catalog -> {view, columns, filters, order_by, limit}
//   2. EXECUTE that plan against Supabase with a hard whitelist (view name, its
//      columns, filter operators, row cap) -- the model never sees or writes SQL.
//   3. CHART   the real rows -> a Chart.js v4 config. The model is told to use the
//      rows verbatim; it never invents data points.
//
// "tweak" (refine) only restyles the existing spec -- it never re-queries -- so
// changing the underlying data/range means a new "generate" prompt, not a tweak.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase configuration for admin token validation");
    return false;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ action: "validate", token }),
    });
    const result = await res.json();
    return result.valid === true;
  } catch (err) {
    console.error("Error validating admin token:", err);
    return false;
  }
}

type ViewEntry = { columns: string[]; description: string };

const VIEW_CATALOG: Record<string, ViewEntry> = {
  stats_solar_by_year: {
    columns: ["year", "installs", "battery_installs", "solar_only_installs", "total_kw"],
    description: "Austin solar permits per calendar year, 2014-present. installs is the total permit count; battery_installs is the subset mentioning battery storage; total_kw is summed installed_kw.",
  },
  stats_solar_by_fiscal_year: {
    columns: ["fiscal_year", "installs", "battery_installs", "solar_only_installs", "total_kw"],
    description: "Same measures as stats_solar_by_year, bucketed by Austin's fiscal year (Oct 1 - Sep 30; fiscal_year N = Oct (N-1) through Sep N), 2015-present.",
  },
  stats_solar_by_quarter: {
    columns: ["year", "quarter", "period", "installs", "battery_installs", "solar_only_installs", "total_kw"],
    description: "Same measures as stats_solar_by_year, bucketed by calendar quarter since 2014. period is a display label like \"2023 Q2\".",
  },
  stats_solar_by_district: {
    columns: ["council_district", "year", "installs", "total_kw"],
    description: "Solar permit count and total_kw by Austin City Council district and calendar year, 2014-present. council_district is \"Unknown\" when the permit had none.",
  },
  stats_solar_permit_timeline: {
    columns: ["year", "permits", "avg_days", "median_days"],
    description: "Average and median calendar days from permit application to completion, by year of application, 2014-present.",
  },
  stats_generation_by_month_fuel: {
    columns: ["period", "month", "fuel", "catalog_avg_mw", "austin_energy_avg_mw"],
    description: "Monthly average generation (MW) by fuel type across the power_plants catalog (mostly ERCOT-region). catalog_avg_mw sums every plant; austin_energy_avg_mw weights each plant by its Austin Energy ownership share -- use austin_energy_avg_mw for anything described as \"Austin's\" generation mix, catalog_avg_mw for statewide/ERCOT questions. period is 'YYYY-MM'.",
  },
  stats_ev_charging_by_year: {
    columns: ["year", "stations_opened", "l1_ports", "l2_ports", "dc_fast_ports", "cumulative_stations", "cumulative_ports"],
    description: "Public EV charging stations in Austin (NREL feed) by year opened: stations/ports added that year, plus running cumulative totals.",
  },
  stats_council_climate_votes_by_year: {
    columns: ["year", "climate_items", "unanimous_yes", "contested", "avg_yes_votes", "avg_no_votes"],
    description: "Austin City Council agenda items tagged as climate-related, by meeting year: item count, how many passed unanimously, how many had any no vote, and average yes/no vote counts.",
  },
};

const CATALOG_TEXT = Object.entries(VIEW_CATALOG)
  .map(([name, e]) => `- ${name} (columns: ${e.columns.join(", ")}): ${e.description}`)
  .join("\n");

const ALLOWED_OPS = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "in"]);

const ROUTE_SYSTEM = `You turn a chart request into a query plan against a fixed set of read-only database views.

Available views:
${CATALOG_TEXT}

Return ONLY a raw JSON object -- no markdown, no explanation:
{
  "view": "<one of the view names above>",
  "columns": ["..."],          // subset of that view's columns; omit or use all if unsure
  "filters": [{"column": "...", "op": "eq|neq|gt|gte|lt|lte|in", "value": ...}],
  "order_by": {"column": "...", "direction": "asc|desc"},
  "limit": 200                  // omit for the default; max 500
}

Rules:
- Pick exactly one view -- the one whose grain and columns best match the request.
- "in" filter values must be an array.
- Only reference columns that exist on the chosen view.
- If the request doesn't clearly match any view, still pick the closest one and return an empty filters array rather than refusing.`;

const CHART_SYSTEM = `You are a data visualization expert. You will be given a user's chart request and a ROWS array: real rows just queried from the site's database (with the source view name and its column list).

Return ONLY a raw JSON object -- no markdown, no code fences, no explanation.

CRITICAL: use the ROWS data EXACTLY as given. Do not invent, round unusually, extrapolate, or add data points beyond what is in ROWS. If ROWS is empty, return a valid chart with no datasets and a title noting no matching data was found.

The JSON must include:
  "type"    - chart type string: "bar", "line", "pie", "doughnut", "scatter", "radar", "polarArea"
  "data"    - { "labels": [...], "datasets": [ { "label": "...", "data": [...], ... } ] }
  "options" - full options object including plugins, scales, and layout

REQUIRED STRUCTURE FOR OPTIONS:
{
  "responsive": true,
  "maintainAspectRatio": false,
  "layout": { "padding": 24 },
  "plugins": {
    "title": { "display": true, "text": "...", "font": { "size": 20, "weight": "bold" }, "color": "#111111" },
    "legend": { "display": true, "labels": { "font": { "size": 13 }, "color": "#111111" } },
    "customCanvasBackgroundColor": { "color": "#ffffff" }
  },
  "scales": {
    "x": { "ticks": { "font": { "size": 12 }, "color": "#111111" }, "grid": { "color": "#e2e8f0" } },
    "y": { "ticks": { "font": { "size": 12 }, "color": "#111111" }, "grid": { "color": "#e2e8f0" } }
  }
}

RULES:
- Background stays "#ffffff" with dark text ("#111111") unless the user explicitly asks for a dark chart -- if so, use "#08090a" background with "#e2e8f0" text/grid, applied consistently to title, legend, and all scale ticks/titles.
- Always set responsive = true, maintainAspectRatio = false.
- Always include a descriptive title that names what the data actually is (source view's subject, not the raw view name) and the range covered.
- Format large axis tick values compactly (1200000 -> "1.2M") via scales[axis].ticks.callback.
- For "pie"/"doughnut", data must be a flat array of numbers with no y-axis scale.
- For "bar"/"line", datasets[].data must be a flat array of numbers matching labels, in the same order as ROWS.
- Include reasonable backgroundColor values (hex or rgba) that read well on the chosen background.
- The config must be directly usable as Chart.js constructor options with no modification.`;

const TWEAK_SYSTEM = `You are a data visualization expert. You will be given an EXISTING Chart.js v4 configuration and a plain-English instruction describing a styling or presentation change (chart type, colors, background, font sizes, title, legend, sort order, etc). You are NOT given new data -- do not add, remove, or alter any data values; only restyle or reshape the existing dataset (e.g. changing chart type may require reshaping data/options, but the underlying numbers must be preserved).

Return ONLY the complete, updated raw JSON object -- no markdown, no explanation.

Rules:
- Start from the existing config and change only what the instruction implies; preserve everything else.
- Keep responsive = true, maintainAspectRatio = false, and a visible title.
- If changing the background, update title/legend/tick/grid colors to stay legible, consistently.
- If changing chart type (e.g. bar to pie), reshape data appropriately for the new type without changing the numbers.
- The config must be directly usable as Chart.js constructor options with no modification.`;

async function callGateway(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  const rawText = await res.text();
  let payload: any;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(`Gateway returned non-JSON (status ${res.status}): ${rawText.slice(0, 200)}`);
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("OUT_OF_CREDITS");
    throw new Error(payload?.error?.message ?? `Gateway error ${res.status}`);
  }
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from model.");
  return text;
}

function extractJson(text: string): any {
  let cleaned = String(text ?? "").trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  if (!cleaned.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

type SafePlan = {
  view: string;
  columns: string[];
  filters: { column: string; op: string; value: unknown }[];
  order_by: { column: string; ascending: boolean } | null;
  limit: number;
};

function validatePlan(raw: any): { ok: true; plan: SafePlan } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Empty query plan." };
  const entry = VIEW_CATALOG[raw.view];
  if (!entry) return { ok: false, error: `Unknown view "${raw.view}".` };

  const columns = Array.isArray(raw.columns) && raw.columns.length > 0 ? raw.columns : entry.columns;
  for (const c of columns) {
    if (typeof c !== "string" || !entry.columns.includes(c)) {
      return { ok: false, error: `Unknown column "${c}" for view "${raw.view}".` };
    }
  }

  const filters: SafePlan["filters"] = [];
  if (raw.filters !== undefined) {
    if (!Array.isArray(raw.filters)) return { ok: false, error: "filters must be an array." };
    for (const f of raw.filters) {
      if (!f || !entry.columns.includes(f.column) || !ALLOWED_OPS.has(f.op)) {
        return { ok: false, error: `Invalid filter: ${JSON.stringify(f)}` };
      }
      if (f.op === "in" && !Array.isArray(f.value)) {
        return { ok: false, error: `"in" filter on "${f.column}" needs an array value.` };
      }
      filters.push({ column: f.column, op: f.op, value: f.value });
    }
  }

  let order_by: SafePlan["order_by"] = null;
  if (raw.order_by) {
    if (!raw.order_by.column || !entry.columns.includes(raw.order_by.column)) {
      return { ok: false, error: `Invalid order_by column "${raw.order_by?.column}".` };
    }
    order_by = { column: raw.order_by.column, ascending: raw.order_by.direction !== "desc" };
  }

  const requested = Number(raw.limit);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), MAX_LIMIT) : DEFAULT_LIMIT;

  return { ok: true, plan: { view: raw.view, columns, filters, order_by, limit } };
}

async function runPlan(supabase: any, plan: SafePlan) {
  let q = supabase.from(plan.view).select(plan.columns.join(","));
  for (const f of plan.filters) {
    q = (q as any)[f.op](f.column, f.value);
  }
  if (plan.order_by) q = q.order(plan.order_by.column, { ascending: plan.order_by.ascending });
  q = q.limit(plan.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

function validateChartSpec(spec: any): string | null {
  if (!spec || typeof spec !== "object") return "Model did not return an object.";
  if (!spec.type) return 'Missing required field "type".';
  if (!spec.data) return 'Missing required field "data".';
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const isValidAdmin = await validateAdminToken(req.headers.get("x-admin-token"));
  if (!isValidAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Missing backend environment configuration." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const { action } = body ?? {};

  try {
    if (action === "generate") {
      const prompt = String(body.prompt ?? "").trim();
      if (prompt.length < 3 || prompt.length > 2000) {
        return new Response(JSON.stringify({ error: "Prompt must be between 3 and 2000 characters." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      let rawPlan: any;
      try {
        const text = await callGateway(LOVABLE_API_KEY, ROUTE_SYSTEM, `User request: ${prompt}`);
        rawPlan = extractJson(text);
      } catch (err) {
        return new Response(JSON.stringify({ error: describeGatewayError(err) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const validated = validatePlan(rawPlan);
      if (!validated.ok) {
        console.error("[chart-generator] invalid query plan:", validated.error, rawPlan);
        return new Response(JSON.stringify({ error: `Could not build a safe query: ${validated.error}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      let rows: any[];
      try {
        rows = await runPlan(supabase, validated.plan);
      } catch (err) {
        console.error("[chart-generator] query execution failed:", err);
        return new Response(JSON.stringify({ error: "Failed to query the underlying data." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const chartUser = [
        `User request: ${prompt}`,
        `Source view: ${validated.plan.view}`,
        `Columns: ${validated.plan.columns.join(", ")}`,
        `ROWS (${rows.length} rows, use verbatim):`,
        JSON.stringify(rows),
      ].join("\n\n");

      let spec: any;
      try {
        const text = await callGateway(LOVABLE_API_KEY, CHART_SYSTEM, chartUser);
        spec = extractJson(text);
      } catch (err) {
        return new Response(JSON.stringify({ error: describeGatewayError(err) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const specError = validateChartSpec(spec);
      if (specError) {
        console.error("[chart-generator] invalid chart spec:", specError, spec);
        return new Response(JSON.stringify({ error: `${specError} Try rephrasing your prompt.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      return new Response(
        JSON.stringify({
          spec,
          source: { view: validated.plan.view, columns: validated.plan.columns, rowCount: rows.length },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "tweak") {
      const instruction = String(body.instruction ?? "").trim();
      const currentSpec = body.currentSpec;
      if (instruction.length < 1 || instruction.length > 2000) {
        return new Response(JSON.stringify({ error: "Instruction must be between 1 and 2000 characters." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!currentSpec || typeof currentSpec !== "object") {
        return new Response(JSON.stringify({ error: "currentSpec is required." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const tweakUser = `Existing Chart.js config:\n\n${JSON.stringify(currentSpec, null, 2)}\n\nInstruction: ${instruction}`;

      let spec: any;
      try {
        const text = await callGateway(LOVABLE_API_KEY, TWEAK_SYSTEM, tweakUser);
        spec = extractJson(text);
      } catch (err) {
        return new Response(JSON.stringify({ error: describeGatewayError(err) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      const specError = validateChartSpec(spec);
      if (specError) {
        console.error("[chart-generator] invalid tweaked spec:", specError, spec);
        return new Response(JSON.stringify({ error: `${specError} Try rephrasing your instruction.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 502,
        });
      }

      return new Response(JSON.stringify({ spec }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "catalog") {
      return new Response(JSON.stringify({ views: VIEW_CATALOG }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    console.error("[chart-generator] unhandled error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function describeGatewayError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "RATE_LIMITED") return "The model is rate-limited right now. Try again shortly.";
  if (message === "OUT_OF_CREDITS") return "AI usage limit reached for this workspace.";
  return "The model request failed. Try rephrasing your prompt.";
}
