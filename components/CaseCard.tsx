import Link from "next/link";
import type { CaseItem as CaseItemType } from "../lib/cases";

export type { CaseItemType as CaseItem };

export default function CaseCard({ c }: { c: CaseItemType }) {
  const creator = c.creator ?? "";
  const initial = creator.length > 0
    ? creator.charAt(creator.length - 1)
    : "?";

  return (
    <Link
      href={`/case/${c.id}`}
      className="case-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "transparent",
        transition: "transform 0.2s",
      }}
    >
      {/* 上半 — 真实视频海报图 (16:9, 圆角) */}
      <div
        className="case-card-thumb"
        style={{
          aspectRatio: "16/9",
          borderRadius: 12,
          overflow: "hidden",
          background: `linear-gradient(135deg, hsl(${c.hue}, 18%, 32%), hsl(${c.hue + 12}, 16%, 22%))`,
          position: "relative",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* 真实视频: 用 poster 图作 thumbnail (有 videoUrl 时) */}
        {c.posterUrl && (
          <img
            src={c.posterUrl}
            alt={c.title}
            loading="lazy"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
        <span className="watermark">AI 生成</span>
      </div>

      {/* 下半 — 透明信息区 */}
      <div style={{ padding: "0.55rem 0.125rem 0", background: "transparent" }}>
        {/* 第一行: avatar + 用户名 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            marginBottom: "0.25rem",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: `hsl(${c.hue}, 30%, 50%)`,
              color: "#fff",
              fontSize: "0.5625rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {creator || "匿名"}
          </span>
        </div>

        {/* 第二行: 标题 (左) + 查看创作过程 pill (右) */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.25em",
              flex: 1,
            }}
          >
            {c.title}
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.18rem 0.45rem",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text-secondary)",
              borderRadius: 980,
              fontSize: "0.625rem",
              fontWeight: 500,
              flexShrink: 0,
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            查看创作过程
            <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}