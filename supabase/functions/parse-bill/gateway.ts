export const BILL_MODEL = "google/gemini-3.8-flash";
export const BILL_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function billRequest(base64: string, prompt: string) {
  return {
    model: BILL_MODEL,
    stream: true,
    reasoning: { effort: "none" },
    messages: [{
      role: "user",
      content: [
        { type: "file", file: { filename: "bill.pdf", file_data: `data:application/pdf;base64,${base64}` } },
        { type: "text", text: prompt },
      ],
    }],
    response_format: { type: "json_object" },
  };
}

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Consume complete SSE frames even when a network chunk splits a JSON value.
export async function readBillStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let ended = false;
  function frame(value: string) {
    const data = value.split(/\r?\n/).filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart()).join("\n");
    if (!data) return;
    if (data === "[DONE]") { ended = true; return; }
    const event = JSON.parse(data);
    if (event.error) {
      const status = Number(event.error.status ?? event.error.code);
      throw new GatewayError(status >= 400 && status < 600 ? status : 502,
        event.error.message ?? "The bill reader request failed.");
    }
    for (const choice of event.choices ?? []) {
      if (choice.delta?.refusal || choice.finish_reason === "content_filter") {
        throw new GatewayError(422, "The model declined to read this bill.");
      }
      if (typeof choice.delta?.content === "string") text += choice.delta.content;
      if (choice.finish_reason === "length") {
        throw new GatewayError(502, "The bill reader returned an incomplete result.");
      }
      if (choice.finish_reason === "stop") ended = true;
    }
  }
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      let match: RegExpExecArray | null;
      while ((match = /\r?\n\r?\n/.exec(buffer)) !== null) {
        frame(buffer.slice(0, match.index));
        buffer = buffer.slice(match.index + match[0].length);
      }
      if (chunk.done) break;
    }
    if (buffer.trim()) frame(buffer);
    if (!ended || !text.trim()) throw new GatewayError(502, "The bill reader returned no complete result.");
    return text;
  } finally {
    reader.releaseLock();
  }
}