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
  "这班谁爱上谁上": "this-class",
  "下班一刻": "off-work-moment",
  "冰岛": "iceland",
  "守门精神": "goalkeeper-spirit",
  "如果这个世界只剩下了机器人": "only-robots",
  "未来？": "future-",
  "赛博江湖": "cyber-jianghu",
  "婆媳之争": "mother-in-law-war",
};

const rawNames = [
  "下班一刻", "世界杯", "假如爱真的存在", "冰岛", "双端操控",
  "国色青云座", "带娃", "思考者", "星空", "暴躁包租婆",
  "炫酷产品种草", "蒙娜丽莎的微笑",
  "这班谁爱上谁上", "青苔的触感",
  // 2026-06-24 Ling 传素材
  // 新加 3 个
  "如果这个世界只剩下了机器人", "未来？", "赛博江湖",
  // 重命名 1 个 (前身: 运动精神)
  "守门精神",
  // 重命名 1 个 (前身: 沙发怎么选 2)
  "婆媳之争",
  // 下架 1 个 (沙发怎么选 1 已从数组移除)
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
  "这班谁爱上谁上":   { orientation: "portrait",  duration: 42 },
  "青苔的触感":       { orientation: "landscape", duration: 37 },
  "炫酷产品种草":     { orientation: "portrait",  duration: 44 },
  "蒙娜丽莎的微笑":   { orientation: "portrait",  duration: 50 },
  "守门精神":         { orientation: "landscape", duration: 39 },  // 2026-06-24 重命名 (前身: 运动精神, ffprobe 39.8s)
  "婆媳之争":         { orientation: "portrait",  duration: 41 },  // 2026-06-24 重命名 (前身: 沙发怎么选 2, ffprobe 41.3s)
  // 2026-06-24 新加 (ffprobe 探测, Ling 传素材)
  "如果这个世界只剩下了机器人": { orientation: "portrait",  duration: 54 },
  "未来？":            { orientation: "landscape", duration: 74 },
  "赛博江湖":         { orientation: "landscape", duration: 64 },
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

// 显式顺序 (首页 FeaturedCases 用, 2026-06-24 Ling 调)
//   未列出的 = 不展示 (不会发生, 顺序数组覆盖全量)
//   调整 = 拖动数组元素
export const FEATURED_ORDER: string[] = [
  "守门精神",        // 1 — Ling 指定 (精选推荐)
  "青苔的触感",      // 2 — Ling 指定
  "未来？",           // 3 — Ling 指定
];

export const LANDSCAPE_ORDER: string[] = [
  "赛博江湖",                       // 1 — v5.2 Ling: 原第 4 提到第 1
  "守门精神",                       // 2 — 原第 1
  "青苔的触感",                     // 3 — 原第 2
  "未来？",                          // 4 — 原第 3
  "国色青云座",                     // 5
  "带娃",                            // 6
  "星空",                            // 7
  "冰岛",                            // 8
  "世界杯",                          // 9
];

export const PORTRAIT_ORDER: string[] = [
  "暴躁包租婆",                     // 1 — Ling 指定
  "下班一刻",                        // 2 (原 rawNames 第 1 位)
  "假如爱真的存在",                 // 3 (原 rawNames 第 2 位)
  "如果这个世界只剩下了机器人", // 4 — Ling 指定
  "双端操控",                        // 5
  "思考者",                          // 6
  "炫酷产品种草",                    // 7
  "蒙娜丽莎的微笑",                  // 8
  "这班谁爱上谁上",                  // 9
  "婆媳之争",                        // 10
];

// 按显式顺序数组重排 (找不到的放末尾, 不丢条目)
export function orderByTitle<T extends { title: string }>(
  items: T[],
  order: string[]
): T[] {
  return [...items].sort((a, b) => {
    const ia = order.indexOf(a.title);
    const ib = order.indexOf(b.title);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

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