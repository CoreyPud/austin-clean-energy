import { describe, expect, it } from "bun:test";
import { BILL_GATEWAY_URL, billRequest, readBillStream } from "./gateway.ts";

function stream(parts: string[]) {
  return new ReadableStream<Uint8Array>({ start(controller) {
    parts.forEach(part => controller.enqueue(new TextEncoder().encode(part)));
    controller.close();
  } });
}

describe("bill gateway", () => {
  it("uses the selected Gemini 3.8 Flash through Lovable", () => {
    expect(billRequest("JVBERi0=", "Return JSON").model).toBe("google/gemini-3.8-flash");
    expect(BILL_GATEWAY_URL).toBe("https://ai.gateway.lovable.dev/v1/chat/completions");
  });
  it("preserves PDF media and consumes streamed output without an upgrade output cap", () => {
    const request = billRequest("JVBERi0=", "Return JSON");
    expect(request.messages[0].content[0].file?.file_data).toBe("data:application/pdf;base64,JVBERi0=");
    expect(request.stream).toBe(true);
    expect(request).not.toHaveProperty("max_tokens");
  });
  it("reads JSON split across SSE network chunks", async () => {
    const first = 'data: {"choices":[{"delta":{"content":"{\\"months\\":"}}]}\n\n';
    const second = 'data: {"choices":[{"delta":{"content":"[]}"},"finish_reason":"stop"}]}\r\n\r\n';
    expect(await readBillStream(stream([first.slice(0, 17), first.slice(17), second, 'data: [DONE]\n\n']))).toBe('{"months":[]}');
  });
  it("preserves terminal denial status and message", async () => {
    await expect(readBillStream(stream(['data: {"error":{"status":403,"message":"Access denied"}}\n\n'])))
      .rejects.toMatchObject({ status: 403, message: "Access denied" });
  });
  it("rejects truncated or refused output", async () => {
    await expect(readBillStream(stream(['data: {"choices":[{"delta":{"content":"{"}}]}\n\n']))).rejects.toThrow("no complete result");
    await expect(readBillStream(stream(['data: {"choices":[{"delta":{"refusal":"No"}}]}\n\n']))).rejects.toThrow("declined");
  });
});