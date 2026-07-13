# 大脉画布 v5 项目 Brief (基于 @antv/x6)

> **元信息**:
> - 决策时间: 2026-07-13
> - 决策人: 张凌辉 (业务) + Hermes (技术协调)
> - 替代: v4 dev (基于 @xyflow/react 12.5.0, **已废弃**)
> - 保留: v2 production (基于 @xyflow/react, **不动**)
> - 重写理由: v4 dev 35+ 次失败, 根因为 codex 抄 TapNow UI 时混了 @antv/x6 API 到 @xyflow/react 代码 (v1.1 自我审查 2.1)
> - 本文档版本: v2.0 (基于 v1.1 + 换栈决策重写)

---

# Part 0: 核心决策

## 0.1 决策: 换底座到 @antv/x6

| 项 | 旧 (v4) | 新 (v5) |
|----|---------|---------|
| 画布引擎 | @xyflow/react 12.5.0 | **@antv/x6 2.x** |
| 框架 | React 专用 | 框架无关 (用 x6-react-shape 集成 React) |
| 节点内容 | React component | JSX 模板 |
| API 风格 | 声明式 (props) | 命令式 (graph.addNode) |
| 业务对标 | 不同栈 (xyflow) | **同栈 (TapNow)** |
| 阿里生态 | 无 | ✅ 阿里 AntV |
| 文档 | 英文为主 | **中文为主** |

## 0.2 为什么换

1. **TapNow 同栈**: 业务对标 = 核心战略, 同栈 = 抄无障碍
2. **35+ 失败根因**: codex 抄 TapNow UI 时混了 x6 API 到 xyflow, 换栈根治
3. **阿里生态**: 你的 ECS/OSS/钉钉/飞书 全部阿里系, x6 阿里亲儿子
4. **国内 B 端**: 钉钉/飞书/简道云/ProcessOn 都用 x6, 顾家经销商接触的多半是 x6 风格
5. **中文文档/招聘**: 团队学习成本低, 招人容易

## 0.3 换栈成本 (用户已知, 不再考虑)

- v2 production (xyflow) 短期保留, 不动
- v4 dev 全部作废
- 重写 v5 用 @antv/x6, 1-2 周
- 团队学习 x6: 1 周

---

# Part 1: 需求侧 (重做版)

## 1.1 核心功能

### 1.1.1 无限画布
- 2D 平面, 自由拖动 + 自由缩放 (0.2x ~ 2x)
- 画布尺寸不封顶, 支持 100+ 节点, 1000+ 连线
- 节点位置 / 连线 / 缩放比例 自动持久化
- 支持多项目 (一个用户多个 projectId)

### 1.1.2 节点设计 (**4 节点, 不是 6 节点**)

**砍掉 2 个**: 顾家 6 节点版本里的 `merge` 和 `output` 节点本期不做 (v2 production 还在, 不删, 但 v5 不做).

| 节点 | 作用 | 关键能力 |
|------|------|---------|
| **text** (文案/诗) | 文字内容节点 | 文案生成, 品牌词, 广告词, 脚本, 诗 |
| **image** (图片/画布) | 图像节点 | 文生图, 图生图, 上传图, 参考图 |
| **video** (视频) | 视频节点 | 文生视频, 图生视频, 720p/1080p, 首尾帧, 参考帧 |
| **audio** (音频) | 音频节点 | 声音复刻, 自适应, 音乐生成 |

**⚠️ TBD 1**: "诗" 和 "画布" 是什么? 子类型还是独立节点?

### 1.1.3 节点状态 (5 态)
- **idle** (待运行): 默认态, 显示图标 + 标题
- **active** (选中): 显示 popover 操作面板
- **running** (生成中): 显示 shimmer 进度条 + 百分比
- **success** (完成): 显示产物
- **error** (失败): 显示错误信息 + 重试

### 1.1.4 节点能力
- 输入: 上传本地文件 (图/视频/音频)
- 输入: 上游节点的输出 (通过连线) — 自动流入
- 输出: 节点产物 (图/视频/音频) — 通过连线流出
- 操作: 重新生成 / 删除 / 复制 / 锁定 / 移动 / 编辑参数

**⚠️ TBD 2**: 节点 popover 具体操作项 (比例/模型/质量/重试/上传/删除/复制 等)

## 1.2 交互方式

