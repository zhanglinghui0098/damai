import Link from "next/link";
import { getDashboardSummary } from "@/lib/mock-data-workbench";

// 首页第 4 板块: 数据中心入口卡片
// 三合一: 数据中心 = 数据工作台 = 复盘页 入口
// 视觉沿用现风 (Apple 暗模式), 不点阵换皮

function fmt(n: number) {
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 1 });
}

export default function DataCenterSection() {
  const { totalSpend, totalLeads, cpl, roi, activeProjects } = getDashboardSummary();

  return (
    <section className="section section--gray">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2 className="h-section" style={{ marginBottom: "0.25rem" }}>
              数据中心.
            </h2>
            <p className="t-sub">
              投流 → 数据 → AI 学 → 更准. 每天用一点, AI 就更懂你.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-ghost">
            完整看板 →
          </Link>
        </div>

        {/* 4 KPI 卡片 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <KpiCard label="本周投放" value={`¥${fmt(totalSpend)}`} trend="+18%" trendUp />
          <KpiCard label="本周表单" value={fmt(totalLeads)} trend="+24%" trendUp />
          <KpiCard label="平均 CPL" value={`¥${fmt(cpl)}`} trend="-3.2" trendUp />
          <KpiCard label="整体 ROI" value={`${roi.toFixed(1)}x`} trend="+0.4x" trendUp />
        </div>

        {/* 数据状态条 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 1rem",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            <strong style={{ color: "var(--text)" }}>{activeProjects}</strong> 个进行中项目
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
            AI 已分析 <strong style={{ color: "var(--text)" }}>{totalLeads}</strong> 条视频表现
            <span style={{ margin: "0 0.5rem", opacity: 0.4 }}>·</span>
            最近更新: 2 小时前
          </span>
          <Link href="/dashboard" style={{ color: "var(--accent)", textDecoration: "none" }}>
            进入工作台 →
          </Link>
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-light)",
        borderRadius: 12,
        padding: "1.25rem 1.25rem 1rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
          marginBottom: "0.5rem",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.625rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          marginBottom: "0.25rem",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.75rem",
          color: trendUp ? "#4ade80" : "#f87171",
        }}
      >
        {trend} <span style={{ opacity: 0.6 }}>vs 上周</span>
      </div>
    </div>
  );
}