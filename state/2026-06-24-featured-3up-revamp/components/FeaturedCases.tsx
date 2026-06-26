"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CASES,
  CATEGORIES,
  PORTRAIT_ORDER,
  orderByTitle,
} from "@/lib/cases";
import CaseCard from "@/components/CaseCard";

// 爆款模板用的竖屏 (保留 v5 行为)
const PORTRAIT_TEMPLATES = orderByTitle(
  CASES.filter((c) => c.orientation === "portrait"),
  PORTRAIT_ORDER
);

// ─────────────────────────────────────────────────────────
// 精选推荐 (v6) — 3 屏大卡 (替代 v5 的 3D carousel)
// 设计: 横向 3 列等高 16:9 大卡, tag (左上) + title (左下) 叠加
// 数据: 硬编码 3 个 promo, 后续可换 CMS / API
// ─────────────────────────────────────────────────────────
type PromoItem = {
  id: string;
  tag: string;
  title: string;
  href: string;
  bg: string;          // CSS background value, 例如 linear-gradient(...) 或 url(/x.jpg) center/cover
  tagColor?: string;
};

const PROMOS: PromoItem[] = [
  {
    id: "promo-canvas",
    tag: "无限画布",
    title: "四大维度·激励计划",
    href: "/canvas/new",
    bg: "linear-gradient(135deg, #d4a574 0%, #8b6f47 100%)",
    tagColor: "#34d399",
  },
  {
    id: "promo-seedance",
    tag: "276 全新会员限时上线",
    title: "Seedance2.0 720P 低至 0.3 元/秒",
    href: "/templates",
    bg: "linear-gradient(135deg, #f5d76e 0%, #c89968 100%)",
    tagColor: "#34d399",
  },
  {
    id: "promo-guide",
    tag: "点击",
    title: "快速掌握新手指南",
    href: "/dashboard",
    bg: "linear-gradient(135deg, #1e3a5f 0%, #4a6fa5 100%)",
    tagColor: "#34d399",
  },
];

function FeaturedGrid() {
  return (
    <div className="featured-grid-3">
      {PROMOS.map((p) => (
        <Link
          key={p.id}
          href={p.href}
          className="featured-card"
          style={{ background: p.bg }}
        >
          <span
            className="featured-card-tag"
            style={{ color: p.tagColor || "#34d399" }}
          >
            {p.tag}
          </span>
          <h3 className="featured-card-title">{p.title}</h3>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 板块标题 (白字 500) — 沿用 v5
// ─────────────────────────────────────────────────────────
function SectionHeader({
  title,
  link,
  linkText = "查看全部",
  gapTop = "2rem",
}: {
  title: string;
  link: string;
  linkText?: string;
  gapTop?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: gapTop,
        marginBottom: "1.25rem",
      }}
    >
      <h2
        style={{
          color: "#ffffff",
          fontSize: "1.25rem",
          fontWeight: 500,
          margin: 0,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </h2>
      <a
        href={link}
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: "0.8125rem",
          fontWeight: 500,
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
      >
        {linkText} ›
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 爆款模板: tab 筛选 + 4 列网格 (保留 v5 行为)
// ─────────────────────────────────────────────────────────
function HotTemplates() {
  const [activeTab, setActiveTab] = useState("全部");

  const filtered = useMemo(() => {
    if (activeTab === "全部") return PORTRAIT_TEMPLATES;
    return PORTRAIT_TEMPLATES.filter((c) => c.category === activeTab);
  }, [activeTab]);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          marginBottom: "1rem",
          paddingBottom: "0.25rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === activeTab;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: "0.4rem 1rem",
                borderRadius: "999px",
                background: active ? "rgba(255,255,255,0.14)" : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.5)",
                border: "1px solid",
                borderColor: active
                  ? "rgba(255,255,255,0.28)"
                  : "rgba(255,255,255,0.10)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1rem",
          }}
        >
          {filtered.map((c) => (
            <CaseCard key={c.id} c={c} variant="full" />
          ))}
        </div>
      ) : (
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.875rem",
            textAlign: "center",
            padding: "3rem 0",
            fontWeight: 500,
          }}
        >
          暂无「{activeTab}」分类的样片
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// FeaturedCases 主组件
// 栏目顺序: 精选推荐 (3 屏大卡) → 爆款模板 (4 列网格)
// ─────────────────────────────────────────────────────────
export default function FeaturedCases() {
  return (
    <section
      className="section"
      style={{
        background: "var(--bg)",
        paddingTop: "1rem",
        paddingBottom: "2.5rem",
      }}
    >
      <div className="container-narrow">
        <SectionHeader title="精选推荐" link="/case" />
        <FeaturedGrid />

        <SectionHeader
          title="爆款模板"
          link="/case?orientation=portrait"
          linkText="查看更多模板"
          gapTop="1.75rem"
        />
        <HotTemplates />
      </div>
    </section>
  );
}