### 1.2.1 画布操作
- **滚轮**: 缩放
- **中键拖拽** / **空格+左键拖拽**: 平移画布
- **左键拖拽节点**: 移动节点
- **左键拖拽 port**: 创建连线 (@antv/x6 用 `port`, 不是 `handle`)
- **左键点击节点**: 选中 (显示 popover)
- **左键点击空白**: 取消选中
- **Delete / Backspace**: 删除选中节点 / 连线
- **Esc**: 取消 popover / 取消拖拽
- **Ctrl+Z / Ctrl+Y**: 撤销 / 重做 (x6 有 `history` plugin)

### 1.2.2 连线 (连接线)
- **样式**: 商务蓝 `#6e8cd6`, 2px 粗, **带动画流动**, **箭头**
- **吸附**: 拖到目标 port 附近自动吸附 (x6 有 `snapline` plugin)
- **连线成功**: 立即可见, 立刻持久化
- **连线切断** (新需求): 切断功能 (右键 / 选中按 X / hover 显示按钮)

**⚠️ TBD 3**: 连线切断的具体交互方式

### 1.2.3 画布右上角控件
- 缩放控制: `+` / `−` / `1:1`
- 缩放比例显示: `100%`
- 撤销 / 重做
- 适配窗口 (zoom-to-fit)

### 1.2.4 画布左上角工具栏
- `+` 添加节点按钮
- 点击 `+` 弹出 4 节点类型选择菜单
- 选择后, 节点出现在画布中心

## 1.3 设计风格

- **裸图设计** (naked): 节点默认没有装饰, 只显示核心元素
- **Apple Dark Mode**: 极黑底 `#0a0a0b`, 商务灰阶
- **主色**: 商务蓝 `#6e8cd6`
- **字体**: SF Pro Display / PingFang SC
- **栅格**: 24px 基础
- **过渡**: 120ms ease
- **圆角**: 8px / 12px / 14px
- **去饱和**: B 端友好

## 1.4 API 与数据

### 1.4.1 API 连接 (不变, 已存在)
- `/api/canvas/run-image` ✅ (火山方舟 Seedream)
- `/api/canvas/run-video` ✅ (火山方舟视频)
- `/api/auth/me` ✅
- `/api/canvas/task-log` ⚠️ 待修

### 1.4.2 数据隔离 (多租户)
- 飞书 Bitable 按 `tenant_id` + `user_id` 分区
- localStorage key 包含 `tenantId` + `userId` + `projectId`
- middleware 注入 `x-tenant-id`

### 1.4.3 持久化 (要的效果, 不说做法)
- 画布状态: 自动保存, 用户刷新不丢
- 项目记录: 飞书 Bitable 远端备份
- 产物: 阿里云 OSS 独立存储
- 缩略图: Bitable 存 base64
- 同一张图只存一次 (去重)

### 1.4.4 真实积分
- 飞书 Bitable `credits_consumed` 字段
- 每次生成扣积分
- 余额准实时显示

## 1.5 补充 (历史扒出来的隐含需求)

### 1.5.1 鉴权
- 用户未登录: 跳转 /login
- session 失效: 静默重登
- 多账号隔离

### 1.5.2 合规 (B 端强制)
- **AI 内容强制标识** (网信办)
- **公域案例库 = TapTV 模式** (官方精选 + AI 水印 + 制作过程展示)
- **公域不开放用户上传视频**
- **公域无收款**
- **算法备案** (用户问题, 长期)

**⚠️ TBD 4**: TapTV 工作流导出格式 (JSON? Markdown?)
**⚠️ TBD 5**: 案例审核流程

### 1.5.3 部署 (不变)
- 开发: NAS 私域
- 生产: 阿里云 SWAS (47.96.128.172) + nginx
- 不用 vercel / ECS

### 1.5.4 备份 (不变)
- 每次 deploy 自动 backup
- 保留最近 1 次

### 1.5.5 性能 (要的效果)
- 拖动流畅, 不卡顿, 不白屏
- 大画布 (100+ 节点) 可用
- 缩略图用小图
- 用户感知不到"保存"动作

---

# Part 2: 技术栈 (新)

## 2.1 选 @antv/x6 的原因 (7 维度)

| 维度 | 评分 | 原因 |
|------|------|------|
| 业务对标 TapNow | ⭐⭐⭐⭐⭐ | 同栈, 抄无障碍 |
| 阿里生态 | ⭐⭐⭐⭐⭐ | 你的 ECS/OSS/钉钉/飞书 全部阿里 |
| 国内 B 端 | ⭐⭐⭐⭐⭐ | 钉钉/飞书/简道云都用 x6 |
| 阿里云 stack | ⭐⭐⭐⭐⭐ | 同集团 |
| 中文文档/社区 | ⭐⭐⭐⭐⭐ | 中文为主 |
| 商业升级路径 | ⭐⭐⭐⭐ | XFlow 商业版 |
| 团队招聘 | ⭐⭐⭐⭐ | 国内好招 (阿里系) |
| **总契合** | **35/35** | 完美契合大脉业务 |

