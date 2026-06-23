"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PROJECTS,
  AI_RECOMMENDATIONS,
  REPORTS,
  type Project,
} from "@/lib/mock-data-workbench";

const TABS = ["📁 项目", "✨ AI 推荐", "📋 周/月复盘", "🗃 数据管理"] as const;
type Tab = (typeof TABS)[number];

export default function DashboardClient({
  phone,
  tenantId,
}: {
  phone: string;
  tenantId: string;
}) {
  const [tab, setTab] = useState<Tab>("📁 项目");

  return (
    <div className="section">
      <div className="container">
        {/* Welcome banner — 真实用户手机号 (中间 4 位 *) */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 className="h-section" style={{ marginBottom: "0.4rem" }}>
            你好, {phone}.
          </h1>
          <p className="t-sub">
            租户 {tenantId} · 数据已隔离,只显示你自己的项目.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "2rem",
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "0.9375rem",
                  color: active ? "var(--text)" : "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                  marginBottom: -1,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {tab === "📁 项目" && <ProjectsTab />}
        {tab === "✨ AI 推荐" && <AIRecommendTab />}
        {tab === "📋 周/月复盘" && <ReportsTab />}
        {tab === "🗃 数据管理" && <DataManageTab />}
      </div>
    </div>
  );
}

// ============ Tab 1: 项目 ============
function ProjectsTab() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
      }}
    >
      {PROJECTS.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/${p.id}`}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 14,
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            textDecoration: "none",
            color: "var(--text)",
            transition: "border-color 0.18s, transform 0.18s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                {p.industry} · {p.platform} · {p.city}
              </div>
            </div>
            <StatusPill status={p.status} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <MiniKpi label="投放" value={`¥${p.totalSpend.toLocaleString()}`} />
            <MiniKpi label="表单" value={p.totalLeads.toString()} />
            <MiniKpi label="ROI" value={`${p.roi.toFixed(1)}x`} highlight={p.roi >= 3} />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============ Tab 2: AI 推荐 ============
function AIRecommendTab() {
  return (
    <div>
      <div
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          marginBottom: "1.25rem",
          maxWidth: 720,
        }}
      >
        基于你所在城市、行业、账号历史表现, AI 推荐的选题方向. 点击可一键进画布生成.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {AI_RECOMMENDATIONS.map((r) => (
          <div
            key={r.id}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ScoreBadge score={r.score} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{r.topic}</span>
                <SourceTag source={r.source} />
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {r.industry} · {r.city} · {r.reason}
              </div>
            </div>
            <Link
              href={`/canvas/new?topic=${encodeURIComponent(r.topic)}`}
              className="btn btn-ghost"
              style={{ fontSize: "0.8125rem" }}
            >
              去生成 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Tab 3: 周/月复盘 ============
function ReportsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {REPORTS.map((r) => (
        <Link
          key={r.id}
          href={`/dashboard/${r.projectId}/report?range=week`}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 12,
            padding: "1.25rem",
            textDecoration: "none",
            color: "var(--text)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: 4 }}>
              {r.projectName}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: 8 }}>
              {r.range}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {r.highlights[0]}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: "0.8125rem" }}>
            <span>
              <span style={{ color: "var(--text-tertiary)" }}>投放 </span>
              <strong>¥{r.totalSpend.toLocaleString()}</strong>
            </span>
            <span>
              <span style={{ color: "var(--text-tertiary)" }}>ROI </span>
              <strong style={{ color: r.roi >= 3 ? "#4ade80" : "var(--text)" }}>
                {r.roi.toFixed(1)}x
              </strong>
            </span>
            <span style={{ color: "var(--accent)" }}>查看 →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ============ Tab 4: 数据管理 ============
function DataManageTab() {
  const sources = [
    { id: "canvas", label: "画布生成", desc: "你用大脉画布做的视频, 自动入库" },
    { id: "self_shot", label: "自己拍摄", desc: "手动上传 MP4, 填指标" },
    { id: "external_edit", label: "外协剪辑", desc: "外部剪辑师交付, 导入指标" },
  ];
  return (
    <div>
      <h3 style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", fontWeight: 500 }}>
        视频来源 (3 种)
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {sources.map((s) => (
          <div
            key={s.id}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              padding: "1rem 1.25rem",
            }}
          >
            <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem", fontWeight: 500 }}>
        数据导入
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-ghost">📥 导入 CSV</button>
        <button className="btn btn-ghost">🎬 抖音数据</button>
        <button className="btn btn-ghost">📕 小红书数据</button>
        <button className="btn btn-ghost">➕ 手动录入</button>
      </div>
    </div>
  );
}

// ============ helpers ============
function MiniKpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)", marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: highlight ? "#4ade80" : "var(--text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Project["status"] }) {
  const colors: Record<Project["status"], string> = {
    进行中: "#4ade80",
    已结束: "var(--text-tertiary)",
    待启动: "var(--accent)",
  };
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        padding: "2px 8px",
        borderRadius: 980,
        background: "rgba(255,255,255,0.06)",
        color: colors[status],
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#4ade80" : score >= 75 ? "var(--accent)" : "var(--text-secondary)";
  return (
    <div
      style={{
        width: 48, height: 48, borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: "1rem", fontWeight: 600, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: "0.5rem", color: "var(--text-tertiary)", marginTop: 2 }}>AI 分</div>
    </div>
  );
}

function SourceTag({ source }: { source: "industry" | "local" | "account" }) {
  const map = { industry: "全网", local: "本地", account: "账号" };
  const colors = {
    industry: "rgba(110,140,214,0.15)",
    local: "rgba(74,222,128,0.15)",
    account: "rgba(200,164,94,0.15)",
  };
  return (
    <span
      style={{
        fontSize: "0.6875rem",
        padding: "1px 6px",
        borderRadius: 4,
        background: colors[source],
        color: "var(--text-secondary)",
      }}
    >
      {map[source]}
    </span>
  );
}
