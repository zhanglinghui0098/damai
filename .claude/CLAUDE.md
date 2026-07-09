# 大脉 Hermes — Claude Code 项目规则

> 写给所有 Claude Code agent (跟用户对话的 AI). 用户授权使用的项目规则.

---

## 🔒 P0 锁住的: 画布核心 (拖线 / 节点 / save)

**禁止直接修改以下文件** (除非用户**明确**拍板):

```
app/canvas/[id]/CanvasFlowEditor.tsx       # 画布主组件 (含 onConnect, Handle, save, load)
app/canvas/[id]/CanvasFlowEditor.module.css # 画布样式
app/sandbox/canvas/CanvasFlowSandbox.tsx  # React Flow 原生 sandbox (cp backup 后稳)
app/sandbox/canvas/CanvasFlowSandbox.module.css
app/sandbox/tldraw/CanvasFlowTldraw.tsx   # tldraw 阶段 1 验证 demo
app/sandbox/canvas-v3/*                   # 07-08 自研 v3 (SVG + state 自管) — Hermes 决定重做
app/canvas/v2/CanvasFlowV2.tsx            # 07-09 全新干净版 (React Flow v12.11 锁版本, 不引用任何老代码)
app/canvas/v2/CanvasFlowV2.module.css      # v2 样式
```

### 2026-07-09 v2 决策记录 (重要)

**新加 `/canvas/v2` 干净版** (commit 在你 push 后). 理由:
- 5 天踩坑根因 = 自研画布底座不稳 (77f9029 + v3 两次)
- React Flow v12 是行业标准 (Langflow / Flowise / Dify 在用)
- v2 是 1 周前 cp backup `8569554` 的**新文件**重写, **0 老代码引用** (全干净, 不受 5 天踩坑污染)
- v2 锁版本到 `v12.11.0`, 严守画布核心不动原则
- 旧路由 (`/sandbox/canvas` `/sandbox/canvas-v3` `/sandbox/tldraw` `/canvas/[id]`) **全部保留**当 fallback
- 公测期 1 周 (07-10 ~ 07-14), v2 为主, 旧路由兜底

**严守 (v2 跟其他画布同样)**:
- `<Handle>` `isConnectableStart/End` 一字不改 (5 天踩坑元凶)
- `onConnect` 用 React Flow 自带, 不自研 store
- 不引入 PortDot / ConnectionPath / SelfDrawnEdge (砍的 5 个方案)
- 不引入 tldraw / Konva (whiteboard 方向错 / Canvas 底层 2000 行)
- localStorage key 隔离 (`damai:canvas-v2:r2:v2:*`, 跟其他画布不冲突)

### 画布核心包含 (不动):
- `onConnect` (拖线创建 edge)
- `<Handle>` (端口, 圆圈 + "+" 文字)
- `connectionLineComponent` (候选线)
- `useConnection` (拖线状态)
- `saveToApi` / `loadFromApi` (跟生产 API 同步)
- `useUpstreamUrls` (i2i 自动检测)
- `useStore` (拿 store 里的 nodes / edges)

### 为什么锁住:
- 2026-07-02 commit `77f9029` 砍了 React Flow 自带连接, 用自研 PortDot + SelfDrawnEdge + PendingLineOverlay
  → 大重构, dev 跑了一下就 commit, 没充分测
  → 5 天后 production 拖线仍坏 ("连上就断")
  → 回滚 commit `8569554` 才修
- 2026-07-08 user 决定推倒 React Flow + tldraw, **完全自研** v3
  → 同样风险: 自研画布底座 = 5 天 bug 覆辙风险
  → 所以**也锁住** (CLAUDE.md 是双向保险, 跟 user 决定冲突时, 锁是底线)

### ⚠️ 2026-07-08 v3 自研警告

user 决定推倒 React Flow + tldraw, 完全自研 v3 (`app/sandbox/canvas-v3/`).