## 2.2 @antv/x6 关键 API (重做时参考)

| 概念 | @antv/x6 | @xyflow/react (v4 旧) |
|------|----------|---------------------|
| 节点 | `graph.addNode({ shape, x, y, data })` | `<ReactFlow nodes={...} />` |
| 边 | `graph.addEdge({ source, target })` | `addEdge({...}, eds)` |
| 节点定义 | `Graph.registerNode('text', { ... })` | `<NodeTypes text={TextNode} />` |
| Port (handle) | `ports: [{ id, group, attrs }]` | `<Handle id="in" />` |
| 事件 | `node.on('click', e => {})` | `<Node onClick={...} />` |
| 状态 | `node.setData({...})` / `setAttr()` | `setNodes((nds) => ...)` |
| React 集成 | `x6-react-shape` 包 | 天然 |
| 缩放 | `graph.zoom(0.5)` / `graph.zoomToFit()` | `<Controls />` / `fitView` |
| 历史 | `history` plugin | 自实现 |

## 2.3 配套技术栈 (不变)

- **框架**: Next.js 14 App Router
- **UI**: 自写 CSS (不引第三方 UI 库, 减法)
- **状态**: React useState / useReducer (v5 也可用 Zustand 5, 看规模)
- **持久化**: localStorage + 飞书 Bitable + 阿里云 OSS
- **API**: Next.js API routes + 阿里云函数计算
- **鉴权**: NextAuth + 阿里云 SMS

## 2.4 关键 npm 依赖 (新增)

```json
{
  "@antv/x6": "^2.18.0",          // 核心
  "@antv/x6-react-shape": "^2.0", // React 节点集成
  "antd": "^5.x"                  // AntV 同生态, UI 可选
}
```

---

# Part 3: 风险与已踩坑

## 3.1 历史 35+ 次踩坑 (来源 v3/v4)

### 技术层 bug

| 坑 | 原因 | 影响 |
|----|------|------|
| **35+ 失败根因** | codex 抄 TapNow UI 时混 x6 API 到 xyflow | ⭐⭐⭐⭐⭐ |
| Handle className 不合并 (xyflow) | v12 行为变更 | ⭐⭐⭐ (新栈无关) |
| onConnect + onEdgesChange 冲突 (xyflow) | useEdgesState 时序 | ⭐⭐⭐ (新栈无关) |
| HMR + 浏览器 cache 假阳性 | 缓存不刷新 | ⭐⭐⭐ |
| task-log 路由 silent fail | import 缺失 | ⭐⭐ |
| devDeps 跟 next 14 冲突 | opennextjs 要 next 15+ | ⭐⭐ |
| DAMI_SESSION_SECRET dev-stub | hardcode secret | ⭐⭐ |
| deploy-to-ecs.sh 永久 bug | 容器/host 假设错 | ⭐⭐ |
| 本地 dev / 生产 ECS 行为不一致 | 环境差异 | ⭐⭐ |
| 30G 磁盘满风险 | backup 残留 | ⭐ |

### 流程层 反模式

| 反模式 | 次数 | 危害 |
|--------|------|------|
| 视觉参考混实现参考 (35+ 失败根因) | 无数 | ⭐⭐⭐⭐⭐ |
| CSS-only 调试 (没看 DOM) | 6+ | ⭐⭐⭐⭐ |
| codex 重写替代修一行 | 10+ | ⭐⭐⭐⭐ |
| 没有 minimal reference | 全部 | ⭐⭐⭐⭐ |
| 没有 state diff 调试 (没 console.log) | 20+ | ⭐⭐⭐⭐ |
| "完成" 不可信 | 6+ | ⭐⭐⭐⭐ |
| "画布严禁擅自动" 6+ 次违反 | 6+ | ⭐⭐⭐ |
| v2 成功的"为什么"丢了 | 全部 | ⭐⭐⭐ |
| "靠概率"是症状不是诊断 | 全部 | ⭐⭐⭐ |
| 没有 post-mortem 习惯 | 全部 | ⭐⭐⭐ |
| 多个 Agent 各自循环 | 全部 | ⭐⭐ |

### 业务层 (跟画布关系弱)

- B 端用户 IT 弱, 不能跳工具
- v2 production vulnerable (没版本测试)
- 内容侧未完成 (3 case + 5 hero + FAQ)

## 3.2 换栈后新风险 (v5 @antv/x6 特有)

