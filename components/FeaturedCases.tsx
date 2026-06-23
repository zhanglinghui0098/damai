"use client";

import { useState } from "react";
import Link from "next/link";
import CaseCard from "./CaseCard";
import { CASES, CATEGORIES } from "../lib/cases";

// v4.3: 9 个新 tab (保留"全部" + 重新编排品牌导向分类)
// v4.4: 接 17 个真实视频 (Ling 上传), 只在"全部" + "品牌广告" 有数据
const TABS = CATEGORIES;
type Tab = (typeof TABS)[number];

const ALL_CASES = CASES;

export default function FeaturedCases() {
  const [activeTab, setActiveTab] = useState<Tab>("全部");
  const [query, setQuery] = useState("");

  const filtered = ALL_CASES.filter((c) => {
    const matchTab = activeTab === "全部" || c.category === activeTab;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.creator.toLowerCase().includes(q);
    return matchTab && matchQuery;
  }).slice(0, 8);

  return (
    <section className="section">
      <div className="container">
        {/* 标题已删, 直接进 grid (用户 v3.2 减法) */}

        {/* 标签栏 + 搜索框 (TV Show 风) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "0.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.15rem",
              flexWrap: "wrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "0.45rem 0.75rem",
                    fontSize: "0.8125rem",
                    color: active ? "var(--text)" : "var(--text-secondary)",
                    fontWeight: active ? 500 : 400,
                    borderBottom: active
                      ? "2px solid var(--text)"
                      : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color 0.18s, border-color 0.18s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--text)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = active
                      ? "var(--text)"
                      : "var(--text-secondary)")
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* 搜索框 */}
          <div
            className="featured-search"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-light)",
              borderRadius: 980,
              minWidth: 180,
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle
                cx="6"
                cy="6"
                r="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M9.5 9.5L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索样片..."
              style={{
                border: 0,
                outline: 0,
                fontSize: "0.8125rem",
                background: "transparent",
                fontFamily: "inherit",
                color: "var(--text)",
                width: 120,
              }}
            />
          </div>
        </div>

        {/* 案例网格 — 固定 4 列 × 2 排 = 8 个 (4K 屏容器扩到 1800px 后自然放大) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.875rem",
            marginBottom: "1rem",
          }}
          className="cases-grid-4"
        >
          {filtered.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "var(--text-secondary)",
                padding: "3rem 0",
              }}
            >
              没找到匹配的样片, 试试其他关键词?
            </div>
          ) : (
            filtered.map((c) => <CaseCard key={c.id} c={c} />)
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/case" className="link-arrow">
            查看更多
          </Link>
        </div>
      </div>
    </section>
  );
}