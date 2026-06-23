// 5 个核心模板 (P0 立即可用) + 7 个"敬请期待"占位
// 减法原则: 5 模板覆盖 80% 家居场景, 7 个放 P1 后期填充

export type Question = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
  required: boolean;
};

export type Template = {
  id: string;
  name: string;
  subtitle: string;          // 卡片副标题 (e.g. "30 秒出片")
  description: string;       // 详情描述
  category: string;          // e.g. "老板出镜"
  hue: number;               // 卡片配色 (HSL hue)
  duration: number;          // 视频秒数
  aspect: "16:9" | "9:16" | "1:1";  // 默认比例
  model: string;             // 默认 AI 模型
  questions: Question[];     // 3 步表单的问题
  promptTemplate: string;    // AI prompt 模板 (用 {{key}} 占位)
  ready: boolean;            // true = 可用, false = 敬请期待
};

export const TEMPLATES: Template[] = [
  // === 5 核心 (P0 可用) ===
  {
    id: "boss",
    name: "老板出镜讲解产品",
    subtitle: "30 秒出片",
    description: "老板自己出镜讲 1 款产品, 适合抖音/小红书个人 IP 打造",
    category: "老板出镜",
    hue: 24,
    duration: 30,
    aspect: "9:16",
    model: "即梦",
    questions: [
      { id: "product", label: "讲解哪款产品?", type: "text", placeholder: "比如 现代极简三人沙发", required: true },
      { id: "selling_point", label: "3 个卖点 (用顿号分隔)", type: "text", placeholder: "比如 真皮、可躺、万元质感", required: true },
      { id: "tone", label: "讲解风格", type: "select", options: ["专业稳重", "亲切邻家", "激情促销", "幽默调侃"], required: true },
    ],
    promptTemplate:
      "老板出镜讲解 {{product}} 视频, 时长 30 秒竖屏. 卖点: {{selling_point}}. 风格: {{tone}}. 镜头: 老板特写 + 产品全景切换. 末尾品牌 LOGO 浮现.",
    ready: true,
  },
  {
    id: "case",
    name: "客户家交付案例",
    subtitle: "玩转工作流",
    description: "客户家真实照片 → AI 拼成 15 秒爆款, 适合小红书/朋友圈种草",
    category: "客户见证",
    hue: 220,
    duration: 15,
    aspect: "9:16",
    model: "Seedance 2.0",
    questions: [
      { id: "space_type", label: "空间类型", type: "select", options: ["客厅", "卧室", "餐厅", "书房", "全屋"], required: true },
      { id: "style", label: "装修风格", type: "text", placeholder: "比如 奶油风 / 北欧 / 中式", required: true },
      { id: "highlights", label: "客户最满意的 3 个点", type: "textarea", placeholder: "比如 沙发坐着很舒服 / 灯光很温馨 / 收纳强", required: true },
    ],
    promptTemplate:
      "客户家 {{space_type}} 交付案例视频, 时长 15 秒竖屏. 风格: {{style}}. 客户最满意: {{highlights}}. 镜头: 客户笑脸 → 空间全景 → 细节特写. 末尾字幕: 谢谢选择天禧派.",
    ready: true,
  },
  {
    id: "product",
    name: "产品展示",
    subtitle: "标准出片",
    description: "1 件产品的标准 15 秒展示, 适合天猫/京东详情页",
    category: "产品展示",
    hue: 32,
    duration: 15,
    aspect: "1:1",
    model: "即梦",
    questions: [
      { id: "product_name", label: "产品名", type: "text", placeholder: "比如 北欧实木餐桌", required: true },
      { id: "scene", label: "展示场景", type: "select", options: ["纯白棚拍", "客厅实景", "餐厅实景", "户外自然光"], required: true },
      { id: "key_features", label: "核心卖点 (用顿号分隔)", type: "text", placeholder: "比如 实木、可折叠、易清洁", required: true },
    ],
    promptTemplate:
      "{{product_name}} 产品展示视频, 时长 15 秒方形. 场景: {{scene}}. 卖点: {{key_features}}. 镜头: 360 度环绕 + 细节特写. 末尾价格浮现.",
    ready: true,
  },
  {
    id: "promo",
    name: "促销活动",
    subtitle: "30 秒出片",
    description: "618/双 11/春节促销, 限时折扣 / 满减 / 赠品信息",
    category: "促销活动",
    hue: 8,
    duration: 30,
    aspect: "9:16",
    model: "即梦",
    questions: [
      { id: "festival", label: "活动名", type: "text", placeholder: "比如 618 狂欢节", required: true },
      { id: "discount", label: "折扣信息", type: "text", placeholder: "比如 全场 5 折 / 满 5000 减 1000", required: true },
      { id: "deadline", label: "活动截止", type: "text", placeholder: "比如 6 月 18 日 24 点", required: true },
    ],
    promptTemplate:
      "{{festival}} 促销活动视频, 时长 30 秒竖屏. 折扣: {{discount}}. 截止: {{deadline}}. 镜头: 红包雨 + 商品快剪 + 大字报价格. 节奏紧凑, 末尾倒计时.",
    ready: true,
  },
  {
    id: "holiday",
    name: "节日营销",
    subtitle: "30 秒出片",
    description: "春节/中秋/圣诞等节日氛围视频, 适合品牌温度建设",
    category: "节日营销",
    hue: 0,
    duration: 30,
    aspect: "9:16",
    model: "Seedance 2.0",
    questions: [
      { id: "holiday", label: "节日名", type: "select", options: ["春节", "元宵", "中秋", "圣诞", "情人节", "母亲节", "父亲节"], required: true },
      { id: "theme", label: "主题方向", type: "text", placeholder: "比如 团圆、家的味道", required: true },
      { id: "products", label: "融入的产品 (用顿号分隔)", type: "text", placeholder: "比如 餐桌、沙发、床垫", required: true },
    ],
    promptTemplate:
      "{{holiday}} 节日营销视频, 时长 30 秒竖屏. 主题: {{theme}}. 融入产品: {{products}}. 镜头: 节日场景 + 家庭温馨画面 + 产品自然出现. 末尾祝词浮现.",
    ready: true,
  },

  // === 7 个"敬请期待" (P1 后期填充) ===
  { id: "sofa-1", name: "现代极简三人沙发 30s", subtitle: "敬请期待", description: "现代极简风格三人沙发单品展示", category: "沙发", hue: 22, duration: 30, aspect: "16:9", model: "Seedance 2.0", questions: [], promptTemplate: "", ready: false },
  { id: "bed-1", name: "北欧风 1.8m 软包床", subtitle: "敬请期待", description: "北欧风软包床", category: "床", hue: 18, duration: 30, aspect: "16:9", model: "即梦", questions: [], promptTemplate: "", ready: false },
  { id: "light-1", name: "餐厅吊灯氛围光 15s", subtitle: "敬请期待", description: "餐厅吊灯氛围光展示", category: "灯具", hue: 38, duration: 15, aspect: "1:1", model: "可灵", questions: [], promptTemplate: "", ready: false },
  { id: "table-1", name: "实木餐桌 4 人家庭场景", subtitle: "敬请期待", description: "实木餐桌家庭场景", category: "餐桌", hue: 12, duration: 30, aspect: "16:9", model: "Seedance 2.0", questions: [], promptTemplate: "", ready: false },
  { id: "wardrobe-1", name: "推拉门衣柜收纳全解", subtitle: "敬请期待", description: "推拉门衣柜收纳", category: "衣柜", hue: 28, duration: 45, aspect: "9:16", model: "Vidu", questions: [], promptTemplate: "", ready: false },
  { id: "package-1", name: "618 全屋套餐 3 分钟", subtitle: "敬请期待", description: "618 全屋套餐", category: "618", hue: 14, duration: 180, aspect: "16:9", model: "Seedance 2.0", questions: [], promptTemplate: "", ready: false },
  { id: "spring-1", name: "春节氛围打造 60s", subtitle: "敬请期待", description: "春节氛围打造", category: "春节", hue: 8, duration: 60, aspect: "9:16", model: "即梦", questions: [], promptTemplate: "", ready: false },
];

export const READY_TEMPLATES = TEMPLATES.filter((t) => t.ready);
export const COMING_SOON_TEMPLATES = TEMPLATES.filter((t) => !t.ready);

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
