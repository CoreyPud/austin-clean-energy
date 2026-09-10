// LLM adapter — OpenAI-compatible chat completions with JSON output.
//
// This is the ONLY seam that changes when the parser moves to a Supabase edge
// function: locally it points at OpenAI (or any OpenAI-compatible endpoint) with
// a key from .env.local; on the edge you set LLM_BASE_URL to the Lovable gateway
// (https://ai.gateway.lovable.dev/v1) and LLM_MODEL to google/gemini-3-flash-preview.
// The request/response shape is identical, so no other code changes.
import "./env.js";

const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
const API_KEY = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;

export const llmModel = MODEL;

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
}

let totalUsage: LlmUsage = { promptTokens: 0, completionTokens: 0 };
export const getTotalUsage = (): LlmUsage => ({ ...totalUsage });

/** Call the model and parse a JSON object response. `schemaHint` goes in the system prompt. */
export async function llmJson<T>(system: string, user: string): Promise<T> {
  if (!API_KEY) throw new Error("No LLM key (set OPENAI_API_KEY or LLM_API_KEY in .env.local)");
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  if (data.usage) {
    totalUsage.promptTokens += data.usage.prompt_tokens;
    totalUsage.completionTokens += data.usage.completion_tokens;
  }
  const content = data.choices[0]?.message.content ?? "{}";
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`LLM returned non-JSON: ${content.slice(0, 200)}`);
  }
}
