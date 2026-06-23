// v2 数据工作台 mock data (2026-06-23)
// 数据模型: Project (账号) → SubProject (单条视频)
// 优化目标: ROI / CPL (投流场景)

export type Industry = "家具" | "美妆" | "餐饮" | "教育" | "本地服务";
export type Platform = "抖音" | "小红书" | "视频号";
export type VideoSource = "canvas" | "self_shot" | "external_edit";

export interface SubProject {
  id: string;
  projectId: string;
  title: string;
  source: VideoSource;
  publishedAt: string;
  platform: Platform;
  industry: Industry;
  spend: number;       // 投放消耗 ¥
  leads: number;       // 表单数
  views: number;       // 播放量
  completion: number;  // 完播率 %
  engagement: number;  // 互动率 %
  conversion: number;  // 转化率 %
}

export interface Project {
  id: string;
  name: string;       // 账号/项目名, e.g. "顾家家居 - 618 大促"
  industry: Industry;
  platform: Platform;
  status: "进行中" | "已结束" | "待启动";
  totalSpend: number;
  totalLeads: number;
  cpl: number;        // 平均 CPL ¥
  roi: number;        // 整体 ROI
  subprojects: SubProject[];
  city: string;
}

export interface AIRecommendation {
  id: string;
  topic: string;
  industry: Industry;
  city: string;
  score: number;      // 0-100, AI 预测热度分
  reason: string;     // AI 推荐理由
  source: "industry" | "local" | "account";
}

export interface WeeklyReport {
  id: string;
  projectId: string;
  projectName: string;
  range: string;      // e.g. "2026-06-16 ~ 2026-06-22"
  totalSpend: number;
  totalLeads: number;
  cpl: number;
  roi: number;
  highlights: string[];
  lowlights: string[];
  nextPlan: string[];
}

// ============ Projects ============

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "顾家家居 - 618 大促",
    industry: "家具",
    platform: "抖音",
    status: "进行中",
    city: "杭州",
    totalSpend: 8420,
    totalLeads: 218,
    cpl: 38.6,
    roi: 2.8,
    subprojects: [
      { id: "s1", projectId: "p1", title: "现代极简三人沙发 30s", source: "canvas", publishedAt: "2 小时前", platform: "抖音", industry: "家具", spend: 1820, leads: 52, views: 124000, completion: 68, engagement: 8.2, conversion: 3.4 },
      { id: "s2", projectId: "p1", title: "客户见证 - 老用户回访", source: "self_shot", publishedAt: "上周", platform: "抖音", industry: "家具", spend: 2400, leads: 68, views: 87000, completion: 76, engagement: 12.1, conversion: 5.6 },
      { id: "s3", projectId: "p1", title: "618 全屋套餐 3 分钟", source: "canvas", publishedAt: "2 周前", platform: "抖音", industry: "家具", spend: 4200, leads: 98, views: 213000, completion: 54, engagement: 6.4, conversion: 2.1 },
    ],
  },
  {
    id: "p2",
    name: "天禧派 - 现代简约餐桌场景",
    industry: "家具",
    platform: "小红书",
    status: "进行中",
    city: "杭州",
    totalSpend: 3640,
    totalLeads: 92,
    cpl: 39.6,
    roi: 3.4,
    subprojects: [
      { id: "s4", projectId: "p2", title: "奶油风餐桌氛围", source: "canvas", publishedAt: "3 天前", platform: "小红书", industry: "家具", spend: 1640, leads: 42, views: 68000, completion: 72, engagement: 9.8, conversion: 4.2 },
      { id: "s5", projectId: "p2", title: "实木餐桌 4 人家庭", source: "external_edit", publishedAt: "2 周前", platform: "小红书", industry: "家具", spend: 2000, leads: 50, views: 52000, completion: 65, engagement: 7.6, conversion: 3.1 },
    ],
  },
  {
    id: "p3",
    name: "天禧派 - 智能床 5 段演示",
    industry: "家具",
    platform: "抖音",
    status: "已结束",
    city: "杭州",
    totalSpend: 2100,
    totalLeads: 54,
    cpl: 38.9,
    roi: 4.2,
    subprojects: [
      { id: "s6", projectId: "p3", title: "智能床 5 段演示", source: "canvas", publishedAt: "2 月前", platform: "抖音", industry: "家具", spend: 2100, leads: 54, views: 78000, completion: 71, engagement: 8.9, conversion: 3.8 },
    ],
  },
  {
    id: "p4",
    name: "慕思 - 中秋氛围大片",
    industry: "家具",
    platform: "抖音",
    status: "待启动",
    city: "上海",
    totalSpend: 0,
    totalLeads: 0,
    cpl: 0,
    roi: 0,
    subprojects: [],
  },
];

