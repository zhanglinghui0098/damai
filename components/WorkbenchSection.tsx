import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

// 首页第 2 板块: 项目库预览 — 复用 Codex 写的 /workbench 的视觉语言
// server component, 全部展示, 不做交互 (交互进 /workbench 做)
const STATUS_COLORS: Record<string, string> = {
  草稿: "rgba(255,255,255,0.4)",
  生成中: "var(--accent)",
  已发布: "#4ade80",
  归档: "rgba(255,255,255,0.25)",
};

export default function WorkbenchSection() {
  return (
    <section className="section section--gray">
      <div className="container">
        {/* Header — 跟其他 section 保持一致 */}
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
              爆款仓库.
            </h2>
            <p className="t-sub">所有项目, 草稿到发布, 一处管理.</p>
          </div>
          <Link href="/workbench" className="btn btn-ghost">
            全部项目 →
          </Link>
        </div>

        {/* 项目卡片网格 — 跟 /workbench 保持一致 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {MOCK_PROJECTS.map((p) => (
            <Link
              key={p.id}
              href={`/canvas/${p.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "var(--bg-elevated)",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--border-light)",
                transition: "transform 0.2s, border-color 0.2s",
              }}
            >
              {/* 缩略图 — 蓝紫浅半透明渐变 (复用 v4.3 风格) */}
              <div
                style={{
                  aspectRatio: "16/9",
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
                {/* 状态 pill */}
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    padding: "3px 8px",
                    background: "rgba(18, 20, 26, 0.65)",
                    backdropFilter: "blur(8px)",
                    color: STATUS_COLORS[p.status] ?? "#fff",
                    borderRadius: 980,
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                  }}
                >
                  {p.status}
                </span>
              </div>

              {/* 项目信息 */}
              <div style={{ padding: "0.75rem 0.875rem 0.875rem" }}>
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