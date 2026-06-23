import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

const FILTERS = ["全部", "草稿", "生成中", "已发布", "归档"] as const;

export default function WorkbenchPage() {
  return (
    <section className="section">
      <div className="container">
        {/* 标题 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1 className="h-section" style={{ marginBottom: "0.25rem" }}>
              爆款仓库.
            </h1>
            <p className="t-sub">
              所有项目, 草稿到发布, 一处管理. 项目越多, 仓库越满.
            </p>
          </div>
          <Link href="/templates" className="btn btn-primary">+ 新建项目</Link>
        </div>

        {/* 筛选 pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border-light)",
            marginBottom: "1.75rem",
          }}
        >
          {FILTERS.map((f, i) => (
            <button
              key={f}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                color: i === 0 ? "var(--text)" : "var(--text-secondary)",
                fontWeight: i === 0 ? 500 : 400,
                background: i === 0 ? "var(--bg-gray)" : "transparent",
                border: "none",
                borderRadius: 980,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 项目卡片网格 — v4.3 暗模式蓝紫浅半透明渐变 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {MOCK_PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/canvas/${p.id}`}
              className="workbench-card"
              style={{
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s",
              }}
            >
              {/* 缩略图 — 上半蓝紫浅半透明 */}
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: `linear-gradient(135deg, hsla(${p.hue}, 45%, 50%, 0.55) 0%, hsla(${p.hue + 30}, 40%, 62%, 0.38) 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  AI 生成
                </span>
                {/* 状态 pill 缩略图右上角 */}
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    padding: "3px 8px",
                    background: "rgba(18, 20, 26, 0.65)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    borderRadius: 980,
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                  }}
                >
                  {p.status}
                </span>
              </div>

              {/* 下半透明 */}
              <div style={{ padding: "0.65rem 0.25rem 0" }}>
                <div
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 4,
                  }}
                >
                  {p.name}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {p.updated}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}