"use client";

import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

// v4.1: 5 个 tile (2 动作 + 3 项目), 上下分离卡片
type Tile = {
  href: string;
  thumbnail: "icon" | "blank" | "project";
  iconColor?: string;
  thumbHue?: number;
  title: string;
  meta: string;
  pillText: string;
};

const QUICK_START: Tile = {
  href: "/templates",
  thumbnail: "icon",
  iconColor: "#6e8cd6",          // 商务蓝
  title: "快速开始",
  meta: "30 秒出片",
  pillText: "帮我发散一下",
};

const CANVAS: Tile = {
  href: "/canvas-v2",  // 07-10 同步: codex 静态 SPA (production 主画布)
  thumbnail: "icon",
  iconColor: "#c8a45e",          // 商务金 (替代纯白, 商务感)
  title: "画布",
  meta: "玩转工作流",
  pillText: "试试画布",
};

export default function StartCreating() {
  // 3 个最近项目 (p1, p2, p4 — 跳过 p3/p5)
  const recentProjects = [MOCK_PROJECTS[0], MOCK_PROJECTS[1], MOCK_PROJECTS[3]];
  const tiles: Tile[] = [
    QUICK_START,
    CANVAS,
    ...recentProjects.map((p) => ({
      href: `/canvas-v2?project=${p.id}`,  // 07-10 同步: 项目 tile 也走新画布
      thumbnail: "project" as const,
      thumbHue: p.hue,
      title: "未命名项目",      // v4.3: 首页 tile 一律未命名 (workbench 子页面才显示真名字)
      meta: "今天",
      pillText: "开始创作",
    })),
  ];

  return (
    <section className="section" style={{ paddingTop: "0.5rem", paddingBottom: "2rem" }}>
      <div className="container-narrow">
        <div className="tiles-grid-5">
          {tiles.map((t, i) => (
            <Link
              key={i}
              href={t.href}
              className="tile-slot"
              style={{
                display: "flex",
                flexDirection: "column",
                background: "transparent",   // 卡片本身透明
                border: 0,
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              {/* 上半 — 独立圆角长方形 (filled bg) */}
              <div
                style={{
                  aspectRatio: "16/9",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: t.thumbnail === "project" && t.thumbHue !== undefined
                    ? `linear-gradient(135deg, hsla(${t.thumbHue}, 45%, 50%, 0.55) 0%, hsla(${t.thumbHue + 30}, 40%, 62%, 0.38) 100%)`
                    : "var(--bg-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {t.thumbnail === "icon" ? (
                  <svg width="38" height="38" viewBox="0 0 56 56" fill="none" style={{ color: t.iconColor }}>
                    {i === 0 ? (
                      <>
                        <rect x="6" y="10" width="32" height="22" rx="4" fill="currentColor" opacity="0.85" />
                        <rect x="14" y="22" width="32" height="22" rx="4" fill="currentColor" opacity="0.55" />
                      </>
                    ) : (
                      <>
                        <circle cx="14" cy="14" r="6" fill="currentColor" />
                        <circle cx="42" cy="14" r="6" fill="currentColor" />
                        <circle cx="14" cy="42" r="6" fill="currentColor" />
                        <circle cx="42" cy="42" r="6" fill="currentColor" />
                        <path d="M14 14 L42 14 M14 14 L14 42 M42 14 L42 42 M14 42 L42 42" stroke="currentColor" strokeWidth="1.5" />
                      </>
                    )}
                  </svg>
                ) : (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 500,
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    AI 生成
                  </span>
                )}
              </div>

              {/* 下半 — 透明, 纯文字信息 */}
              <div style={{ padding: "0.55rem 0.125rem 0", background: "transparent" }}>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 2,
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.3rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-tertiary)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.meta}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      padding: "0.2rem 0.55rem",
                      background: "rgba(255,255,255,0.08)",
                      color: "var(--text-secondary)",
                      borderRadius: 980,
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {t.pillText}
                    <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 11L11 3M11 3H5M11 3V9"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 所有项目 — 右下角 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "0.85rem",
          }}
        >
          <Link
            href="/workbench"
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            所有项目
            <span style={{ fontSize: "0.9rem" }}>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}