### 风险 1: 团队 (我 + codex) 不熟 x6
- **症状**: 写代码时不知道 x6 怎么用, 反复查文档
- **预防**: 先 1 周学习, 写 x6 demo, 跑通最小 reference
- **应急**: 招 1 个用过 x6 的人, 1 天 onboarding

### 风险 2: x6-react-shape 集成坑
- **症状**: React 组件嵌入 x6 节点, props/state 不通
- **预防**: 先单独测 x6-react-shape, 确认 props 传递 + 重渲染
- **已知问题**: x6-react-shape 性能 (每次 React 渲染可能重画整个节点)

### 风险 3: x6 概念多, 学习曲线陡
- **症状**: codex 写代码时概念混 (Graph/Cell/Node/Port)
- **预防**: 写**禁用词清单** (新栈新清单, 不让 codex 用别的库的 API)
- **禁用词示例**:
  - ❌ `<Handle />` (xyflow 词)
  - ❌ `useNodesState` / `useEdgesState` (xyflow 词)
  - ❌ `onConnect` (xyflow 词, x6 用 `graph.on('edge:connected')`)
  - ❌ `<ReactFlow />` (xyflow 组件)
  - ✅ 用 `graph.addNode / addEdge / on(...)`

### 风险 4: x6 v2 → v3 major upgrade breaking
- **症状**: x6 2.x → 3.x 升级, API 大改
- **预防**: 锁版本, 不轻易升级
- **应急**: 升级前 fork 我们的 fork

### 风险 5: x6 性能 (大画布)
- **症状**: 100+ 节点 + 1000+ 连线, SVG 渲染卡
- **预防**: 必要时切到 Canvas 渲染 (`graph.options.renderer = 'canvas'`)
- **应急**: virtualization (只渲染视口内节点)

### 风险 6: x6 文档版本不一致
- **症状**: 中文文档可能滞后, 跟英文 / 实际 API 不一致
- **预防**: 优先看官方英文文档, 中文参考

### 风险 7: TapNow 业务模式参考 (新)
- **机会**: 跟 TapNow 同栈, 业务模式可借鉴
- **风险**: TapNow 是 Vue 2 老的, 不能直接 fork
- **预防**: 只参考业务流, 代码从零写

### 风险 8: 1.0 deadline 风险 (7-15)
- **现实**: 7-15 顾家 717 必交付, 1 周内不可能换栈完
- **方案**: 1.0 仍用 v2 production, v5 是 1.1 之后
- **决策**: 你拍

## 3.3 工作流纪律 (核心, 防再踩)

### 规则 1: 视觉/实现分离
- ✅ 可以给 codex 看 TapNow / 钉钉 / 简道云 截图, **只**参考视觉
- ❌ 禁止说"做这个" / "参考这个" (会触发错库知识)
- ✅ 明确说"用 @antv/x6 API, 不要用任何其他库"
- ✅ codex 写完, **grep 验证** (见规则 3)

### 规则 2: 改前必查
- 改之前, 列方案 + 风险 + 等拍板 (你 memory 6+ 横跳警告)
- 不擅自动 .tsx

### 规则 3: Grep Gate (新)
- codex 写完, 我跑 grep 验证**禁用词**:
  ```bash
  # x6 栈不能出现 xyflow 词
  grep -rE "@xyflow|reactflow|useNodesState|useEdgesState|onConnect|<Handle|<ReactFlow" lib/flow/ app/canvas-v5/
  # 任何匹配 = reject
  ```
- 通过才能 commit

### 规则 4: Minimal Reference
- 写 50 行最小画布 (2 节点 + 1 连线) 当黄金 reference
- 所有 v5 改动对照 reference 看 "有没有破坏"
- reference 写进 AGENTS.md

### 规则 5: 验证 Gate
- codex 说"完成" → 我**亲自验证** (不信任)
- 验证清单:
  - [ ] `npm run build` 过
  - [ ] 浏览器硬刷, 看到新 UI
  - [ ] console.log 验证事件 (mousedown, edge:connected)
  - [ ] 5+ 次拖线测试
  - [ ] 边缘 case (delete / select / multi-edge)
  - [ ] grep gate 过 (无禁用词)

### 规则 6: Post-Mortem
- 每次失败, **立刻**写 post-mortem (不积压)
- 写进 `state/CANVAS_FAILURES.md` (新建)
- 失败模式归档, 防止再踩

### 规则 7: 招人配合
- 招 1 个 3-5 年 React + x6 经验
- 1-2 周招到, 1 周 onboarding
- 跟 Hermes 协作 (招的人主导架构, codex 写重复代码, 我做 review)

---

# Part 4: 实施计划

