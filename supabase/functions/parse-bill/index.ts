import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4o";
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
  "This is a residential electricity bill PDF. Extract every monthly electricity usage value in kWh that appears anywhere in the document.",
  "",
  "PRIORITY ORDER for finding usage data:",
  "1. Printed tables or text listing kWh by month — most reliable, use these first.",
  "2. Bar charts or line graphs showing monthly usage history — read bar heights or data points against the axis scale if no printed values are present.",
  "",
  "Extract every month you can find, going as far back as the document shows. Include the month and year for each entry.",
  "",
  "Return ONLY a valid JSON object — no prose, no markdown — in exactly this shape:",
  "{",
  '  "months": [{"label": "MMM YYYY", "kwh": number}, ...],',
  '  "source": "table" | "graph" | "mixed",',
  '  "note": "one-sentence description of what you found and how far back the data goes"',
  "}",
  "",
  "Rules:",
  '- "months" must be sorted oldest-first.',
  '- Each "kwh" must be a plain number, never a string.',
  '- "label" should be like "Jan 2024".',
  "- If you read values from a graph, still include them — note this in source and note.",
  '- If you truly cannot find any usage data, return {"months": [], "source": "none", "note": "explanation"}.',
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
        max_output_tokens: 800,
      }),
    });
  } catch (err: any) {
    return jsonResponse(502, { error: `OpenAI request failed: ${err.message}` });
  }

  const payload = await oaiRes.json();
  if (!oaiRes.ok) {
    return jsonResponse(502, { error: payload.error?.message ?? "OpenAI request failed." });
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

  const validMonths = parsed.months
    .filter((m: any) => m && typeof m.kwh === "number" && Number.isFinite(m.kwh) && m.kwh >= 0)
    .map((m: any) => ({ label: String(m.label ?? ""), kwh: Math.round(m.kwh) }));

  if (validMonths.length === 0) {
    return jsonResponse(422, {
      error: "No monthly usage data found in the bill.",
      note: String(parsed.note ?? ""),
    });
  }

  const average_monthly_kwh = Math.round(
    validMonths.reduce((s: number, m: any) => s + m.kwh, 0) / validMonths.length,
  );

  return jsonResponse(200, {
    months: validMonths,
    average_monthly_kwh,
    source: String(parsed.source ?? "unknown"),
    note: String(parsed.note ?? ""),
  });
});
