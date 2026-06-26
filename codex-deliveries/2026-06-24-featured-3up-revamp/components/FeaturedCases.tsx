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

const PORTRAIT_TEMPLATES = orderByTitle(
  CASES.filter((c) => c.orientation === "portrait"),
  PORTRAIT_ORDER
);

// v8: 三联屏 3D 视觉 — 纯黑背景, 无标题栏, 占位渐变 + hover 联动 + 6s 漂浮
type PromoItem = {
  id: string;
  tag: string;
  title: string;
  href: string;
  bg: string;
  pos: "left" | "center" | "right";
};

const PROMOS: PromoItem[] = [
  {
    id: "promo-canvas",
    tag: "无限画布",
    title: "四大维度·激励计划",
    href: "/canvas/new",
    bg: "linear-gradient(135deg, #1f2937 0%, #0a0a0a 100%)",
    pos: "left",
  },
  {
    id: "promo-seedance",
    tag: "276 全新会员限时上线",
    title: "Seedance2.0 720P 低至 0.3 元/秒",
    href: "/templates",
    bg: "linear-gradient(135deg, #f5f5f7 0%, #e5e7eb 100%)",
    pos: "center",
  },
  {
    id: "promo-guide",
    tag: "点击",
    title: "快速掌握新手指南",
    href: "/dashboard",
    bg: "linear-gradient(135deg, #1e3a5f 0%, #0f1e3a 100%)",
    pos: "right",
  },
];

function Featured3D() {
  return (
    <section className="featured-3d-scene">
      <div className="featured-3d-stage">
        {PROMOS.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className={"featured-3d-card featured-3d-" + p.pos}
            style={{ background: p.bg }}
          >
            <div className="featured-3d-text">
              <span className="featured-3d-tag">{p.tag}</span>
              <h3 className="featured-3d-title">{p.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
      <h2 style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 500, margin: 0, letterSpacing: "0.01em" }}>
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
        {linkText} →
      </a>
    </div>
  );
}

function HotTemplates() {
  const [activeTab, setActiveTab] = useState("全部");
  const filtered = useMemo(() => {
    if (activeTab === "全部") return PORTRAIT_TEMPLATES;
    return PORTRAIT_TEMPLATES.filter((c) => c.category === activeTab);
  }, [activeTab]);

  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "1rem", paddingBottom: "0.25rem", scrollbarWidth: "none", msOverflowStyle: "none" }}>
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
                borderColor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.10)",
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {filtered.map((c) => <CaseCard key={c.id} c={c} variant="full" />)}
        </div>
      ) : (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", textAlign: "center", padding: "3rem 0", fontWeight: 500 }}>
          暂无「{activeTab}」分类的样片
        </div>
      )}
    </>
  );
}

export default function FeaturedCases() {
  return (
    <>
      <Featured3D />
      <section className="section" style={{ background: "var(--bg)", paddingTop: "1rem", paddingBottom: "2.5rem" }}>
        <div className="container-narrow">
          <SectionHeader title="爆款模板" link="/case?orientation=portrait" linkText="查看更多模板" gapTop="0" />
          <HotTemplates />
        </div>
      </section>
    </>
  );
}
