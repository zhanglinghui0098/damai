"use client";

import { useState } from "react";
import Link from "next/link";
import CaseCard, { type CaseItem } from "@/components/CaseCard";

// v4.3: 9 个 tab (跟首页 FeaturedCases 同步) — 完整案例库
const TABS = [
  "全部",
  "品牌广告",
  "AI品牌激励计划",
  "流量破圈",
  "信任转化",
  "获客引流",
  "电商投放",
  "人设打造",
  "大脉工具箱",
] as const;

const SORT = ["最新", "最热", "编辑推荐"] as const;

const MOCK_CASES: CaseItem[] = [
  { id: "c1", creator: "Muertu木二土", title: "嗶比的悲催时刻", category: "流量破圈", hue: 220 },
  { id: "c2", creator: "巫师光.", title: "意外发现了这个迷宫?", category: "流量破圈", hue: 260 },
  { id: "c3", creator: "Orange.", title: "石枕", category: "AI品牌激励计划", hue: 245 },
  { id: "c4", creator: "YOUNG", title: "《铁兵小队》一键出片工作流 + 角色裂变", category: "大脉工具箱", hue: 200 },
  { id: "c5", creator: "大太太太太", title: "雨中暗一桌人【在超市后门吞云吐雾的二人-真人版】", category: "信任转化", hue: 280 },
  { id: "c6", creator: "咕噜咕噜大王", title: "超级末日女友 哐哐哐就是咔咔咔咔", category: "信任转化", hue: 215 },
  { id: "c7", creator: "三千问Atelier", title: "Vlog风格TVC | 室内设计 | 旧房改造", category: "品牌广告", hue: 240 },
  { id: "c8", creator: "油条", title: "世界杯主题TVC - 流动狂欢城", category: "品牌广告", hue: 270 },
  { id: "c9", creator: "茶茶酱", title: "城市夜归人 30 秒纪录片", category: "人设打造", hue: 235 },
  { id: "c10", creator: "Light Studio", title: "高端美妆 15 秒质感大片", category: "电商投放", hue: 255 },
  { id: "c11", creator: "小白熊", title: "小学科学小实验系列", category: "获客引流", hue: 210 },
  { id: "c12", creator: "野草设计", title: "小红书爆款封面生成器", category: "大脉工具箱", hue: 285 },
];

export default function CaseLibraryPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("全部");
  const [activeSort, setActiveSort] = useState<(typeof SORT)[number]>("最新");
  const [query, setQuery] = useState("");

  const filtered = MOCK_CASES.filter((c) => {
    const matchTab = activeTab === "全部" || c.category === activeTab;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.creator.toLowerCase().includes(q);
    return matchTab && matchQuery;
  });

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
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "0.25rem",
          }}
        >
          {/* 9 个 tab */}
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

        {/* 案例网格 — 完整 12 条全展示 (不像首页只 8 条) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
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
      </div>
    </section>
  );
}