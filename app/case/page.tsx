"use client";

import { useState } from "react";
import CaseCard from "@/components/CaseCard";
import { CASES, CATEGORIES } from "@/lib/cases";

// 9 个 tab (跟首页 FeaturedCases 同步)
const TABS = CATEGORIES;
const SORT = ["最新", "最热", "编辑推荐"] as const;

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: "2.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 10,
            fontSize: "0.875rem",
            color: "var(--text-tertiary)",
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      </h2>
    </div>
  );
}

export default function CaseLibraryPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("全部");
  const [activeSort, setActiveSort] = useState<(typeof SORT)[number]>("最新");
  const [query, setQuery] = useState("");

  const filtered = CASES.filter((c) => {
    const matchTab = activeTab === "全部" || c.category === activeTab;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || c.title.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

  const landscape = filtered.filter((c) => c.orientation === "landscape");
  const portrait = filtered.filter((c) => c.orientation === "portrait");

  return (
    <section className="section">
      <div className="container">
        {/* 标题 */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="h-section" style={{ marginBottom: "0.25rem" }}>
            案例库.
          </h1>
          <p className="t-sub">看别人怎么做, 复制思路, 加速你的创作.</p>
        </div>

        {/* tabs + 排序 + 搜索 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.5rem",
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
                    background: "transparent",
                    border: "none",
                    borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color 0.18s, border-color 0.18s",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
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

          {/* 排序 */}
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem", flexShrink: 0 }}>
            {SORT.map((s) => {
              const active = activeSort === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveSort(s)}
                  style={{
                    color: active ? "var(--text)" : "var(--text-secondary)",
                    fontWeight: active ? 500 : 400,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* 搜索框 */}
          <div
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
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

        {/* 横屏区 — 3 列 */}
        {landscape.length > 0 && (
          <>
            <SectionHeader label="横屏精选" count={landscape.length} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
              }}
            >
              {landscape.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          </>
        )}

        {/* 竖屏区 — 5 列 (每张瘦高卡片) */}
        {portrait.length > 0 && (
          <>
            <SectionHeader label="竖屏爆款" count={portrait.length} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "1.25rem",
              }}
            >
              {portrait.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          </>
        )}

        {landscape.length === 0 && portrait.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              padding: "3rem 0",
            }}
          >
            没找到匹配的样片, 试试其他关键词?
          </div>
        )}
      </div>
    </section>
  );
}