const REVIEWS = [
  {
    id: "r1", title: "现代简约餐桌场景", publishedAt: "3 天前",
    platform: "抖音", views: "12.4w", completion: 68, engagement: 8.2, conversion: 3.4,
    advice: [
      "前 3 秒钩子强, 但完播率 68% 说明中段有掉粉 — 建议把镜头切换从 8 次加到 12 次, 加快节奏.",
      "转化率 3.4% 不错, 可以把'点击购买' CTA 提前到 18 秒位置 (现在是 25 秒).",
    ],
  },
  {
    id: "r2", title: "客户见证 - 老用户回访", publishedAt: "上周",
    platform: "抖音", views: "8.7w", completion: 76, engagement: 12.1, conversion: 5.6,
    advice: [
      "完播率 76% 优秀, 转化 5.6% 是这个品类头部水平 — 建议作为模板保存.",
      "互动率 12.1% 高, 评论区有不少问价, 可以追投一波信息流.",
    ],
  },
  {
    id: "r3", title: "现代极简三人沙发 30s", publishedAt: "2 周前",
    platform: "抖音 + 小红书", views: "21.3w", completion: 54, engagement: 6.4, conversion: 2.1,
    advice: [
      "完播率偏低 (54%), 主要流失在 15-20 秒 — 检查是不是镜头 3 太长, 建议缩到 3 秒以内.",
      "小红书端的完播比抖音高 12%, 这种内容更适配图文平台, 建议把同款重剪成图文笔记.",
    ],
  },
];

export default function ReviewPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <p className="t-body" style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", maxWidth: 640 }}>
        你发布过的视频效果复盘. AI 会分析每个视频的指标, 给出 2-3 条具体改进建议.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {REVIEWS.map((r) => (
          <div
            key={r.id}
            style={{
              background: "#fff",
              border: "1px solid var(--border-light)",
              borderRadius: 18,
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: "1.25rem",
                flexWrap: "wrap", gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "1.0625rem", fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
                  {r.title}
                </div>
                <div className="t-small">
                  {r.platform} · {r.publishedAt}
                </div>
              </div>
              <div style={{ display: "flex", gap: "1.75rem" }}>
                <Metric label="播放" value={r.views} />
                <Metric label="完播" value={`${r.completion}%`} good={r.completion > 60} />
                <Metric label="互动" value={`${r.engagement}%`} good={r.engagement > 8} />
                <Metric label="转化" value={`${r.conversion}%`} good={r.conversion > 3} />
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-gray)",
                borderRadius: 12,
                padding: "1.25rem 1.5rem",
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
                AI 复盘建议
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
                {r.advice.map((a, i) => (
                  <li key={i} style={{ fontSize: "0.875rem", color: "var(--text)", marginBottom: 6 }}>
                    {a}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        className="t-small"
        style={{
          fontSize: "0.7rem", fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.0625rem", fontWeight: 500,
          color: good === undefined ? "var(--text)" : good ? "#1d1d1f" : "#c75d2c",
        }}
      >
        {value}
      </div>
    </div>
  );
}