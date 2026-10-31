import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { BILL_GATEWAY_URL, BILL_MODEL, billRequest, GatewayError, readBillStream } from "./gateway.ts";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EXTRACTION_PROMPT = [
  "This is a residential electricity bill PDF. Extract monthly electricity usage (kWh) for every month you can find.",
  "",
  "Look for monthly kWh data in this order — stop at the first source that yields per-month values:",
  "1. PRINTED TEXT OR TABLE: Any section listing kWh per month as explicit numbers (usage history tables,",
  "   account summary rows, statement detail lines, etc.). These are exact — use them and set source to 'table'.",
  "2. BAR OR LINE CHART: Any chart visualising monthly electricity usage. Read each bar height against the",
  "   kWh Y-axis scale. Set source to 'graph'. Note: Austin Energy charts use single-letter month",
  "   abbreviations (A=Apr, M=May, J=Jun, J=Jul, A=Aug, S=Sep, O=Oct, N=Nov, D=Dec, J=Jan, F=Feb,",
  "   M=Mar, A=Apr), and do not include years.",
  "3. DERIVED: If only a single month's kWh and a multi-month average are printed (e.g. 'kWh Used: 390',",
  "   '13 month avg: 433'), return just the months you can confidently assign to specific month/year labels.",
  "",
  "Return ONLY a valid JSON object — no prose, no markdown:",
  "{",
  '  "months": [{"label": "MMM YYYY", "kwh": number}, ...],',
  '  "source": "table" | "graph",',
  '  "note": "one sentence: what you found, how many months, and whether values are exact or approximate"',
  "}",
  "",
  "Rules:",
  "- Return every individual month-year data point — do NOT average or deduplicate.",
  "  If the same calendar month appears in multiple years, include each separately.",
  "  If you don't know the year, assume months are sequential.",
  '- "months" sorted oldest-first.',
  '- "kwh" must be a plain whole number.',
  '- "label" like "Jan 2024".',
  '- If source is "graph", note that values are approximate.',
  '- If no per-month data found: {"months": [], "source": "table", "note": "explanation"}.',
].join("\n");

function jsonResponse(status: number, body: unknown, gatewayHeaders?: Headers) {
  const headers = new Headers({ ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  const exposed: string[] = [];
  gatewayHeaders?.forEach((value, name) => {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) {
      headers.set(name, value);
      exposed.push(name);
    }
  });
  if (exposed.length) headers.set("Access-Control-Expose-Headers", exposed.join(", "));
  return new Response(JSON.stringify({ ...((body as any) ?? {}), _status: status }), {
    status,
    headers,
  });
}

function parseJsonLoose(text: string): any {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

// Returns raw base64 string (strips data: prefix if present)
function toRawBase64(file: string): string {
  return file.startsWith("data:") ? file.split(",")[1] : file;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  let body: any;
  try { body = await req.json(); }
  catch { return jsonResponse(400, { error: "Invalid JSON body." }); }

  const { file } = body ?? {};
  if (!file || typeof file !== "string") {
    return jsonResponse(400, { error: 'Provide a base64-encoded PDF in the "file" field.' });
  }
  if (file.length > MAX_FILE_BYTES * 1.4) {
    return jsonResponse(413, { error: "File too large. Maximum supported size is 5 MB." });
  }

  const base64 = toRawBase64(file);
  try {
    const bytes = atob(base64);
    if (bytes.length > MAX_FILE_BYTES) return jsonResponse(413, { error: "File too large. Maximum supported size is 5 MB." });
    if (!bytes.startsWith("%PDF-")) return jsonResponse(400, { error: "Please upload a valid, non-empty PDF bill." });
  } catch { return jsonResponse(400, { error: "Invalid base64 PDF data." }); }

  let outputText: string;
  let gatewayHeaders: Headers | undefined;
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse(500, { error: "Lovable AI bill reader is not configured." });
    const res = await fetch(BILL_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify(billRequest(base64, EXTRACTION_PROMPT)),
    });
    gatewayHeaders = res.headers;
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      return jsonResponse(res.status, { error: payload?.message ?? payload?.error?.message ?? `Lovable AI request failed (${res.status}).` }, gatewayHeaders);
    }
    if (!res.body) throw new GatewayError(502, "The bill reader returned an empty response.");
    outputText = await readBillStream(res.body);
  } catch (err) {
    return jsonResponse(err instanceof GatewayError ? err.status : 502,
      { error: err instanceof GatewayError ? err.message : "Could not connect to the Lovable AI bill reader." }, gatewayHeaders);
  }

  let parsed: any;
  try { parsed = parseJsonLoose(outputText); }
  catch { return jsonResponse(502, { error: "Could not parse model response as JSON." }, gatewayHeaders); }

  if (!parsed || !Array.isArray(parsed.months)) {
    return jsonResponse(502, { error: "Unexpected response format from model." }, gatewayHeaders);
  }

  const rawMonths = parsed.months
    .filter((m: any) => m && typeof m.kwh === "number" && Number.isFinite(m.kwh) && m.kwh >= 0)
    .map((m: any) => ({ label: String(m.label ?? ""), kwh: Math.round(m.kwh) }));

  if (rawMonths.length === 0) {
    return jsonResponse(422, { error: "No monthly usage data found in the bill.", note: String(parsed.note ?? "") });
  }

  // Aggregate into one average value per calendar month (Jan–Dec)
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const buckets: { sum: number; count: number }[] = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
  for (const m of rawMonths) {
    const mi = MONTH_NAMES.indexOf(m.label.split(" ")[0]);
    if (mi >= 0) { buckets[mi].sum += m.kwh; buckets[mi].count += 1; }
  }
  const months = MONTH_NAMES
    .map((name, i) => buckets[i].count > 0 ? { label: name, kwh: Math.round(buckets[i].sum / buckets[i].count) } : null)
    .filter((m): m is { label: string; kwh: number } => m !== null);

  if (months.length === 0) {
    return jsonResponse(422, { error: "Could not map usage data to calendar months.", note: String(parsed.note ?? "") });
  }

  const average_monthly_kwh = Math.round(months.reduce((s, m) => s + m.kwh, 0) / months.length);

  return jsonResponse(200, {
    months,
    average_monthly_kwh,
    source: String(parsed.source ?? "unknown"),
    note: String(parsed.note ?? ""),
    provider: "lovable",
    model: BILL_MODEL,
  }, gatewayHeaders);
});
