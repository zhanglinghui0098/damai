import Link from "next/link";
import { READY_TEMPLATES, COMING_SOON_TEMPLATES } from "@/lib/templates";

const CATEGORIES = ["全部", "老板出镜", "客户见证", "产品展示", "促销活动", "节日营销"] as const;

export default function TemplatesPage() {
  return (
    <div className="section">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 className="h-section" style={{ marginBottom: "0.5rem" }}>模板中心.</h1>
          <p className="t-sub">选一个, 改一改, 一键出片.</p>
        </div>

        {/* 分类 (减法: 6 个核心分类, 其他进 P1) */}
        <div
          style={{
            display: "flex", gap: 8, flexWrap: "wrap",
            justifyContent: "center", marginBottom: "2.5rem",
          }}
        >
          {CATEGORIES.map((c, i) => (
            <button
              key={c}
              style={{
                padding: "0.4rem 0.875rem",
                fontSize: "0.8125rem",
                color: i === 0 ? "var(--text)" : "var(--text-secondary)",
                fontWeight: i === 0 ? 500 : 400,
                background: i === 0 ? "var(--bg-gray)" : "transparent",
                border: "1px solid var(--border-light)",
                borderRadius: 980,
                cursor: "pointer",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 5 个核心模板 (P0 可用) — 强制 5 列 1 排对齐 */}
        <div className="tiles-grid-5" style={{ marginBottom: "3rem" }}>
          {READY_TEMPLATES.map((t) => (
            <div
              key={t.id}
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-light)",
                borderRadius: 18,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div
                style={{
                  aspectRatio: "16/9",
                  background: `linear-gradient(135deg, hsl(${t.hue}, 22%, 28%), hsl(${t.hue + 12}, 20%, 18%))`,
                  position: "relative",
                }}
              >
                <span className="watermark">AI 生成</span>
                <div
                  style={{
                    position: "absolute", top: 10, left: 10,
                    background: "rgba(0,0,0,0.55)", color: "#fff",
                    fontSize: "0.7rem", padding: "3px 8px",
                    borderRadius: 4, fontWeight: 500,
                  }}
                >
                  {t.duration}s · {t.aspect}
                </div>
                <div
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(110,140,214,0.85)", color: "#fff",
                    fontSize: "0.6875rem", padding: "3px 8px",
                    borderRadius: 4, fontWeight: 500,
                  }}
                >
                  {t.model}
                </div>
              </div>
              <div style={{ padding: "1.1rem" }}>
                <div className="t-small" style={{ marginBottom: 6, color: "var(--text-tertiary)" }}>
                  {t.category}
                </div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: "0.4rem" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.9rem", lineHeight: 1.4 }}>
                  {t.description}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Link href={`/create/${t.id}`} className="btn btn-primary" style={{ flex: 1, height: 36, fontSize: "0.8125rem" }}>
                    用此模板创作
                  </Link>
                  <Link href={`/canvas/new?template=${t.id}`} className="btn btn-secondary" style={{ flex: 1, height: 36, fontSize: "0.8125rem", border: "1px solid var(--accent)" }}>
                    画布
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 7 个"敬请期待" */}
        <div style={{ marginTop: "3rem" }}>
          <div className="t-small" style={{ marginBottom: "1rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            敬请期待
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {COMING_SOON_TEMPLATES.map((t) => (
              <div
                key={t.id}
                style={{
                  background: "transparent",
                  border: "1px dashed var(--border-light)",
                  borderRadius: 14,
                  padding: "1rem",
                  opacity: 0.5,
                }}
              >
                <div className="t-small" style={{ marginBottom: 4, color: "var(--text-tertiary)" }}>
                  {t.category}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
