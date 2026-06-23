import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, REPORTS, type SubProject } from "@/lib/mock-data-workbench";

const SOURCE_LABELS = {
  canvas: "🎨 画布",
  self_shot: "📷 自拍",
  external_edit: "✂️ 外协",
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = PROJECTS.find((p) => p.id === params.id);
  if (!project) return notFound();

  const weekly = REPORTS.find((r) => r.projectId === project.id);

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              marginBottom: "0.75rem",
              display: "inline-block",
            }}
          >
            ← 返回看板
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
                {project.name}.
              </h1>
              <p className="t-sub">
                {project.industry} · {project.platform} · {project.city} ·{" "}
                <span style={{ color: project.status === "进行中" ? "#4ade80" : "var(--text-secondary)" }}>
                  {project.status}
                </span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost">+ 录入视频</button>
              <Link href="/canvas/new" className="btn btn-primary">
                + 用画布生成
              </Link>
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
          <KpiCard label="总投放" value={`¥${project.totalSpend.toLocaleString()}`} />
          <KpiCard label="总表单" value={project.totalLeads.toString()} />
          <KpiCard label="平均 CPL" value={project.totalLeads > 0 ? `¥${project.cpl.toFixed(1)}` : "—"} />
          <KpiCard label="整体 ROI" value={project.totalLeads > 0 ? `${project.roi.toFixed(1)}x` : "—"} highlight={project.roi >= 3} />
        </div>

        {/* 子项目 (视频) 表格 */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>子项目 ({project.subprojects.length})</h2>
            <button className="btn btn-ghost" style={{ fontSize: "0.8125rem" }}>
              + 录入视频
            </button>
          </div>
          {project.subprojects.length === 0 ? (
            <EmptyState />
          ) : (
            <div
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-light)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <Th>标题</Th>
                    <Th>来源</Th>
                    <Th>平台</Th>
                    <Th>投放</Th>
                    <Th>表单</Th>
                    <Th>播放</Th>
                    <Th>完播</Th>
                    <Th>互动</Th>
                    <Th>转化</Th>
                    <Th>发布</Th>
                  </tr>
                </thead>
                <tbody>
                  {project.subprojects.map((s) => (
                    <SubRow key={s.id} s={s} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI 洞察 */}
        {weekly && (
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
              AI 洞察 · {weekly.range}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <InsightCard tone="up" title="亮点" items={weekly.highlights} />
              <InsightCard tone="down" title="待改进" items={weekly.lowlights} />
              <InsightCard tone="plan" title="下周计划" items={weekly.nextPlan} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubRow({ s }: { s: SubProject }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
      <Td>
        <div style={{ fontWeight: 500 }}>{s.title}</div>
      </Td>
      <Td>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {SOURCE_LABELS[s.source]}
        </span>
      </Td>
      <Td>{s.platform}</Td>
      <Td>¥{s.spend.toLocaleString()}</Td>
      <Td>{s.leads}</Td>
      <Td>{(s.views / 10000).toFixed(1)}w</Td>
      <Td>
        <Bar value={s.completion} target={70} suffix="%" />
      </Td>
      <Td>
        <Bar value={s.engagement} target={8} suffix="%" />
      </Td>
      <Td>
        <Bar value={s.conversion} target={4} suffix="%" highlight={s.conversion >= 4} />
      </Td>
      <Td>
        <span style={{ color: "var(--text-tertiary)" }}>{s.publishedAt}</span>
      </Td>
    </tr>
  );
}

function Bar({
  value,
  target,
  suffix,
  highlight,
}: {
  value: number;
  target: number;
  suffix: string;
  highlight?: boolean;
}) {
  const good = value >= target;
  return (
    <span
      style={{
        fontSize: "0.8125rem",
        color: highlight || good ? "#4ade80" : "var(--text)",
      }}
    >
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "0.75rem 1rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--text-secondary)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "0.875rem 1rem" }}>{children}</td>;
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

function EmptyState() {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "3rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 8 }}>
        还没有子项目 (视频)
      </div>
      <div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        录入已有视频数据, 或用画布生成新内容, AI 会自动学习这条线的偏好
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-ghost">+ 录入视频</button>
        <Link href="/canvas/new" className="btn btn-primary">
          + 用画布生成
        </Link>
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
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: colors[tone],
          fontWeight: 600,
          marginBottom: "0.75rem",
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
          gap: 8,
          fontSize: "0.8125rem",
          lineHeight: 1.5,
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