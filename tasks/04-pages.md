# Task 04 — 板块设计（11 个页面）

**状态**：🟡 pending
**估时**：1 周
**是否要 Codex**：✅ 混合（用 shadcn/ui 装组件库 + 按 wireframe 写页面）
**依赖**：[#3 功能 P0](03-features-p0.md)
**最后更新**：2026-06-17 01:18

---

## 目标

11 个页面全部上线，每页有真实内容、真实功能、推敲到客户使用级别。

---

## 页面清单（4 类）

### 公共 / 营销（4 个）

| 路径 | 现状 | 备案前做吗 | 内容来源 |
|---|---|---|---|
| `/` 首页 | ✅ 改 | ✅ | [tasks/02-content.md](02-content.md) ST-2.3 hero 文案 |
| `/pricing` 定价 | ❌ 没 | ✅ | 3 档试用 ¥0 / 基础 ¥3000 / 高级 ¥5000 |
| `/about` 关于 | ❌ 没 | ✅ | 公司 + 团队 + 顾家合作 |
| `/contact` 联系 | ❌ 没 | ✅ | 表单 + 飞书通知 |

### 鉴权（2 个）

| 路径 | 现状 | 备案前做吗 | 实现 |
|---|---|---|---|
| `/login` 登录 | ❌ 没 | ✅ | 飞书 OAuth（来自 #1 鉴权） |
| `/signup` 注册 | ❌ 没 | ✅ | 跟 /login 合并 |

### 工作台 / 核心（5 个）

| 路径 | 现状 | 备案前做吗 | 内容来源 |
|---|---|---|---|
| `/dashboard` 总览 | ❌ 没 | ✅ | [tasks/03-features-p0.md](03-features-p0.md) 模块 D 复盘页 |
| `/templates` 选题 | ❌ 没 | ✅ | 模块 A 选题模板 |
| `/asset` 视频库 | ✅ 已有 | ✅ 改 | 升级：加审核状态标签 + 筛选 |
| `/generate` 生成 | ✅ 已有 | ✅ 改 | 模块 B 多模型路由 |
| `/review` 审核 | ❌ 没 | ✅ | 模块 C 飞书审核 H5 镜像 |

### 后台（1 个，P1 推）

| 路径 | 备案前做吗 |
|---|---|
| `/admin` 管理后台 | 🟡 推到 P1（多租户时再做） |

---

## 视觉系统（设计原则）

**建议配色**：黑金 + 浅灰
- 主色：黑 `#0a0a0a`
- 强调：金 `#c9a961`（顾家同款暖金）
- 背景：浅灰 `#f5f5f5`
- 文字：深灰 `#1a1a1a`

**字体**：
- 中文：思源黑体（免费）
- 英文：Inter（开源）

**设计参考**：
- 顾家官网 https://kuka.cn/
- 苹果极简风
- 即梦 AI 工具的"生成 → 预览 → 保存"流

---

## 子任务

### ST-4.1 装 shadcn/ui（半天）

- [ ] `npx shadcn-ui@latest init`
- [ ] 选 New York 风格
- [ ] 选 slate 色板
- [ ] 装基础组件：Button / Card / Input / Tabs / Dialog / Toast

### ST-4.2 写 4 个公共页面（2 天）

- [ ] `/` 首页（hero + 3 case + pricing 入口 + footer）
- [ ] `/pricing` 定价（3 档卡片 + FAQ 链接）
- [ ] `/about` 关于（公司故事 + 团队 + 顾家合作）
- [ ] `/contact` 联系（表单 + 飞书 webhook 推送）

### ST-4.3 写 2 个鉴权页面（半天）

- [ ] `/login` 飞书 OAuth 按钮 + 居中布局
- [ ] `/signup` 跟 login 合并（飞书首次登录即注册）

### ST-4.4 写 5 个工作台页面（3 天）

- [ ] `/dashboard` 4 数字 + 2 图表
- [ ] `/templates` 4 卡片
- [ ] `/asset` 升级：加审核状态筛选 + 通过/打回标签
- [ ] `/generate` 升级：加模型选择 + 预计成本/时长
- [ ] `/review` H5 镜像：飞书卡片的网页版（手机端）

### ST-4.5 响应式 + 移动端适配（1 天）

- [ ] 所有页面在手机端能正常用
- [ ] 飞书审批流必须在手机上能点

---

## 给 Codex 的任务单（分批给）

```
你好 Codex，我是张凌辉。给 damai 项目加 11 个页面 + 装 shadcn/ui：

【项目位置】
/opt/data/projects/damai/

【ST-4.1 装 shadcn/ui (0.5 天)】
1. npx shadcn-ui@latest init
2. 选 New York / slate
3. 装组件: Button Card Input Tabs Dialog Toast Select Slider Switch

【ST-4.2 公共页面 (2 天)】
/: hero (5 选 1) + 3 case 卡片 + pricing 入口 + footer
/pricing: 3 档卡片 + 切换月/年 + FAQ 链接
/about: 公司故事 + 团队 + 顾家合作 logo 墙
/contact: 表单 (姓名/手机/公司/留言) + 飞书 webhook

视觉: 黑金 (#0a0a0a + #c9a961) + 浅灰背景

【ST-4.3 鉴权 (0.5 天)】
/login: 飞书 OAuth 大按钮 + 居中
/signup: 跟 login 合并

【ST-4.4 工作台 (3 天)】
/dashboard: 4 数字卡片 + 2 图表 (Recharts) + 7/30/90 天切换
/templates: 4 卡片 (晨间/软装/节日/季节) + "应用"按钮
/asset: 视频库列表 + 审核状态标签 + 筛选
/generate: 表单 + 模型下拉 + 预计成本/时长
/review: H5 审批镜像 (手机端) + 通过/打回按钮

【ST-4.5 响应式 (1 天)】
所有页面适配手机端, 飞书审批流手机能点

【内容来源】
- 5 段 hero 文案: tasks/02-content.md ST-2.3
- 3 case study: tasks/02-content.md ST-2.2
- FAQ 20 条: tasks/02-content.md ST-2.5
- 4 选题模板: tasks/03-features-p0.md 模块 A
- 飞书 App ID: cli_aa9768a568b8dcb6

【输出】
完成后, 把:
1. 11 个页面路由列表
2. 关键 UI 截图 (手机 + 桌面)
3. 已知问题 / TODO
4. 移动端测试结果

写到一份 markdown 报告, 贴回给我。
```

---

## 完成标准（DoD）

- [ ] 11 个页面都能访问（无 404）
- [ ] shadcn/ui 装好，组件风格统一
- [ ] 手机端能正常用
- [ ] 飞书审批流手机能点
- [ ] 至少 1 个客户用完整路径走通
- [ ] 没有 5 个以上 console.error

---

## 风险

| 风险 | 概率 | 应对 |
|---|---|---|
| 11 页面太多来不及 | 高 | 推 /admin 到 P1，先做 10 个 |
| 移动端适配工作量超 | 中 | 早期就 mobile-first 设计 |
| shadcn/ui 跟 Tailwind 冲突 | 低 | 都是 shadcn 内置，0 冲突 |
