# 大脉画布改动 — 危险警告 Checklist

> **目的**: 防止 07-01/07-02 那种"画布拖线 bug 改了好几天"的事再发生
> **触发**: 任何人 (Hermes / Codex / user) 改画布文件**前**必读
> **最后更新**: 2026-07-03 10:45 CST
> **维护**: 新增踩坑 → 加 §3, 改危险档位 → 改 §1, 删不再适用的 → 直接删

---

## 0. 一句话

**改画布 = 默认高风险**。React Flow v12 控制流 = 🚨 必报备, 自研混合架构 = ⚠️ 必 dev 验, 纯样式 = ✅ 默认处理。改后必跑 `scripts/test-canvas.sh` / `test-canvas.ps1`。

---

## 1. 改动前必查 (4 档危险)

### 🚨 极高危 — 触发"先停, 跟 user 报备"机制

- **改 React Flow v12 内部控制流** (`CanvasFlowEditor.tsx` / `CanvasFlowSandbox.tsx` 里 `onConnect` / `onEdgesChange` / `handleEdgesChange` / `connectionMode` / `connectionRadius` / `connectionLineComponent`)
  - **根因**: React Flow v12 controlled mode + edgeQueue 时序问题, 改一处触发别处
  - **历史**: 30+ commit 修复未果, 最后 07-02 走混合架构才解决
  - **正解**: 主框架保留 React Flow v12, **连接线/端口**替换为自研老画布移植 (`PortDot` / `ConnectionPath` / `SelfDrawnEdge` / `PendingLineOverlay`), **不要再加回 `connectionLineComponent`**

### ⚠️ 高危 — dev HMR 验证 + 跑测试脚本

- **改 SSR 相关** (`page.tsx` 里 `dynamic + ssr:false` / `dynamic(import('./...'), { ssr: false })`)
- **改节点 measured / localStorage 持久化**
  - localStorage 旧 measured 字段会让节点尺寸锁死 (07-01 user 卡 150x222)
  - save 必去 measured 字段 (`28a9e5a`)
- **改 fitViewOptions / viewport 重置** — 锁 scale(2) 触发 "Application error"
- **改 NodeScaffold helper** — 6 节点全用, 改了 6 节点 UI 都变
- **改 PortDot / ConnectionPath / SelfDrawnEdge** (混合架构核心)
  - 自研部分, 改错要回滚老画布 120KB (`CanvasEditor.old.tsx` 备份)

### 🟡 中危 — 改后必跑测试

- **改 Handle 热区 / 视觉** — mobile/desktop 命中范围差异 (07-01 16x16 → 20x20)
- **改 Edge 颜色 / strokeWidth / 箭头** — 视觉对比度影响拖线可读性
- **改节点 prompt textarea 字号** — 节点大小变化推离端口中心
- **改 Sandbox / Old 路由** (`app/sandbox/canvas/page.tsx` / `app/canvas/[id]/page.tsx`) — 路由改错 = 整个画布 404
- **改 NodeScaffold.tsx / ImageNode / TextNode / 等单节点 .tsx** — 节点行为连带变

### ✅ 低危 — 默认处理 (不必特殊流程)

- 改 AIInput / 主页 / Footer 等非画布组件 (`app/page.tsx`, `components/*`)
- 改后端 lib (`lib/oss.ts` / `lib/ark-image.ts` / `lib/sms.ts` / `lib/auth.ts`)
- 改 Bitable schema (`lib/bitable.ts`)
- 改 CSS module (`*.module.css`) — 视觉调整, 不影响逻辑

---

## 2. 改动后必跑 (5 分钟)

### 必跑脚本

```bash
# Windows 本机 (PowerShell 5.1)
cd Z:\damai\hermes-project
powershell.exe -ExecutionPolicy Bypass -File scripts/test-canvas.ps1

# NAS Linux (Bash)
cd /opt/data/projects/damai
bash scripts/test-canvas.sh

# (可选, 装 Playwright 后做交互测试)
npx playwright install chromium  # ~150MB, 一次性
bash scripts/test-canvas-interactive.sh
```

### 必验场景 (mobile + desktop 都过)

- [ ] 初始 6 节点 + 5 边渲染
- [ ] 拖线 image.output → image.input (desktop Chrome 07-01 bug 重灾区)
- [ ] 双击空白创建节点
- [ ] 节点拖动 / 多选 / 删除 (Backspace / Delete)
- [ ] i2i 跑通 (image → image 连线后 Run, 看 `[ark-image] i2i: inline N ref(s) as data URL`)

### deploy 前 5 件事