## 4.1 阶段划分

### Phase 0: 学习 + 准备 (1 周)
- [ ] Hermes 读 @antv/x6 官方文档 (中文为主)
- [ ] codex 写 50 行 x6 demo (Hello World)
- [ ] 团队跑通 1 个最小 reference
- [ ] 写 `state/CODE_STYLE.md` (禁用词清单)
- [ ] 写 `state/CANVAS_FAILURES.md` (历史失败档案)

### Phase 1: 核心画布 (1-2 周)
- [ ] 创建 `app/canvas-v5/[id]/page.tsx`
- [ ] 创建 `app/canvas-v5/_reference/MinimalFlow.tsx` (50 行黄金 reference)
- [ ] 实现 4 节点 (text/image/video/audio) 基础渲染
- [ ] 实现连线 (port-to-port)
- [ ] 实现缩放/平移
- [ ] 实现选中 + popover

### Phase 2: 持久化 (1 周)
- [ ] localStorage 集成 (含 tenantId/userId/projectId)
- [ ] 飞书 Bitable 集成 (项目级)
- [ ] 阿里云 OSS 集成 (产物)
- [ ] 多租户隔离验证

### Phase 3: 真实 API (1 周)
- [ ] text 节点接 Ark-image (火山方舟 Seedream)
- [ ] image 节点接 run-image
- [ ] video 节点接 run-video (本期仍 mock)
- [ ] audio 节点接 run-audio (本期仍 mock)
- [ ] credits 扣减 + 显示

### Phase 4: 验收 (3 天)
- [ ] 端到端测试 (5 节点 + 5 连线, 拖线 + 缩放 + 持久化)
- [ ] 多租户测试 (2 个账号, 互不可见)
- [ ] 性能测试 (100 节点)
- [ ] 浏览器兼容 (Chrome/Safari/Edge)
- [ ] 移动端 (1 周内不做, 列入 v5.1)

### Phase 5: Deploy (1 天)
- [ ] tar + scp + npm build + pm2 restart
- [ ] 5 步验证 (per `damai-deploy-validate-prod-real`)
- [ ] 灰度发布 (10% 用户)
- [ ] 全量发布

## 4.2 验收标准 (Done Definition)

v5 算"work"必须满足:
- [ ] 4 节点都能添加 + 选中 + 删除
- [ ] 节点之间能拖线连接
- [ ] 连线能切断 (按设计交互)
- [ ] 画布能缩放 (0.2x ~ 2x)
- [ ] 画布能平移
- [ ] 撤销/重做 work
- [ ] localStorage 持久化 work (刷新不丢)
- [ ] 多租户隔离 work (2 账号互不可见)
- [ ] text 节点生成走真 API (火山方舟)
- [ ] credits 扣减 + 显示 work
- [ ] 100 节点不卡
- [ ] grep gate 0 命中 (无 xyflow 词)

**非 v5 范围** (v5.1+):
- 移动端
- 视频节点真 API
- 音频节点真 API
- AI 水印
- i18n

## 4.3 时间盒

- **理想**: 4 周出 v5 1.0
- **现实**: 5-6 周 (含学习 + 招人 onboarding)
- **7-15 deadline**: 1.0 用 v2 production, v5 是 1.1 之后

**v5 完成时间**: 2026-08-15 (1 个月后)

---

# Part 5: TBD 总览

| # | 待确认 | 影响 |
|---|--------|------|
| TBD 1 | "诗" 和 "画布" 是什么? 子类型还是独立节点? | 节点设计 |
| TBD 2 | 节点 popover 具体操作项 | 节点能力 |
| TBD 3 | 连线切断的具体交互方式 | 连线交互 |
| TBD 4 | TapTV 工作流导出格式 | 公域联动 |
| TBD 5 | 案例审核流程 | 公域内容 |
| TBD 6 | 1.0 用 v2 还是 v5 (7-15 deadline) | 时间盒 |
| TBD 7 | 招人预算 + 时间 | 实施计划 |

---

# Part 6: 收口

本文档包含:
- **Part 0**: 核心决策 (换栈到 @antv/x6)
- **Part 1**: 需求侧 (5 块, 6 个 TBD)
- **Part 2**: 技术栈 (新栈 + 配套 + 关键 npm)
- **Part 3**: 风险与已踩坑 (技术 10 + 流程 11 + 业务 3 + 新风险 8 + 工作流纪律 7)
- **Part 4**: 实施计划 (5 阶段 + 验收标准 + 时间盒)
- **Part 5**: TBD 总览 (7 个)

**不包含**: 任何"怎么写"的具体代码. 这部分是实施时由团队决策.
