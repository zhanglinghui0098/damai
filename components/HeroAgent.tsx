"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AIInput from "./AIInput";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED = ["新品发布", "产品种草", "客户见证", "促销活动"];

const SYSTEM_PROMPT = `你是"大脉"的 AI 助手, 服务于签约客户.
你的任务: 1) 回答关于短视频营销的问题 2) 帮用户梳理创作需求 3) 在合适的时候引导用户去选模板或进画布.
风格: 专业、简洁、温暖. 不要堆砌套话. 用 2-4 句话回答, 不要长篇大论.
如果用户表达明确创作意图 (如"做一款 XX 视频"), 在回答末尾提示: "可以选个模板快速开始, 或者进画布自己组合。"`;

export default function HeroAgent() {
  const router = useRouter();
  const params = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 从画布跳转过来: ?focus=agent → 自动聚焦输入框 + 平滑滚到此处
  useEffect(() => {
    if (params.get("focus") === "agent" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [params]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text };
    const next: Message[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...next,
          ],
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Agent 调用失败");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      // 插入空 assistant 消息用于流式更新
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

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
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "网络开了小差, 再试一次?" },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
  }

  const showQuickReplies = messages.length > 0 && !streaming;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          style={{
            maxHeight: 380,
            overflowY: "auto",
            marginBottom: "1.25rem",
            padding: "1.25rem 1.5rem",
            background: "var(--bg-gray)",
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "0.625rem 1rem",
                  borderRadius: 18,
                  fontSize: "0.9375rem",
                  lineHeight: 1.5,
                  background: m.role === "user" ? "var(--accent)" : "var(--bg-elevated)",
                  color: m.role === "user" ? "#fff" : "var(--text)",
                  border:
                    m.role === "user" ? "none" : "1px solid var(--border-light)",
                }}
              >
                {m.content || (
                  <span style={{ opacity: 0.5 }}>…</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{ width: "100%", maxWidth: 720, margin: "0 auto" }}
      >
        <AIInput
          variant="default"
          placeholder="试试说: 生成一个赛博朋克风格的沙发广告视频"
          onSubmit={(v) => send(v)}
        />
      </form>

      {/* 隐藏旧 input ref 用于外部触发 */}
      <input
        ref={inputRef}
        type="hidden"
        value={input}
        readOnly
      />

      {/* 冷启动建议 */}
      {messages.length === 0 && (
        <div
          className="hero-suggested"
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                color: "var(--text)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-light)",
                borderRadius: 980,
                transition: "background 0.18s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")
              }
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 创作引导 quick-reply */}
      {showQuickReplies && (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "1rem",
          }}
        >
          <button
            onClick={() => router.push("/templates")}
            className="link-arrow"
            style={{ background: "none" }}
          >
            去选模板
          </button>
          <button
            onClick={() => router.push("/canvas-v2")}  // 07-10: codex 自研静态 SPA (生产主画布)
            className="link-arrow"
            style={{ background: "none" }}
          >
            进画布
          </button>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.75rem",
          color: "var(--text-tertiary)",
        }}
      >
      </div>
    </div>
  );
}