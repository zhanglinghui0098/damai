"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getTemplateById, type Template } from "@/lib/templates";

export default function CreatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tpl = getTemplateById(params.id);

  if (!tpl) {
    return (
      <div className="section">
        <div className="container">
          <h1 className="h-section">模板不存在</h1>
          <Link href="/templates" className="btn btn-primary" style={{ marginTop: "1rem" }}>返回模板中心</Link>
        </div>
      </div>
    );
  }

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  function handleChange(qid: string, val: string) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  function allRequiredFilled() {
    return tpl.questions.filter((q) => q.required).every((q) => (answers[q.id] || "").trim().length > 0);
  }

  function handleGenerate() {
    if (!allRequiredFilled()) return;
    setGenerating(true);
    // mock 生成 (4 secret 冻结中, 假装跑 3 秒)
    setTimeout(() => {
      const qs = new URLSearchParams({ template: tpl.id, ...answers });
      router.push(`/generate?${qs.toString()}`);
    }, 3000);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        {/* 顶部 — 模板信息 */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/templates" className="t-small" style={{ color: "var(--text-secondary)", display: "inline-block", marginBottom: "0.75rem" }}>
            ← 返回模板
          </Link>
          <h1 className="h-section" style={{ marginBottom: "0.5rem" }}>{tpl.name}</h1>
          <p className="t-sub" style={{ fontSize: "1rem" }}>{tpl.description}</p>
          <div style={{ display: "flex", gap: 8, marginTop: "0.75rem" }}>
            <span className="t-small" style={{ padding: "3px 8px", background: "var(--bg-gray)", borderRadius: 4 }}>
              {tpl.duration}s
            </span>
            <span className="t-small" style={{ padding: "3px 8px", background: "var(--bg-gray)", borderRadius: 4 }}>
              {tpl.aspect}
            </span>
            <span className="t-small" style={{ padding: "3px 8px", background: "var(--bg-gray)", borderRadius: 4 }}>
              {tpl.model}
            </span>
          </div>
        </div>

        {/* 3 步表单 (1 屏显示 3 问题 — 减法原则, 不点下一步下一步) */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 18,
            padding: "1.75rem",
          }}
        >
          <div className="t-small" style={{ marginBottom: "1.5rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            填写 3 个信息, 一键出片
          </div>

          {tpl.questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                {i + 1}. {q.label}
                {q.required && <span style={{ color: "#ff6b6b", marginLeft: 4 }}>*</span>}
              </label>
              {q.type === "text" && (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  style={{
                    width: "100%", height: 42,
                    padding: "0 0.875rem",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                  }}
                />
              )}
              {q.type === "textarea" && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--text)",
                    fontSize: "0.875rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              )}
              {q.type === "select" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {q.options?.map((opt) => {
                    const active = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleChange(q.id, opt)}
                        style={{
                          padding: "0.45rem 0.95rem",
                          fontSize: "0.8125rem",
                          color: active ? "var(--text)" : "var(--text-secondary)",
                          background: active ? "var(--bg-gray)" : "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: 980,
                          cursor: "pointer",
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!allRequiredFilled() || generating}
            className="btn btn-primary"
            style={{
              width: "100%", height: 48, marginTop: "0.5rem",
              fontSize: "0.9375rem", fontWeight: 500,
              opacity: allRequiredFilled() ? 1 : 0.4,
              cursor: allRequiredFilled() ? "pointer" : "not-allowed",
            }}
          >
            {generating ? "生成中... 3 秒" : `生成 1 条 ${tpl.duration}s 视频`}
          </button>

          {generating && (
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <div className="t-small" style={{ color: "var(--text-tertiary)" }}>
                AI 正在工作 (mock — 4 secret 冻结中, 正式版接火山方舟 API)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
