# 大脉 画布 V4 迁移 Plan (2026-07-12 起)

> **用户拍板**: 5 决策已确认, 详见 STATUS.md 时区管理. **未拍板前任何 code 改动 = 越界**.
>
> **不擅自动 .tsx** (memory: "画布 6+ 横跳血泪, 动前必须先提醒 + 列方案 + 风险 + 等拍板").

---

## 0. 现状 (2026-07-12 17:52 CST verified)

### v4 完整 src 已被找到
```
/opt/data/projects/damai/codex-deliveries/src/  (17 个 file)
├── App.tsx                     205 B
├── main.tsx                    378 B
├── styles.css                  26 KB  (4 KB 未 minified)
├── api/mockGenerate.ts
└── flow/
    ├── FlowCanvas.tsx          (主画布, /canvas-v4 这里迁)
    ├── FlowCanvas.tsx.bak-20260712001553
    ├── FloatingTools.tsx
    ├── NodePopover.tsx         (8758 B — popover 操作面板)
    ├── ZoomControls.tsx
    ├── types.ts                (NodeKind = "text" | "image" | "video" | "audio")
    ├── useNodeUpdater.ts
    ├── useUpstream.ts
    └── nodes/
        ├── BaseNode.tsx        (naked 设计底盘)
        ├── TextNode.tsx        ⭐ 文本节点 (脚本/广告词/品牌文案)
        ├── ImageNode.tsx       ⭐ 图片节点 (文生图/图生图)
        ├── VideoNode.tsx       ⭐ 视频节点 (图生视频/文生视频, 720p/1080p/首尾帧/参考)
        ├── AudioNode.tsx       ⭐ 音频节点 (声音复刻/自适应/音乐)
        └── index.ts
```

### 已存在的真 API 基础
- ✅ commit `c491b4e` (7-11 张凌辉): `/api/canvas/run-image/route.ts` — 火山方舟 Seedream
- ✅ commit `058ed02`: ImageNode i2i 数据流 (上游 url → referenceUrls)
- ✅ commit `b214eee`: OSS 备份 + run-image + lib/oss
- ✅ commit `9b4fbd6`: middleware `/canvas-v2/` → `/canvas-v2/index.html` SPA rewrite
- ✅ 飞书 Bitable `14_table_canvas_task_log.credits消耗` 字段已现成

### 老 production 现状 (6+ 横跳血泪活物证)
```
app/canvas/[id]/
├── CanvasFlowEditor.tsx                          ← 当前 production
├── CanvasEditor.tsx.ok-pre-tapnow              ← 7-09 锚点
├── CanvasFlowEditor.tsx.bak-20260702-before-self-drawn
├── CanvasEditor.tsx.ok-pre-view
├── CanvasEditor.tsx.bak-0623
├── CanvasEditor.old.tsx
├── CanvasEditor.tsx.bak-2026-06-26-i2i-fix
├── CanvasEditor.tsx.bak-shortfix
├── CanvasEditor.tsx.v3-corrupted              ← 10 个 bak!
└── page.tsx.bak-0623
```

---

## 1. 5 决策 (user 7-12 拍板)

| # | 决策 | 选项选 |
|---|---|---|
| Q1 | v4 src 路径 | A 用户给的 `codex-deliveries/src/` (已确认) |
| Q2 | 路由策略 | **B** 新建 `/canvas-v4/[id]/` 路由, 老 `/canvas/[id]/` 保留 |
| Q3 | API 接法 | **B** 先接 text/image (commit c491b4e 已建), video/audio 继续 mock |
| Q4 | 积分读法 | **A** SSR + cache 30s (Bitable 现成 schema) |
| Q5 | 回滚 | **新路由天然回滚** — 翻车删路由 + middleware |

---

## 2. Phase 拆解

### Phase 0 — Plan + 拍板 (今天, 1h)
- [x] 写 `state/MIGRATION_PLAN_V4.md` (本文)
- [x] UPDATE `state/STATUS.md` 7-12 v4 迁移记录
- [ ] UPDATE `state/AGENT_MEMORY.md` 7-12 视角
- [ ] 提交 + 推 master
- [ ] **拍板 Phase 1 详细 scope** 等 user

### Phase 1 — UI 组件桥接到生产 (1-3 day) ⭐ 主战场
- [ ] 创建 `app/canvas-v4/[id]/page.tsx` (路由入口, q2=B)
- [ ] 创建 `app/canvas-v4/[id]/components/canvas/` 目录
- [ ] 拷贝 `src/flow/FlowCanvas.tsx` → 生产 (改 import paths)
- [ ] 拷贝 `src/flow/nodes/{Text,Image,Video,Audio,Base}Node.tsx`
- [ ] 拷贝 `src/flow/NodePopover.tsx` (8758 B)
- [ ] 拷贝 `src/flow/{FloatingTools,ZoomControls}.tsx`
- [ ] 拷贝 `src/flow/types.ts` `useNodeUpdater.ts` `useUpstream.ts`
- [ ] 拷贝 `src/styles.css` → `globals.css` 或 module CSS (适配 Next.js)
- [ ] 4 NODE_KIND 注册: text/image/video/audio (per types.ts)
- [ ] NodePopover props 接 onRun/onChange/onUpload/onClose (生产 caller)
- [ ] 保留 v4: glass-morphism, --accent #6e8cd6, 24px grid, dm-popover-* className

