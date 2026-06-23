"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PROJECTS, REPORTS, type WeeklyReport } from "@/lib/mock-data-workbench";

export default function ReportPage({ params }: { params: { id: string } }) {
  const sp = useSearchParams();
  const range = (sp.get("range") as "week" | "month") || "week";
  const project = PROJECTS.find((p) => p.id === params.id);

  if (!project) {
    return (
      <div className="section">
        <div className="container">
          <p>项目不存在. <Link href="/dashboard">返回</Link></p>
        </div>
      </div>
    );
  }

  const report: WeeklyReport | undefined =
    REPORTS.find((r) => r.projectId === project.id) || {
      id: "auto",
      projectId: project.id,
      projectName: project.name,
      range: range === "week" ? "本周" : "本月",
      totalSpend: project.totalSpend,
      totalLeads: project.totalLeads,
      cpl: project.cpl,
      roi: project.roi,
      highlights: project.subprojects.length > 0
        ? [`共 ${project.subprojects.length} 条视频`, `平均 ROI ${project.roi.toFixed(1)}x`]
        : ["暂无数据, 录入第一条视频后 AI 自动生成复盘"],
      lowlights: ["需要先录入子项目 (视频) 数据"],
      nextPlan: ["录入历史视频表现, AI 会基于此训练选题方向"],
    };

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href={`/dashboard/${project.id}`}
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              marginBottom: "0.75rem",
              display: "inline-block",
            }}
          >
            ← 返回项目详情
          </Link>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h1 className="h-section" style={{ marginBottom: "0.4rem" }}>
                {report.range} 复盘.
              </h1>
              <p className="t-sub">{project.name} · AI 自动汇总 + 建议</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <RangeToggle range={range} id={project.id} />
              <button className="btn btn-ghost">📤 分享</button>
              <button className="btn btn-primary">📄 导出 PDF</button>
            </div>
          </div>
        </div>

        {/* 4 KPI */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.75rem",
            marginBottom: "2.5rem",
          }}
        >
          <KpiCard label="投放" value={`¥${report.totalSpend.toLocaleString()}`} />
          <KpiCard label="表单" value={report.totalLeads.toString()} />
          <KpiCard label="CPL" value={report.totalLeads > 0 ? `¥${report.cpl.toFixed(1)}` : "—"} />
          <KpiCard label="ROI" value={report.totalLeads > 0 ? `${report.roi.toFixed(1)}x` : "—"} highlight={report.roi >= 3} />
        </div>

        {/* 三栏: 亮点 / 待改进 / 下周计划 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <InsightCard tone="up" title="亮点" items={report.highlights} />
          <InsightCard tone="down" title="待改进" items={report.lowlights} />
          <InsightCard tone="plan" title="下周计划" items={report.nextPlan} />
        </div>

        {/* CTA */}
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 12,
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 2 }}>
              把计划加进下周排期
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              AI 已经根据复盘结果生成了 {report.nextPlan.length} 条建议, 一键加入画布计划
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost">📅 加入下周计划</button>
            <button className="btn btn-ghost">🔄 重新生成</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RangeToggle({ range, id }: { range: "week" | "month"; id: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--border-light)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Link
        href={`/dashboard/${id}/report?range=week`}
        style={{
          padding: "0.5rem 0.875rem",
          fontSize: "0.8125rem",
          color: range === "week" ? "var(--text)" : "var(--text-secondary)",
          background: range === "week" ? "var(--bg-elevated)" : "transparent",
          textDecoration: "none",
        }}
      >
        本周
      </Link>
      <Link
        href={`/dashboard/${id}/report?range=month`}
        style={{
          padding: "0.5rem 0.875rem",
          fontSize: "0.8125rem",
          color: range === "month" ? "var(--text)" : "var(--text-secondary)",
          background: range === "month" ? "var(--bg-elevated)" : "transparent",
          textDecoration: "none",
        }}
      >
        本月
      </Link>
    </div>
  );
}

function KpiCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.375rem",
          fontWeight: 600,
          color: highlight ? "#4ade80" : "var(--text)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InsightCard({
  tone,
  title,
  items,
}: {
  tone: "up" | "down" | "plan";
  title: string;
  items: string[];
}) {
  const colors = {
    up: "#4ade80",
    down: "#f87171",
    plan: "var(--accent)",
  };
  const icons = { up: "↑", down: "↓", plan: "→" };
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: colors[tone],
          fontWeight: 600,
          marginBottom: "0.875rem",
          letterSpacing: "0.02em",
        }}
      >
        {icons[tone]} {title}
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: "0.875rem",
          lineHeight: 1.55,
          color: "var(--text-secondary)",
        }}
      >
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 8 }}>
            <span style={{ color: colors[tone], flexShrink: 0 }}>·</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}