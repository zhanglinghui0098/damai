import Link from "next/link";
import type { CaseItem as CaseItemType } from "../lib/cases";

export type { CaseItemType as CaseItem };

export default function CaseCard({
  c,
  variant = "full",
}: {
  c: CaseItemType;
  variant?: "full" | "minimal";
}) {
  const creator = c.creator ?? "";

  const minimal = variant === "minimal";

  return (
    <Link
      href={`/case/${c.id}`}
      className="case-card"
      style={{
        display: minimal ? "block" : "flex",
        flexDirection: minimal ? undefined : "column",
        background: "transparent",
        transition: "transform 0.2s",
      }}
    >
      {/* 视频封面 (按视频原方向: 横 16:9 / 竖 9:16)
          v5.4: 删掉 full variant 的底部 caption overlay (用户原话: "整个视频封面的这个打码都取消了")
          - 卡外恢复 v5.3 之前的透明信息区 (用户名 + 标题 + 查看创作过程 pill)
          - 2026-06-24 v5.6+v5.7 后续: AI 生成 watermark 和时长徽标也都删了
          - minimal variant (侧边栏用) 的 caption overlay 不动

          v6.1: 重写父 div 结构 (2026-06-24 修椭圆 mask bug)
          - 原: 父 div 写 borderRadius:12 + overflow:hidden + isolation:isolate
                → 配合 3D 父级 transformStyle:preserve-3d 触发 Chrome GPU 合成 bug
                → 所有 case 卡片中央出现椭圆半透明遮罩
          - 新: borderRadius + overflow 全移到 <img> 自身 (Chrome 对 img 自带
                border-radius 路径稳定, 不触发合成 bug)
          - 父 div 只保留 background fallback + position:relative

          v5.8 (2026-06-24): case-card-thumb div 也加 borderRadius:12 (vision 验证)
          - 修 div 渐变背景 漏到 img 圆角外 的 4 个小三角

          v6.2 (2026-06-25): 标题 + 创作者名 caption overlay 改到视频封面**左下角** (full 模式)
          - 用户原话: "把所有的标题跟创作者名字, 放在画面的左下角, 这样能节省一点空间,
                      让整个排版再紧凑一点, 请将栏目二爆款模板跟精选推荐两个板块的视频,
                      都按这个要求改一下"
          - 删卡外信息区 (省 padding-top 0.55rem + 2 行文字 + pill)
          - 渐变背景自下而上 (0.78 → 0.5 → 0), 字可读
          - 不带 backdrop-filter / filter / transform → 不触发椭圆 mask bug
       */}
      <div
        className="case-card-thumb"
        style={{
          aspectRatio: c.orientation === "portrait" ? "9/16" : "16/9",
          background: `linear-gradient(135deg, hsl(${c.hue}, 18%, 32%), hsl(${
            c.hue + 12
          }, 16%, 22%))`,
          position: "relative",
          transition: "box-shadow 0.2s",
          borderRadius: 12, /* v5.8: 修 div 渐变背景 漏到 img 圆角外 的 4 个小三角 (vision 验证) */
          overflow: "hidden",
        }}
      >
        {c.posterUrl && (
          <img
            src={c.posterUrl}
            alt={c.title}
            loading="lazy"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 12,
              overflow: "hidden",
            }}
          />
        )}

        {/* v5.6: 删 AI 生成 watermark (2026-06-24 用户原话: "或者可以把两个都删了吗？不要任何AI标识") */}

        {/* v5.7: 删 时长徽标 (2026-06-24 用户原话: "把那个视频时长, 左、右上角的视频时长给删掉") */}

        {/* v6.2 (2026-06-25): 标题 + 创作者名 caption overlay 移到视频封面左下角
            - 替代卡外信息区 (省空间 + 紧凑)
            - 黑色渐变背景自下而上, 字可读
            - 不带 backdrop-filter / filter / transform → 不触发椭圆 mask bug
        */}
        {!minimal && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "2.5rem 0.625rem 0.5rem",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
              color: "#fff",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.7)",
                fontWeight: 500,
                marginBottom: "0.15rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {creator || "匿名"}
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                lineHeight: 1.35,
                color: "#fff",
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {c.title}
            </div>
          </div>
        )}
      </div>

      {/* minimal 模式 — caption overlay 保留 (侧边栏专用) */}
      {minimal && (
        <div
          className="caption-overlay"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "1.75rem 0.75rem 0.55rem",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, transparent 100%)",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.35,
            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {c.title}
        </div>
      )}
    </Link>
  );
}
