"use client";

import { useState } from "react";
import Link from "next/link";
import CaseCard from "./CaseCard";
import { CASES, CATEGORIES } from "../lib/cases";

const TABS = CATEGORIES;
type Tab = (typeof TABS)[number];

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginTop: "2rem",
        marginBottom: "1rem",
      }}
    >
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
        <span
          style={{
            marginLeft: 8,
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
            fontWeight: 400,
          }}
        >
          {count}
        </span>
      </h3>
      <Link
        href="/case"
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          textDecoration: "none",
        }}
      >
        查看全部 ›
      </Link>
    </div>
  );
}

export default function FeaturedCases() {
  const [activeTab, setActiveTab] = useState<Tab>("全部");
  const [query, setQuery] = useState("");

  // 按 tab + 搜索过滤
  const q = query.trim().toLowerCase();
  const matches = CASES.filter((c) => {
    const matchTab = activeTab === "全部" || c.category === activeTab;
    const matchQuery =
      !q || c.title.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

  const landscape = matches.filter((c) => c.orientation === "landscape");
  const portrait = matches.filter((c) => c.orientation === "portrait");

  return (
    <section className="section">
      <div className="container">
        {/* 标签栏 + 搜索框 (TV Show 风) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "0.75rem",
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
                    background: "transparent",
                    border: "none",
                    borderBottomColor: active ? "var(--text)" : "transparent",
                    borderBottomWidth: 2,
                    borderBottomStyle: "solid",
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

        {landscape.length > 0 && (
          <>
            <SectionHeader label="横屏精选" count={landscape.length} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.25rem",
              }}
            >
              {landscape.map((c) => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          </>
        )}

        {portrait.length > 0 && (
          <>
            <SectionHeader label="竖屏爆款" count={portrait.length} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "1rem",
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