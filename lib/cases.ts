// 大脉案例库 — 17 个真实视频 (来自 Ling 2026-06-24 上传)
// 视频在 public/case/, poster 在 public/case/poster/

export type CaseItem = {
  id: string;          // URL slug, 用拼音/英文
  title: string;       // 标题
  creator: string;     // 作者
  category: string;    // 分类
  hue: number;         // 占位色 (有 poster 时实际不会用)
  videoUrl: string;    // /case/xxx.mp4
  posterUrl: string;   // /case/poster/xxx.jpg
  description: string; // 详情页描述
  orientation: "landscape" | "portrait";  // 视频方向 (按真实分辨率判断)
  duration: number;    // 秒
};

// 文件名 → URL slug 映射 (路由参数用, 不用中文 id 防编码坑)
const slugMap: Record<string, string> = {
  "世界杯": "world-cup",
  "带娃": "with-kids",
  "运动精神": "sports-spirit",
  "青苔的触感": "moss-touch",
  "国色青云座": "qingyun-throne",
  "暴躁包租婆": "angry-landlady",
  "蒙娜丽莎的微笑": "mona-lisa-smile",
  "思考者": "the-thinker",
  "双端操控": "dual-control",
  "假如爱真的存在": "if-love-exists",
  "炫酷产品种草": "cool-product-seed",
  "星空": "starry-sky",
  "沙发怎么选1": "sofa-pick-1",
  "这班谁爱上谁上": "this-class",
  "沙发怎么选2": "sofa-pick-2",
  "下班一刻": "off-work-moment",
  "冰岛": "iceland",
};

const rawNames = [
  "下班一刻", "世界杯", "假如爱真的存在", "冰岛", "双端操控",
  "国色青云座", "带娃", "思考者", "星空", "暴躁包租婆",
  "沙发怎么选1", "沙发怎么选2", "炫酷产品种草", "蒙娜丽莎的微笑",
  "运动精神", "这班谁爱上谁上", "青苔的触感",
];

// 真实视频元数据 (从 ffprobe 探测, 2026-06-24)
// 横 = 3840×2160 (16:9)   竖 = 2160×3840 (9:16)
const metaMap: Record<string, { orientation: "landscape" | "portrait"; duration: number }> = {
  "下班一刻":         { orientation: "portrait",  duration: 46 },
  "世界杯":           { orientation: "landscape", duration: 38 },
  "假如爱真的存在":    { orientation: "portrait",  duration: 37 },
  "冰岛":             { orientation: "landscape", duration: 44 },
  "双端操控":         { orientation: "portrait",  duration: 44 },
  "国色青云座":       { orientation: "landscape", duration: 46 },
  "带娃":             { orientation: "landscape", duration: 41 },
  "思考者":           { orientation: "portrait",  duration: 42 },
  "星空":             { orientation: "landscape", duration: 55 },
  "暴躁包租婆":       { orientation: "portrait",  duration: 43 },
  "沙发怎么选1":      { orientation: "portrait",  duration: 38 },
  "沙发怎么选2":      { orientation: "portrait",  duration: 41 },
  "炫酷产品种草":     { orientation: "portrait",  duration: 44 },
  "蒙娜丽莎的微笑":   { orientation: "portrait",  duration: 50 },
  "运动精神":         { orientation: "landscape", duration: 39 },
  "这班谁爱上谁上":   { orientation: "portrait",  duration: 42 },
  "青苔的触感":       { orientation: "landscape", duration: 37 },
};

export const CASES: CaseItem[] = rawNames.map((title) => {
  const slug = slugMap[title];
  const encoded = encodeURIComponent(title); // 中文文件名编码
  const meta = metaMap[title];
  return {
    id: slug,                                // URL slug (英文)
    title,
    creator: "Ling",
    category: "品牌广告",
    hue: 220,                                // 已弃用 (有 poster)
    videoUrl: `/case/${encoded}.mp4`,        // 实际文件名是中文
    posterUrl: `/case/poster/${encoded}.jpg`,
    description: `${title} — ${meta.orientation === "portrait" ? "9:16 竖屏" : "16:9 横屏"} 品牌视频样片.`,
    orientation: meta.orientation,
    duration: meta.duration,
  };
});

// 分组工具
export const LANDSCAPE_CASES = CASES.filter((c) => c.orientation === "landscape");
export const PORTRAIT_CASES = CASES.filter((c) => c.orientation === "portrait");

// 详情页用 lookup
export const CASES_BY_ID: Record<string, CaseItem> = Object.fromEntries(
  CASES.map((c) => [c.id, c])
);

// 分类清单 (FeaturedCases tab 用)
export const CATEGORIES = [
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