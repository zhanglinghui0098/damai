import { chatStream, type ChatMessage } from "@/lib/MiniMax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { messages: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("messages 必填且非空", { status: 400 });
  }

  // 简化: 只把 system + 最后 10 条 user/assistant 送给模型
  const sys = body.messages.find((m) => m.role === "system");
  const tail = body.messages.filter((m) => m.role !== "system").slice(-10);
  const finalMessages: ChatMessage[] = sys
    ? [sys, ...tail]
    : tail;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of chatStream({ messages: finalMessages })) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: { content: delta } }],
              })}\n\n`,
            ),
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: { message: e?.message || "unknown", status: e?.status || 500 },
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}