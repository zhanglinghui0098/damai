/**
 * MiniMax 客户端 (OpenAI 兼容协议)
 * - 通过环境变量配置: MINIMAX_API_KEY, MINIMAX_API_BASE, MINIMAX_MODEL
 * - 支持流式 (SSE) 和非流式
 * - 若用户私有部署, 改 MINIMAX_API_BASE 即可
 */

const API_BASE = process.env.MINIMAX_API_BASE || "https://api.MiniMax.chat/v1";
const API_KEY = process.env.MINIMAX_API_KEY || "";
const MODEL = process.env.MINIMAX_MODEL || "MiniMax-Text-01";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
};

export class MiniMaxError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function assertKey() {
  if (!API_KEY) {
    throw new MiniMaxError(
      "MINIMAX_API_KEY 未设置. 复制 .env.example 为 .env.local 并填入 key.",
      500,
    );
  }
}

/** 非流式: 返回完整文本 */
export async function chat(opts: ChatOptions): Promise<string> {
  assertKey();
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new MiniMaxError(`MiniMax 调用失败: ${text}`, res.status);
  }

  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

/** 流式: 返回一个异步可迭代对象, 每次 yield 一个文本片段 */
export async function* chatStream(
  opts: ChatOptions,
): AsyncGenerator<string, void, void> {
  assertKey();
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 1024,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : `HTTP ${res.status}`;
    throw new MiniMaxError(`MiniMax 调用失败: ${text}`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json: any = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // 忽略解析失败的行 (SSE 心跳等)
      }
    }
  }
}