// ============ AI Recommendations ============

export const AI_RECOMMENDATIONS: AIRecommendation[] = [
  { id: "r1", topic: "现代极简三人沙发 30s", industry: "家具", city: "杭州", score: 92, reason: "杭州本地同品类近 30 天转化率 TOP 3, 完播率高于均值 22%", source: "local" },
  { id: "r2", topic: "奶油风 1.8m 软包床", industry: "家具", city: "杭州", score: 89, reason: "小红书家居品类热度 +340%, 适合图文 + 视频组合", source: "industry" },
  { id: "r3", topic: "618 全屋套餐 3 分钟", industry: "家具", city: "全国", score: 86, reason: "618 节点性选题, 你账号历史 ROI 最高的全屋类内容", source: "account" },
  { id: "r4", topic: "客户家交付 - 老用户回访", industry: "家具", city: "杭州", score: 84, reason: "你账号信任转化类历史 ROI 5.6, 跑通可复用", source: "account" },
  { id: "r5", topic: "智能床 5 段演示", industry: "家具", city: "上海", score: 78, reason: "上海用户智能床搜索量 +180%, 慕思账号已有同类内容可参考", source: "local" },
  { id: "r6", topic: "餐厅吊灯氛围光 15s", industry: "家具", city: "全国", score: 75, reason: "氛围灯光品类全网热度上升, 拍摄成本低", source: "industry" },
];

// ============ Weekly Reports ============

export const REPORTS: WeeklyReport[] = [
  {
    id: "w1",
    projectId: "p1",
    projectName: "顾家家居 - 618 大促",
    range: "2026-06-16 ~ 2026-06-22",
    totalSpend: 4820,
    totalLeads: 126,
    cpl: 38.3,
    roi: 3.0,
    highlights: [
      "客户见证类视频 ROI 5.6, 比账号均值高 87%",
      "周三投放的「老用户回访」互动率 12.1%, 进入品类头部",
      "完播率 76%, 高于行业均值 23 个百分点",
    ],
    lowlights: [
      "618 全屋套餐完播率仅 54%, 主要流失在 15-20 秒",
      "小红书未投放, 同类内容在抖音跑出后没追投",
    ],
    nextPlan: [
      "把「老用户回访」改一版 15 秒精简版投小红书",
      "618 全屋套餐重剪, 镜头切换从 8 次加到 12 次",
      "下周三、周五各投 1 条新客户见证类",
    ],
  },
  {
    id: "w2",
    projectId: "p2",
    projectName: "天禧派 - 现代简约餐桌场景",
    range: "2026-06-16 ~ 2026-06-22",
    totalSpend: 1640,
    totalLeads: 42,
    cpl: 39.0,
    roi: 3.6,
    highlights: [
      "小红书端完播率 72%, 高于抖音端 4 个百分点",
      "转化率 4.2%, 是这个品类头部水平",
    ],
    lowlights: [
      "外协剪辑的「实木餐桌 4 人家庭」成本偏高, ROI 仅 3.1",
    ],
    nextPlan: [
      "外协内容预算砍 30%, 转向 AI 生成",
      "追投小红书「奶油风」系列",
    ],
  },
];

// ============ Aggregated dashboard KPIs ============

export function getDashboardSummary() {
  const totalSpend = PROJECTS.reduce((s, p) => s + p.totalSpend, 0);
  const totalLeads = PROJECTS.reduce((s, p) => s + p.totalLeads, 0);
  const activeProjects = PROJECTS.filter((p) => p.status === "进行中").length;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const roi =
    PROJECTS.filter((p) => p.status !== "待启动").reduce((s, p) => s + p.roi, 0) /
    Math.max(1, PROJECTS.filter((p) => p.status !== "待启动").length);
  return { totalSpend, totalLeads, cpl, roi, activeProjects };
}