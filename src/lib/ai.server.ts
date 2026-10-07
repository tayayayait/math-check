// Server-only Lovable AI Gateway helper (Responses API, streamed, strict JSON schema).
const MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Content = { type: "input_text"; text: string } | { type: "input_image"; image_url: string };

export async function callJson<T>(opts: {
  name: string;
  instructions: string;
  content: Content[];
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(401, "AI key missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: opts.instructions,
      input: [{ role: "user", content: opts.content }],
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: {
        format: { type: "json_schema", name: opts.name, schema: opts.schema, strict: true },
      },
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, t.slice(0, 500));
    throw new AiError(res.status, `AI 요청 실패 (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let refused = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.refusal.delta") refused = true;
        else if (ev.type === "response.failed" || ev.type === "error") {
          throw new AiError(500, "AI 응답 실패");
        }
      } catch (e) {
        if (e instanceof AiError) throw e;
      }
    }
  }
  if (refused || !text.trim()) throw new AiError(422, "MODEL_REFUSAL");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError(422, "SCHEMA_INVALID");
  }
}
