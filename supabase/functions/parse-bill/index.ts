import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-4.1";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

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

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify({ ...((body as any) ?? {}), _status: status }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
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

async function callOpenAI(base64: string, filename: string, apiKey: string): Promise<string> {
  const fileData = `data:application/pdf;base64,${base64}`;
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [{
        role: "user",
        content: [
          { type: "input_file", filename: filename ?? "bill.pdf", file_data: fileData },
          { type: "input_text", text: EXTRACTION_PROMPT },
        ],
      }],
      max_output_tokens: 2000,
    }),
  });
  const rawText = await res.text();
  const payload = JSON.parse(rawText);
  if (!res.ok) throw new Error(payload?.error?.message ?? `OpenAI error ${res.status}`);
  const messageOutput = payload.output?.find((o: any) => o.type === "message");
  const textContent = (messageOutput ?? payload.output?.[0])?.content
    ?.find((c: any) => c.type === "text" || c.type === "output_text");
  return textContent?.text ?? "";
}

async function callGemini(base64: string, apiKey: string): Promise<string> {
  const res = await fetch(GEMINI_URL(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64 } },
          { text: EXTRACTION_PROMPT },
        ],
      }],
      generationConfig: { maxOutputTokens: 2000, responseMimeType: "application/json" },
    }),
  });
  const rawText = await res.text();
  const payload = JSON.parse(rawText);
  if (!res.ok) throw new Error(payload?.error?.message ?? `Gemini error ${res.status}`);
  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  let body: any;
  try { body = await req.json(); }
  catch { return jsonResponse(400, { error: "Invalid JSON body." }); }

  const { file, filename, provider = "gemini" } = body ?? {};
  if (!file || typeof file !== "string") {
    return jsonResponse(400, { error: 'Provide a base64-encoded PDF in the "file" field.' });
  }
  if (file.length > MAX_FILE_BYTES * 1.4) {
    return jsonResponse(413, { error: "File too large. Maximum supported size is 5 MB." });
  }

  const base64 = toRawBase64(file);

  let outputText: string;
  try {
    if (provider === "gemini") {
      const apiKey = Deno.env.get("GEMINI_KEY");
      if (!apiKey) return jsonResponse(500, { error: "Gemini API key not configured." });
      outputText = await callGemini(base64, apiKey);
    } else {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) return jsonResponse(500, { error: "OpenAI API key not configured." });
      outputText = await callOpenAI(base64, filename, apiKey);
    }
  } catch (err: any) {
    return jsonResponse(502, { error: `Model request failed: ${err.message}` });
  }

  let parsed: any;
  try { parsed = parseJsonLoose(outputText); }
  catch { return jsonResponse(502, { error: "Could not parse model response as JSON.", raw: outputText }); }

  if (!parsed || !Array.isArray(parsed.months)) {
    return jsonResponse(502, { error: "Unexpected response format from model.", raw: outputText });
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
    provider,
  });
});
