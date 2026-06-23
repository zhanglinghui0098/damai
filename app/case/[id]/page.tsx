"use client";

import { useState } from "react";
import Link from "next/link";
import CanvasViewer, { DEMO_NODES, DEMO_EDGES } from "./CanvasViewer";

const CASES: Record<string, {
  title: string; brand: string; category: string; hue: number; views: string;
  description: string; model: string; generatedAt: string;
}> = {
  c1: {
    title: "现代极简三人沙发 30s 场景",
    brand: "顾家",
    category: "沙发",
    hue: 22,
    views: "12.4w",
    description: "30s 客厅场景, 现代极简风格, 主打奶油色三人位沙发的氛围感.",
    model: "Seedance 2.0 + 可灵 TTS",
    generatedAt: "2026-06-12",
  },
};

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const c = CASES[params.id] || CASES.c1;
  const [tab, setTab] = useState<"video" | "process" | "copy">("video");

  return (
    <div className="section" style={{ paddingTop: "4rem" }}>
      <div className="container" style={{ maxWidth: 1080 }}>
        {/* 头部 */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/case"
            style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 12, display: "inline-block" }}
          >
            ‹ 案例库
          </Link>
          <h1 className="h-section" style={{ marginBottom: "0.5rem" }}>{c.title}</h1>
          <div className="t-sub" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>{c.brand}</span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span>{c.category}</span>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span>{c.views} 播放</span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex", gap: 0,
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "2rem",
          }}
        >
          {[
            { k: "video", l: "成片" },
            { k: "process", l: "创作过程" },
            { k: "copy", l: "复制到我的" },
          ].map((t) => {
            const active = tab === (t.k as any);
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                style={{
                  padding: "0.875rem 1.25rem",
                  fontSize: "0.9375rem",
                  color: active ? "var(--text)" : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                  borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t.l}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "video" && (
          <div>
            <div
              style={{
                aspectRatio: "16/9",
                background: `linear-gradient(135deg, hsl(${c.hue}, 25%, 80%), hsl(${c.hue + 12}, 22%, 60%))`,
                borderRadius: 20,
                position: "relative",
                marginBottom: "1.5rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", color: "var(--text)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
              >
                ▶
              </div>
              <span className="watermark">AI 生成</span>
            </div>
            <p className="t-body" style={{ color: "var(--text-secondary)" }}>{c.description}</p>
          </div>
        )}

        {tab === "process" && (
          <div>
            <p className="t-body" style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              这段视频是怎么做出来的. 6 个节点: 文本提示 + 主图 → AI 视频 → 与 AI 音频合并 → 成片.
            </p>
            <CanvasViewer nodes={DEMO_NODES} edges={DEMO_EDGES} />
          </div>
        )}

        {tab === "copy" && (
          <div
            style={{
              background: "var(--bg-gray)",
              borderRadius: 20,
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <h2 className="h-card" style={{ marginBottom: "1rem" }}>复制这个创作流程到你的画布.</h2>
            <p className="t-body" style={{ color: "var(--text-secondary)", marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem" }}>
              这一份 Node-Wire 流程会变成你的画布起点. 你可以改提示词、换主图、调整时长, 然后一键运行.
            </p>
            <Link href="/canvas/new" className="btn btn-primary">复制到我的画布</Link>
          </div>
        )}

        {/* 元信息 */}
        <div
          style={{
            marginTop: "3rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-light)",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
          }}
        >
          <MetaItem label="品牌" value={c.brand} />
          <MetaItem label="品类" value={c.category} />
          <MetaItem label="使用模型" value={c.model} />
          <MetaItem label="生成时间" value={c.generatedAt} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-small" style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9375rem", color: "var(--text)" }}>{value}</div>
    </div>
  );
}