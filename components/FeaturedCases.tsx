"use client";

import { useState, useMemo } from "react";
import {
  CASES,
  CATEGORIES,
  LANDSCAPE_ORDER,
  PORTRAIT_ORDER,
  orderByTitle,
} from "@/lib/cases";
import CaseCard from "@/components/CaseCard";

// 精选 carousel 用的横屏
const FEATURED_CASES = orderByTitle(
  CASES.filter((c) => c.orientation === "landscape"),
  LANDSCAPE_ORDER
);

// 爆款模板用的竖屏
const PORTRAIT_TEMPLATES = orderByTitle(
  CASES.filter((c) => c.orientation === "portrait"),
  PORTRAIT_ORDER
);

// ─────────────────────────────────────────────────────────
// 板块标题 (白字 500)
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
// 精选 carousel v6: 三分屏 + 轻微透视 + 左右轮播 + hover 变平
// 设计: 一次 3 张卡, 中间 active 突出, 左右两张有极轻透视
// 鼠标 hover 任一张 → rotateY → 0 + scale → 1 (透视消除)
// ─────────────────────────────────────────────────────────
const VISIBLE_HALF = 1;   // 中心左右各 1 张可见 (3 张总数)
const CARD_W = 480;        // v5 360 → 480 (画面大)
const GAP = 12;            // v5 24 → 12 (紧凑)
const STRIDE = CARD_W + GAP; // 492px 每步
const HEIGHT = 320;        // v5 250 → 320 (16:9 配 480w → 270, 上下留白)
const PERSP = 1800;        // v5 1400 → 1800 (透视感更弱, 更平面)
const SIDE_RY = 8;         // v5 ±22° → ±8° (极轻透视)
const SIDE_SCALE = 0.92;   // v5 0.76 → 0.92 (几乎不缩)
const SIDE_Z = -80;
const ACTIVE_Z = 40;

function cardTransform(offset: number, isHovered: boolean) {
  const abs = Math.abs(offset);
  if (abs > VISIBLE_HALF) {
    return {
      transform: `translateX(${offset * STRIDE}px) translateZ(-300px) scale(0.85)`,
      opacity: 0,
      zIndex: 1,
      pointerEvents: "none" as const,
    };
  }
  const x = offset * STRIDE;
  // hover 的卡: 透视完全变平 + scale 1 + z 比 active 还前
  if (isHovered) {
    return {
      transform: `translateX(${x}px) translateZ(80px) rotateY(0deg) scale(1)`,
      opacity: 1,
      zIndex: 50,
      pointerEvents: "auto" as const,
    };
  }
  // 默认状态: 中心 0°, 左右 ±8° 极轻透视
  const ry = offset * -SIDE_RY;
  const sc = abs === 0 ? 1 : SIDE_SCALE;
  const z = abs === 0 ? ACTIVE_Z : SIDE_Z;
  const opacity = abs === 0 ? 1 : 0.85;
  const zIndex = 20 - abs * 10;
  return {
    transform: `translateX(${x}px) translateZ(${z}px) rotateY(${ry}deg) scale(${sc})`,
    opacity,
    zIndex,
    pointerEvents: "auto" as const,
  };
}

function FeaturedCarousel() {
  // 默认中间位置 (activeIdx = 1: 0=left, 1=center, 2=right)
  // 9 张 LANDSCAPE, activeIdx 范围 0-8, 边界时左右会缺一张
  const [activeIdx, setActiveIdx] = useState(1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = FEATURED_CASES.length;
  const prev = () => setActiveIdx((i) => Math.max(0, i - 1));
  const next = () => setActiveIdx((i) => Math.min(total - 1, i + 1));

  return (
    <div
      style={{
        position: "relative",
        perspective: `${PERSP}px`,
        perspectiveOrigin: "50% 50%",
        height: `${HEIGHT}px`,
        marginTop: "0.25rem",
      }}
    >
      {/* 左箭头 */}
      <button
        onClick={prev}
        disabled={activeIdx === 0}
        aria-label="上一组"
        style={{
          position: "absolute",
          left: "0",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 50,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: activeIdx === 0 ? "rgba(255,255,255,0.3)" : "#fff",
          fontSize: "1.5rem",
          lineHeight: 1,
          cursor: activeIdx === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (activeIdx !== 0) e.currentTarget.style.background = "rgba(0,0,0,0.75)";
        }}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.55)")
        }
      >
        ‹
      </button>
      {/* 右箭头 */}
      <button
        onClick={next}
        disabled={activeIdx === total - 1}
        aria-label="下一组"
        style={{
          position: "absolute",
          right: "0",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 50,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: activeIdx === total - 1 ? "rgba(255,255,255,0.3)" : "#fff",
          fontSize: "1.5rem",
          lineHeight: 1,
          cursor: activeIdx === total - 1 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (activeIdx !== total - 1)
            e.currentTarget.style.background = "rgba(0,0,0,0.75)";
        }}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.55)")
        }
      >
        ›
      </button>

      {/* 3D 舞台: 所有卡 absolute 居中, 根据 offset 应用 transform */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
        }}
      >
        {FEATURED_CASES.map((c, i) => {
          const offset = i - activeIdx;
          const isHovered = hoveredIdx === i;
          const t = cardTransform(offset, isHovered);
          return (
            <div
              key={c.id}
              onClick={() => setActiveIdx(i)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx((cur) => (cur === i ? null : cur))}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${CARD_W}px`,
                marginLeft: `-${CARD_W / 2}px`,
// v6: -135 配 height 320px 容器 (active 卡 16:9 配 480w → 270, 上下各 ~25px 空白)
marginTop: "-135px",
                ...t,
                transition:
                  "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease",
                cursor: offset === 0 ? "default" : "pointer",
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
              }}
            >
              <CaseCard c={c} variant="full" />
            </div>
          );
        })}
      </div>

      {/* dots 指示器 */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.4rem",
          zIndex: 40,
        }}
      >
        {FEATURED_CASES.map((_, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`跳到第 ${i + 1} 张`}
              style={{
                width: isActive ? "18px" : "5px",
                height: "5px",
                borderRadius: "3px",
                background: isActive ? "#ffffff" : "rgba(255,255,255,0.28)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// 爆款模板 tab 筛选 + 4 列网格
// ─────────────────────────────────────────────────────────
function HotTemplates() {
  const [activeTab, setActiveTab] = useState("全部");

  const filtered = useMemo(() => {
    if (activeTab === "全部") return PORTRAIT_TEMPLATES;
    return PORTRAIT_TEMPLATES.filter((c) => c.category === activeTab);
  }, [activeTab]);

  return (
    <>
      {/* 分类 tab */}
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

      {/* 4 列竖屏网格 */}
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
// 栏目对齐: 用 max-width 1200px wrapper 居中 (与 Hero/StartCreating 对齐)
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
        {/* 精选推荐: 3D 立体 */}
        <SectionHeader title="精选推荐" link="/case?orientation=landscape" />
        <FeaturedCarousel />

        {/* 爆款模板: 4 列网格 */}
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