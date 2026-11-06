// OpenAI 호출 도우미 (서버 API Route에서만 import 하세요. 키가 브라우저로 나가면 안 돼요)
const BASE = "https://api.openai.com/v1";
export const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
export const EMBED_MODEL = "text-embedding-3-small"; // 숫자 1536개

export class AiError extends Error {
  constructor(public kind: "no-key" | "timeout" | "failed", message?: string) {
    super(message ?? kind);
  }
}

function apiKey(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new AiError("no-key");
  return k;
}

async function post(path: string, body: unknown, timeoutMs: number) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new AiError("failed", `openai-${res.status}`);
    return (await res.json()) as unknown;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) throw new AiError("timeout");
    throw new AiError("failed");
  }
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

// JSON 스키마(structured output)로 답을 받아요. 스키마와 다른 모양은 오지 않아요.
export async function chatJson<T>(opts: {
  messages: Msg[];
  name: string;
  schema: object;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<T> {
  const json = (await post(
    "/chat/completions",
    {
      model: CHAT_MODEL,
      messages: opts.messages,
      response_format: { type: "json_schema", json_schema: { name: opts.name, strict: true, schema: opts.schema } },
      max_completion_tokens: opts.maxTokens ?? 700,
    },
    opts.timeoutMs ?? 40_000,
  )) as { choices?: { message?: { content?: string | null } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new AiError("failed", "empty");
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AiError("failed", "bad-json");
  }
}

export async function embed(text: string): Promise<number[]> {
  const json = (await post("/embeddings", { model: EMBED_MODEL, input: text.slice(0, 6000) }, 20_000)) as {
    data?: { embedding?: number[] }[];
  };
  const v = json.data?.[0]?.embedding;
  if (!v || v.length !== 1536) throw new AiError("failed", "bad-embedding");
  return v;
}
