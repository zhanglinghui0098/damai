import Link from "next/link";
import CaseCard from "@/components/CaseCard";

const PERIODS = ["7 天", "30 天", "90 天", "全部"];
const TYPES = ["全部类型", "沙发", "床", "灯具", "餐桌", "衣柜"];

// viral 排行榜用 mock data (无真实视频/海报), brand/score/views 是榜单字段不属于 CaseItem
// spread 补全 CaseItem 必传字段: creator/videoUrl/posterUrl/description/orientation/duration
const VIRAL = [
  { id: "v1", title: "现代极简三人沙发 30s", brand: "顾家", category: "沙发", hue: 22, score: 98, views: "132w" },
  { id: "v2", title: "奶油风 1.8m 软包床", brand: "慕思", category: "床", hue: 18, score: 95, views: "108w" },
  { id: "v3", title: "618 全屋套餐 3 分钟", brand: "全友", category: "套餐", hue: 14, score: 94, views: "96w" },
  { id: "v4", title: "餐厅吊灯氛围光 15s", brand: "雷士照明", category: "灯具", hue: 38, score: 92, views: "84w" },
  { id: "v5", title: "实木餐桌 4 人家庭", brand: "源氏木语", category: "餐桌", hue: 12, score: 90, views: "76w" },
  { id: "v6", title: "智能床 5 段演示", brand: "慕思", category: "床", hue: 20, score: 88, views: "72w" },
  { id: "v7", title: "推拉门衣柜收纳", brand: "索菲亚", category: "衣柜", hue: 28, score: 86, views: "68w" },
  { id: "v8", title: "奶油风茶几搭配", brand: "林氏木业", category: "沙发", hue: 32, score: 85, views: "65w" },
  { id: "v9", title: "落地灯三色温", brand: "雷士照明", category: "灯具", hue: 40, score: 82, views: "58w" },
].map((v) => ({
  ...v,
  creator: "热榜用户",
  videoUrl: "",
  posterUrl: "",
  description: `${v.brand} · ${v.category} · 热度 ${v.score} · ${v.views} 播放`,
  orientation: "landscape" as const,
  duration: 30,
}));

export default function ViralPage() {
  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* 筛选 */}
      <div
        style={{
          display: "flex", gap: "1.5rem", flexWrap: "wrap",
          marginBottom: "2.5rem", fontSize: "0.875rem",
        }}
      >
        <FilterGroup label="时间段" options={PERIODS} />
        <FilterGroup label="视频类型" options={TYPES} />
        <FilterGroup label="行业" options={["全部", "案例", "行业"]} />
      </div>

      {/* 排行 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {VIRAL.map((v, i) => (
          <div key={v.id} style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute", top: 12, left: 12, zIndex: 1,
                background: "rgba(0,0,0,0.85)", color: "#fff",
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8125rem", fontWeight: 600,
              }}
            >
              {i + 1}
            </div>
            <CaseCard c={v} />
            <div
              style={{
                position: "absolute", top: 12, right: 12, zIndex: 1,
                background: "rgba(255,255,255,0.92)", color: "var(--text)",
                fontSize: "0.7rem", padding: "3px 8px",
                borderRadius: 4, fontWeight: 500, backdropFilter: "blur(8px)",
              }}
            >
              {v.views} · 热度 {v.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterGroup({ label, options }: { label: string; options: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}:</span>
      {options.map((o, i) => (
        <span
          key={o}
          style={{
            color: i === 0 ? "var(--text)" : "var(--text-secondary)",
            fontWeight: i === 0 ? 500 : 400,
            cursor: "pointer",
          }}
        >
          {o}
        </span>
      ))}
    </div>
  );
}