**这是高风险决策**, 5 天踩坑就是因为自研画布底座不稳. 这次自研要**严守**:
- 严守 5 天踩坑教训 (SSR / localStorage 旧 measured / 端口命中范围 / viewport 锁)
- **只**用 SVG + React state 自管 (避开 React Flow controlled mode)
- **不自研** viewport (用 tldraw 或 Konva, 不自己写 zoom/pan)
- **不自研** 拖线 (用 SVG mouse event + 60px 距离判定, 不自创连接 store)
- 5 个验收项 (brief Part 5): 6 节点 + i2i + localStorage + RunButton + 主页入口
- 严守 e2e: 改任何 v3 代码前 `npm run e2e`, 失败不允许 commit
- 严守 deploy: deploy 脚本加 backup + smoke + 回滚 (commit 94e4a54)
- 严守监控: 部署 ARMS 监控 (5 天没上, commit 677cc40+9b17608+2c9fff1+9426409)

### 可以改的 (UI / op-panel / 数据流):
- 节点 op-panel (ModelChip / ChipRow / RunButton / NodeTextarea) — 微调
- NodeScaffold 视觉 (top / main / bottom section 布局) — 微调
- ai 调用 (run-image / run-video API) — 接新的 AI model
- 数据持久化 (save 频率 / 字段) — 加新字段可以, 改 save 逻辑需要拍板

---

## 🚀 部署流程

### 日常改动:
1. 改完代码 → `npm run build` 验证不破坏现有路由 (23 routes, /canvas/[id] 1.33 kB 不能再大)
2. **不要** 直接 `git push + bash deploy-to-ecs.sh` 一气呵成
3. 跟用户拍板 → 用户自己 push + 部署 (有 ECS 凭据, agent 没)

### deploy-to-ecs.sh 假设 (用户自己改):
- 在 NAS docker container 里跑
- `ECS="root@47.96.128.172"` + `ECS_PASS="<password>"`
- 打包源码 + 传输 + 解压 + npm install + build + pm2 restart

### ⚠️ 5 天没 deploy 教训:
- sentry/ARMS commit `677cc40` + `9b17608` + `2c9fff1` + `9426409` 在 git 但 production 没上
- 出问题 user 眼睛看, 没 trace
- 公测前必须部署 ARMS 监控

---

## 📊 公测前必做 (4 件事)

### P0 (1 天):
- [x] 画布核心恢复 React Flow 原生 (commit 8569554)
- [ ] 部署 sentry/ARMS 监控 (4 个 commit 一起 deploy)
- [ ] 写 .claude/CLAUDE.md 锁画布 (本文档)

### P1 (1 周):
- [ ] deploy-to-ecs.sh 加备份 + 失败回滚
- [ ] 写 Playwright e2e (拖线 / 加节点 / save / load)
- [ ] staging 环境 (改完先上 staging 跑 e2e)

### P2 (2 周):
- [ ] feature flag (画布重大改动走 flag, 出问题立即关)
- [ ] 画布单测覆盖

---

## ⚠️ 不要做的

1. **不要直接改画布核心** (见上) — 95% 的 bug 来源
2. **不要在没 build 验证前 commit** — 至少 `npm run build` 看到 23 routes
3. **不要在没 user 拍板前 push + deploy** — user 自己有 ECS 凭据
4. **不要把 Sentry / OpenNext / 监控 跟画布改动混在一起 commit** — 分开 commit, 单独 push
5. **不要相信"我猜可能是 X"** — 多猜 30+ 次没修, 看代码 / 跑测试

---

## 🎯 跟用户对话节奏 (从这次学到的)

1. 改任何生产代码前: **先看 git log + git status**, 不要瞎改
2. 改完: **先 build 验证**, 再 commit
3. commit message: 写清楚 "为什么改" + "commit chain" (77f9029 → 8569554), 不要只写 "fix"
4. push + deploy 是**用户的事**, agent 只准备 code
5. 出问题: **5 张 git 截图** (log / diff / status / show / blame), 不要猜
6. 一次 1 个 commit, 不要混合多个 fix (commit 链才清楚)
