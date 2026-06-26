import { Suspense } from "react";
import HeroAgent from "./HeroAgent";
import StartCreating from "./StartCreating";
import FeaturedCases from "./FeaturedCases";

export default function Hero() {
  return (
    <>
{/* 屏 1: 问句 + MiniMax 对话 (v4.3: 取消 logo, brand 大字 + dialog) */}
      <section
        className="section"
        style={{
          paddingTop: "2.5rem",
          paddingBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <div className="container-narrow">
          <h1
            style={{
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginBottom: "1.75rem",
              color: "var(--text)",
            }}
          >
            今天准备好大脉了吗?
          </h1>
          {/* Suspense 包裹因 HeroAgent 用了 useSearchParams (Next.js 14 SSG 要求); fallback=null 让标题先显示, agent 流式注入 */}
          <Suspense fallback={null}>
            <HeroAgent />
          </Suspense>
        </div>
      </section>

      {/* 屏 2: 开始创作 (5 tile — v4.3 缩略图改蓝紫科技风) */}
      <StartCreating />

      {/* 屏 3: 精选案例 (9 tabs — v4.3 重新编排) */}
      <FeaturedCases />
    </>
  );
}