import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MODEL = "o4-mini";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB decoded limit

function jsonResponse(status: number, body: unknown) {
  // Always return 200 so the Supabase JS client puts the body in `data` not `error`,
  // preserving our detailed error messages. The caller checks data.error.
  return new Response(JSON.stringify({ ...((body as any) ?? {}), _status: status }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
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

const EXTRACTION_PROMPT = [
  "This is a residential electricity bill PDF. Extract monthly electricity usage (kWh) for every month you can find.",
  "",
  "Look for monthly kWh data in this order — stop at the first source that yields per-month values:",
  "1. PRINTED TEXT OR TABLE: Any section listing kWh per month as explicit numbers (usage history tables,",
  "   account summary rows, statement detail lines, etc.). These are exact — use them and set source to 'table'.",
  "2. BAR OR LINE CHART: Any chart visualising monthly electricity usage. Read each bar height against the",
  "   kWh Y-axis scale. Set source to 'graph'. Note: Austin Energy charts use single-letter month",
  "   abbreviations (A=Apr, M=May, J=Jun, J=Jul, A=Aug, S=Sep, O=Oct, N=Nov, D=Dec, J=Jan, F=Feb,",
  "   M=Mar, A=Apr), and do not include years",
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
  '- Return every individual month-year data point you find — do NOT average or deduplicate.',
  '  If the same calendar month appears more than once, include both. If you dont know the year, assume they are sequential',
  '- "months" sorted oldest-first.',
  '- "kwh" must be a plain whole number.',
  '- "label" like "Jan 2024".',
  '- If source is "graph", note that values are approximate.',
  '- If no per-month data found at all: {"months": [], "source": "table", "note": "explanation"}.',
].join("\n");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse(500, { error: "OpenAI API key not configured." });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const { file, filename } = body ?? {};
  if (!file || typeof file !== "string") {
    return jsonResponse(400, { error: 'Provide a base64-encoded PDF in the "file" field.' });
  }

  if (file.length > MAX_FILE_BYTES * 1.4) {
    return jsonResponse(413, { error: "File too large. Maximum supported size is 5 MB." });
  }

  const fileData = file.startsWith("data:")
    ? file
    : `data:application/pdf;base64,${file}`;

  let oaiRes: Response;
  try {
    oaiRes = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename: filename ?? "bill.pdf",
                file_data: fileData,
              },
              {
                type: "input_text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
        max_output_tokens: 2000,
      }),
    });
  } catch (err: any) {
    return jsonResponse(502, { error: `OpenAI request failed: ${err.message}` });
  }

  let payload: any;
  try {
    const rawText = await oaiRes.text();
    try {
      payload = JSON.parse(rawText);
    } catch {
      return jsonResponse(502, {
        error: `OpenAI returned an unparseable response (HTTP ${oaiRes.status}).`,
      });
    }
  } catch (err: any) {
    return jsonResponse(502, { error: `Failed to read OpenAI response: ${err.message}` });
  }

  if (!oaiRes.ok) {
    const msg = payload?.error?.message ?? payload?.message ?? `OpenAI error ${oaiRes.status}`;
    return jsonResponse(502, { error: msg });
  }

  const outputText: string = payload.output?.[0]?.content?.[0]?.text ?? "";

  let parsed: any;
  try {
    parsed = parseJsonLoose(outputText);
  } catch {
    return jsonResponse(502, { error: "Could not parse model response as JSON.", raw: outputText });
  }

  if (!parsed || !Array.isArray(parsed.months)) {
    return jsonResponse(502, { error: "Unexpected response format from model.", raw: outputText });
  }

  const rawMonths = parsed.months
    .filter((m: any) => m && typeof m.kwh === "number" && Number.isFinite(m.kwh) && m.kwh >= 0)
    .map((m: any) => ({ label: String(m.label ?? ""), kwh: Math.round(m.kwh) }));

  if (rawMonths.length === 0) {
    return jsonResponse(422, {
      error: "No monthly usage data found in the bill.",
      note: String(parsed.note ?? ""),
    });
  }

  // Aggregate raw model output into one average value per calendar month (Jan–Dec).
  // The model may return multiple entries for the same calendar month (e.g. Apr 2023 + Apr 2024).
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const buckets: { sum: number; count: number }[] = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
  for (const m of rawMonths) {
    const abbr = m.label.split(" ")[0];
    const mi = MONTH_NAMES.indexOf(abbr);
    if (mi >= 0) {
      buckets[mi].sum += m.kwh;
      buckets[mi].count += 1;
    }
  }
  const months = MONTH_NAMES
    .map((name, i) => buckets[i].count > 0 ? { label: name, kwh: Math.round(buckets[i].sum / buckets[i].count) } : null)
    .filter((m): m is { label: string; kwh: number } => m !== null);

  if (months.length === 0) {
    return jsonResponse(422, {
      error: "Could not map usage data to calendar months.",
      note: String(parsed.note ?? ""),
    });
  }

  const average_monthly_kwh = Math.round(
    months.reduce((s, m) => s + m.kwh, 0) / months.length,
  );

  return jsonResponse(200, {
    months,
    average_monthly_kwh,
    source: String(parsed.source ?? "unknown"),
    note: String(parsed.note ?? ""),
  });
});
