const KPIS = [
  { label: "总播放", value: "127.4w", change: "+12.4%", up: true },
  { label: "总互动", value: "9.8w", change: "+18.2%", up: true },
  { label: "总转化", value: "3,254", change: "+8.6%", up: true },
  { label: "新增作品", value: "23", change: "-2", up: false },
];

const RANK = [
  { rank: 1, title: "现代极简三人沙发 30s", views: "21.3w" },
  { rank: 2, title: "618 大促 全屋套餐", views: "18.2w" },
  { rank: 3, title: "客户见证 - 老用户回访", views: "12.4w" },
  { rank: 4, title: "现代简约餐桌场景", views: "9.7w" },
  { rank: 5, title: "冬季新品发布 - 灯具", views: "8.5w" },
];

// 14 天假数据
const TREND = [42, 38, 51, 47, 62, 58, 71, 68, 75, 82, 78, 88, 95, 102];
const MAX = Math.max(...TREND);

export default function AnalyticsPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* 时间段 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: "2rem" }}>
        {["7 天", "30 天", "90 天"].map((p, i) => (
          <button
            key={p}
            style={{
              padding: "0.4rem 0.875rem", fontSize: "0.8125rem",
              color: i === 1 ? "var(--text)" : "var(--text-secondary)",
              fontWeight: i === 1 ? 500 : 400,
              background: i === 1 ? "var(--bg-gray)" : "transparent",
              border: "none", borderRadius: 980, cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KPI 卡 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        {KPIS.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff",
              border: "1px solid var(--border-light)",
              borderRadius: 16,
              padding: "1.5rem",
            }}
          >
            <div
              className="t-small"
              style={{
                fontSize: "0.7rem", fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase", letterSpacing: "0.04em",
                marginBottom: 12,
              }}
            >
              {k.label}
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
              {k.value}
            </div>
            <div
              className="t-small"
              style={{ color: k.up ? "#1d1d1f" : "#c75d2c", fontSize: "0.75rem", fontWeight: 500 }}
            >
              {k.up ? "↑" : "↓"} {k.change}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* 折线图 (CSS) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border-light)",
            borderRadius: 16,
            padding: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 4 }}>播放量趋势</div>
          <div className="t-small" style={{ marginBottom: "1.5rem" }}>近 14 天</div>
          <div
            style={{
              display: "flex", alignItems: "flex-end",
              gap: 6, height: 180, paddingTop: 12,
            }}
          >
            {TREND.map((v, i) => (
              <div
                key={i}
                title={`Day ${i + 1}: ${v}w`}
                style={{
                  flex: 1,
                  height: `${(v / MAX) * 100}%`,
                  background: i === TREND.length - 1 ? "var(--text)" : "var(--border)",
                  borderRadius: 4,
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              marginTop: 8, fontSize: "0.7rem", color: "var(--text-tertiary)",
            }}
          >
            <span>14 天前</span>
            <span>今天</span>
          </div>
        </div>

        {/* 排行 */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--border-light)",
            borderRadius: 16,
            padding: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 16 }}>TOP 5 视频</div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {RANK.map((r) => (
              <li
                key={r.rank}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "0.625rem 0",
                  borderTop: r.rank === 1 ? "none" : "1px solid var(--border-light)",
                }}
              >
                <span
                  style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: r.rank <= 3 ? "var(--text)" : "var(--bg-gray)",
                    color: r.rank <= 3 ? "#fff" : "var(--text-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {r.rank}
                </span>
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                  {r.title}
                </div>
                <div className="t-small" style={{ fontSize: "0.75rem" }}>{r.views}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* AI 建议 */}
      <div
        style={{
          background: "var(--bg-gray)",
          borderRadius: 16,
          padding: "1.5rem 1.75rem",
        }}
      >
        <div
          className="t-small"
          style={{
            fontSize: "0.7rem", fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase", letterSpacing: "0.04em",
            marginBottom: 12,
          }}
        >
          下一步建议 (由 MiniMax 分析)
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
          <li style={{ fontSize: "0.9375rem", color: "var(--text)", marginBottom: 4 }}>
            "现代极简三人沙发 30s" 是这个周期的爆款, 建议复用此画布, 套到同系列其他 3 款沙发上.
          </li>
          <li style={{ fontSize: "0.9375rem", color: "var(--text)", marginBottom: 4 }}>
            灯具类目的完播率比平均低 8%, 可能是镜头节奏问题 — 建议跑一下"灯具专场模板"对比.
          </li>
          <li style={{ fontSize: "0.9375rem", color: "var(--text)" }}>
            下周有 618 节点, 建议提前 3 天跑 3-5 款"618 全屋套餐"变体测款.
          </li>
        </ol>
      </div>
    </div>
  );
}