### Phase 2 — 生产能力接入 (1-2 day)
- [ ] localStorage key 改: `damai.canvas.${tenantId}.${userId}.${projectId}.v1`
- [ ] FlowCanvas.tsx 改 STORAGE_KEY 为 dynamic, init 时从 cookie/user 读 tenantId/userId
- [ ] **ImageNode (text mode) → POST /api/canvas/run-image** (已有, commit c491b4e)
- [ ] client `useRunNode.ts` 调用 `/api/canvas/run-image`, 处理:
  - 200 → 写 `data.output.src` + status=success
  - 401 → redirect `/login`
  - 4xx/5xx → fallback mock + display error toast
- [ ] **VideoNode + AudioNode → 继续 mock** (Q3=B)
- [ ] 老画布 `/canvas/[id]/` 不动 (并存期)

### Phase 3 — 真积分显示 (半天)
- [ ] 新建 `lib/credits.ts` (Bitable client, SSR fetch)
  - `getCurrentUserCredits(tenantId, userId)` → current balance
  - `getTaskCredits(taskId)` → per-task used
- [ ] `react.cache()` wrap + 30s cache
- [ ] Topbar 新组件 `<CreditsBadge>` 显示 "可用 X 云豆"
- [ ] NodePopover 注入 credits (用 v4 已有 `dm-popover-credits` className)
- [ ] task 完成 → update `14_table_canvas_task_log.credits_used` 字段
- [ ] credits 不够时 → topbar 红 badge + 阻止生成

### Phase 4 — 部署 (半天)
- [ ] dev NAS: `http://localhost:3000/canvas-v4/test-001` 看 UI
- [ ] 验证: 4 kinds node + 文本/图片接真 API + 视频/音频 mock + 积分显示
- [ ] ECS deploy (scripts/deploy-to-ecs.sh)
- [ ] 公网 URL: `https://47.96.128.172/canvas-v4/test-001`
- [ ] **回滚锚**: Phase 5 之前 `app/canvas-v4/` 整个目录删除 = 0 影响

### Phase 5 — Cleanup (1 周后, 等稳定)
- [ ] 删 `app/canvas/[id]/` 老 bak 文件 (10 个) — 6+ 横跳血泪技术债
- [ ] 删 `/canvas-v2` 静态 SPA (sandbox 完成使命)
- [ ] 删 `app/sandbox/canvas-v3` (sandbox)
- [ ] ECS 升配 4G (公测 100 并发需要)

---

## 3. Agent 分工 (per memory "双轨")

| 谁 | 干 |
|---|---|
| **Codex/Workbody (Windows, Z: drive)** | Phase 1 全部 (UI 重写 + 桥接 + styles.css 适配 Next.js) |
| **Hermes (NAS, this container)** | Phase 0 (plan + STATE.md + AGENT_MEMORY.md) + Phase 2 (API 路由 + lib/credits.ts) + Phase 4 (deploy + 监控) + Phase 5 (cleanup) |
| **user** | 决策 + UI 验收 + test 拍板 |

不擅自动红线: **任何 Phase 开始前 user 拍板 phase 详细 scope**.

---

## 4. 风险

| # | 风险 | 缓解 |
|---|---|---|
| R1 | 老 CanvasEditor.tsx 87KB 重写风险太高 | Q2=B 新路由零干扰 |
| R2 | v4 src styles.css 26KB vs dist 36KB, 中间是 minified | 优先从 src 适配到 Next.js globals.css / module.css |
| R3 | localStorage 老 key 升级 → 老 user 节点数据丢失 | Phase 1 加 migration: 读老 key → migrate → 删老 |
| R4 | middleware x-tenant-id 注入让老 /canvas/[id]/ 行为不一致 | 老 route 不动, 新 route 自己接 header |
| R5 | 6+ 横跳血泪的 .tsx 87KB 单文件 inline style | 新 route 用 module CSS + 拆 component |
| R6 | v4 src 部署链路: codex 怎么把 src 同步 NAS? | user 自己上传 NAS (Z: drive → 4T 池子映射), Hermes 不 cp |

---

## 5. 拍板点清单 (Phase 0 之后 Phase 1 开始前)

| # | 等 user 拍板 |
|---|---|
| 1 | Phase 1 detail scope 拍板: Codex 做 vs Hermes 做 vs 各做哪些 |
| 2 | Phase 1.5 老 localStorage data migration 策略 (能否丢老数据) |
| 3 | Phase 2 真 API auth 集成: cookie 自动 vs user 显式输入 token |
| 4 | Phase 3 积分耗尽时 UX: 阻止 button vs 提示 + 链接到 /credits |
| 5 | Phase 4 上线时机: 立刻全量 vs 先开 1-2 个账号白名单 (07-15 公测前) |

---

**STATUS**: Phase 0 写 plan doc + commit; 后续 phase 等 user 逐个拍板 + 启动.
**最后更新**: 2026-07-12 17:52 CST
**维护人**: Hermes Agent
