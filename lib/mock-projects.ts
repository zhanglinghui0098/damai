// v4.3: 共享 mock data — workbench (server) + MyProjects (client) 都 import 这个
// 8 条完整项目数据, 全蓝紫科技风 hue (200-285), 全部有真名字
// 首页 StartCreating 强制覆盖显示 "未命名项目" (不取 name 字段)
// /workbench 子页面展示真名字
export const MOCK_PROJECTS = [
  { id: "p1", name: "现代极简三人沙发 30s", updated: "2 小时前", hue: 220, status: "草稿" },
  { id: "p2", name: "618 大促 全屋套餐", updated: "昨天", hue: 260, status: "生成中" },
  { id: "p3", name: "现代简约餐桌场景", updated: "3 天前", hue: 200, status: "已发布" },
  { id: "p4", name: "客户见证 - 老用户回访", updated: "上周", hue: 245, status: "已发布" },
  { id: "p5", name: "冬季新品发布 - 灯具", updated: "2 周前", hue: 280, status: "草稿" },
  { id: "p6", name: "中秋氛围大片", updated: "1 月前", hue: 215, status: "归档" },
  { id: "p7", name: "美式单人沙发 复古风", updated: "1 月前", hue: 270, status: "草稿" },
  { id: "p8", name: "智能床 5 段演示", updated: "2 月前", hue: 235, status: "已发布" },
];