1. ✅ dev HMR 验证 OK (dev 3001 + cloudflared tunnel 自验)
2. ✅ mobile + desktop 全场景过 (上面 5 项)
3. ✅ `git diff` 看实际改动 (commit 前防误并, 06-29 教训)
4. ✅ `next build` 通过 (无 TS 错误, 无 OOM — ECS 仅 896Mi)
5. ✅ ECS `pm2 list` 看到新 PID

---

## 3. 踩过的坑 (核心 7 条 + 7 个 commit hash)

| # | 坑 | 症状 | 修法 (commit) |
|---|---|---|---|
| 1 | **React Flow v12 controlled mode 时序** | 拖完线消失, state 有 2 条 duplicate | `handleEdgesChange` filter `add/remove/replace`; **正解**走混合架构 (`77f9029`) |
| 2 | **SSR hydration 时序** | dev OK, prod `Application error` | `dynamic + ssr:false` (`6c3c2cd` page.tsx) + middleware 改后**重启 dev** |
| 3 | **localStorage 旧 measured 锁尺寸** | 节点卡 150x222 | save 去掉 measured 字段 (`28a9e5a`) |
| 4 | **viewport 锁 scale(2)** | `Application error` | 移除 fitView useEffect, 用 `defaultViewport` 或 `onInit setViewport` (待定) |
| 5 | **端口命中范围** | 节点变大端口被推离中心, 击中失败 | Handle 16x16 → 20x20 + `boxShadow` 蓝紫光晕 + `translateY(-50%)` (`3fcefd6`) |
| 6 | **ConnectionLine 视觉不可见** | 拖线过程看不到引导线 | stroke 灰白 0.35 → 蓝紫 0.55 + strokeWidth 2 → 2.5/3 + 起点圈 + 终点圆点 (`3fcefd6`) |
| 7 | **deploy OOM** | ECS 896Mi build SIGKILL | `pm2 stop` 释放 60M + `512M` heap + `NEXT_TELEMETRY_DISABLED=1` (`f49fbb0` deploy-to-ecs.sh) |

### 8. HMR stale 误判 (07-02 补充)

- **症状**: `/canvas/test` 404, 误以为代码错
- **真相**: HMR stale 状态, dev 重启后 200
- **修法**: **先 restart dev 再 debug** (`pkill -f next-server && nohup npm run dev > /tmp/next-dev.log 2>&1 &`)

### 9. cloudflared 端口不一致 (06-22)

- **症状**: 之前 dev 3000 → 3001 跳端口时, cloudflared 仍指 3000, 公网 URL 530
- **修法**: dev 跳端口时, **同步 kill + restart cloudflared**

### 10. SMB 编辑覆盖 Hermes patch (06-26 教训)

- **症状**: user 在 SMB 同时编辑 → 覆盖 Hermes 端 patch
- **修法**: 重要 patch 完成后立即 commit 锁住, 提醒 user **不要在 SMB 那边同时编辑同一文件**

---

## 4. 混合架构正解 (07-02 user 拍板)

任何"画布脱线 / 拖线难命中 / 边视觉消失"问题, **不要在 React Flow 内部瞎改**。正解:

```
保留 (React Flow v12 主框架):
- 节点渲染 + 6 节点类型 (text/image/video-gen/audio-gen/merge/output)
- useNodesState + useEdgesState
- localStorage 持久化 (key: damai:canvas-v2:[projectId]:nodes/edges)
- 双击空白创建节点
- 4 类操作 (拖拽 / 双击 / 右键 / 上下文菜单)

替换 (自研移植自 CanvasEditor.old.tsx):
- PortDot (左/右端口圆点视觉)
- ConnectionPath (cubic bezier 连接线)
- SelfDrawnEdge (持久边)
- PendingLineOverlay (拖线过程引导线)
- NodeInteractionContext (全局 window mousemove + findNearest)
- 删: onConnect / onConnectStart / onConnectEnd / handleEdgesChange / connectionLineComponent
```

详细移植见 `app/canvas/[id]/CanvasFlowEditor.tsx` (2532 行) + `app/sandbox/canvas/CanvasFlowSandbox.tsx` (1183 行)。

---

## 5. 引用

- `state/AGENT_MEMORY.md` §12 — 教训总览
- `state/HANDOFF-2026-07-02.md` §2 — 画布修复完整时间线
- `state/HANDOFF-2026-07-01-DRAG-FIX.md` — 拖线 bug 排查过程
- `state/HANDOFF-2026-07-01-REGRESSION-TEST.md` — 测试脚本设计
- `scripts/test-canvas.ps1` / `scripts/test-canvas.sh` — 必跑测试

---

**最后更新**: 2026-07-03 10:45 CST
**作者**: Hermes Agent + user (基于 07-01/07-02 血泪经验)
**触发**: 任何人改画布文件 (`app/canvas/[id]/*` + `app/sandbox/canvas/*` + `components/NodeScaffold.tsx`) 前必读