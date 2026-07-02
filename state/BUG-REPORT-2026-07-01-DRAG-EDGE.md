# BUG REPORT — 大脉 Hermes 画布拖线 (desktop + mobile 持续 3 天)

> **报告人**: 大脉项目 owner (用户)
> **报告日期**: 2026-07-01
> **报告版本**: v1
> **严重度**: **P0** — 画布核心交互功能无法使用, 用户无法完成"拖节点连成视频流"的主流程
> **影响范围**: `/canvas/[id]` 路由 (React Flow v12 画布), desktop Chrome + mobile Safari/Chrome

---

## 0. TL;DR (10 秒看完)

画布**拖线 (handle 到 handle)** 这个核心交互**完全不能用**. 用户拖节点之间的连线后, **拖拽中的预览线看不到**, **松手后 edge 创建不出来**. 持续 3 天, 多个 AI agent 改了 30+ commit, **没修好**. 代码逻辑跟 UI 都改过, **怀疑是部署/构建/缓存层问题, 或者是 React Flow v12 本身的 deep bug**.

---

## 1. 症状 (用户看到的)

### 主症状

1. **拖拽中看不到连接线** — 从节点 A 的 + handle 拖到节点 B, 中间应该跟着鼠标的**虚线/候选线完全不可见**
2. **松手后 edge 不创建** — 拖到目标节点上松手, **没有连线生成**
3. **拖到节点上显示红线** — 拖拽过程中, 鼠标进入节点 body 范围时, 拖拽线变**红色** (React Flow 的 "invalid target" 视觉反馈)

### 环境差异

| 环境 | 症状 |
|------|------|
| Desktop Chrome | ❌ 完全不工作 |
| Mobile Safari / Chrome Android | 早期"OK", 但后期也报"线消失" |
| Firefox / Edge | 同 desktop Chrome |

### 复现步骤

1. 访问 `https://damai.net.cn/canvas/test` (任意 id)
2. 等待画布加载 (含 Loading canvas… 占位)
3. 双击空白 → 弹出节点菜单 → 添加 2 个节点 (Image / Video)
4. 拖 Image 节点右边 + 端口 → 拖到 Video 节点左边 + 端口
5. **期望**: 中间出现跟随鼠标的蓝色候选线, 松手后创建 connection
6. **实际**: 看不到候选线, 松手后无连接, 进入 body 范围时线变红

---

## 2. 已尝试的所有 commit (30+, 按时间倒序)

### 最近 7 个 fix commit (07-01 17:00 ~ 18:30, 都未真正修复)

| Commit | 改动 | 真因假设 | 结果 |
|--------|------|---------|------|
| `f723be6` | + left 端口 type=target | type 不对导致 drop target 识别错 | ❌ 未修复 |
| `c1a7adc` | snap handle pointerEvents=none | pointerEvents 拦截 mouse events 标 invalid | ❌ 未修复 |
| `2409976` | snap handle isConnectableEnd=false + initialNodes=[] | + 端口是唯一 drop target, 画布默认空 | ❌ 未修复 (顺带清掉 demo 节点 OK) |
| `35b6ce2` | + 端口 visibility (selected \|\| isBeingDraggedTo) + 蓝紫发光 | tapnow 风格 UX | ❌ 未修复 |
| `6c3c2cd` | page.tsx 加 next/dynamic + ssr:false | **SSR hydration mismatch** (理论上是 desktop 真因) | ❌ 未修复 |
| `54f64e8` | EDGE_STYLE 颜色 `rgba(255,255,255,0.55)` → `rgba(110,140,214,0.85)` | edge 对比度太低 | ❌ 未修复 |
| `6cba1ad` (doc) | STATUS 加 handoff 段 | 文档 | n/a |

### 中段 (07-01 05:30 ~ 06:50, 之前 1 个 session 的尝试)

| Commit | 改动 | 真因假设 | 结果 |
|--------|------|---------|------|
| `babe919` | 移除 fitView useEffect | runtime error | ❌ |
| `78724b2` | fitViewOptions + useEffect 强制 fitView | viewport scale 2x 锁住 | ❌ |
| `28a9e5a` | localStorage save strip measured | 旧 measured 缓存让节点尺寸错 | ❌ |
| `935a5b6` | NodeScaffold 加 useUpdateNodeInternals | 强制 React Flow 重测 | ❌ |
| `c1c7ad3` | NodeScaffold 加 minWidth + width fit-content | output 节点宽度 137px 溢出 | ❌ |
| `1edc043` | 同步 image UI 到 text/video/audio/merge/output | UI 统一 | n/a (UI) |
| `42b41bb` | image-snap handle pointerEvents 条件化 | 平时透传拖拽 | ❌ |
| `734b260` | image-snap handle borderRadius: 0 | React Flow Handle 默认 100% 圆角变椭圆 | ❌ |
| `fa0aa4c` | image-snap handle transform:none + 挡 self-loop | transform 推 handle 只剩左半 + 自连接 | ❌ |
| `7809276` | ImageNode 加 300x220 大隐形 Handle (image-snap) | 任意位置都能吸附 | 部分 OK (mobile) |
| `b8c5e7b` | + 端口 offset -28→-32 | 弹图外更明显 | n/a (UI) |
| `3530c26` | ImageNode v2 — 3 段布局 | 居中/加大/+ 端口弹图外 | n/a (UI) |
| `8d86e80` | 撤回 e71f315 诊断版, 恢复 ead8294 filter | mobile 验证线稳定 | ❌ (盲撤回, 没验证) |
| `7f368b0` | ImageNode 3 段独立 panel | UI 改进 | n/a (UI) |
| `e71f315` | handleEdgesChange 加 console.log (诊断版) | 看 React Flow 内部 emit 什么 | 诊断版被撤回 |

### 早期 (07-01 05:20, "Hermes session" 盲改)

| Commit | 改动 | 真因假设 | 结果 |
|--------|------|---------|------|
| `ead8294` | handleEdgesChange filter add/remove/replace | React Flow 内部 emit 'add' change 导致重复 edge | ❌ |
| `d9a06cc` | 删 image area 的 stopPropagation | 点图片要能选中节点 | n/a |
| `2b570e2` | ImageNode 拆 2 段 (图片区 + 操作台) | UI 拆分 | n/a (UI) |

---

## 3. ⚠️ 已知不工作 (KNOWN-NOT-WORKING) 清单

> 这部分**最重要**. 任何接手 agent / 真人**不要再走这些路**.

### ❌ 失败方案 A: handleEdgesChange filter React Flow 内部 emit 的 change

- **尝试**: `ead8294` + `e71f315` + `8d86e80` (撤回 + 恢复)
- **失败原因**: console 数据证明 desktop Chrome 上 handleEdgesChange **根本没收到 add/remove/replace change** (0 次 log). 整个"filter 内部 change"归因方向就是错的.
- **教训**: 没 console 数据就别 commit. mobile OK 不能代表 desktop OK.

### ❌ 失败方案 B: 改 EDGE_STYLE 颜色 / strokeWidth / visibility

- **尝试**: `54f64e8` 把 `rgba(255,255,255,0.55)` 改成 `rgba(110,140,214,0.85)`
- **失败原因**: console 数据证明 edge **确实在 DOM 里, CSS stroke 正常**. 颜色问题不是根因, 是"锦上添花".
- **教训**: F12 查询 path/style 的结果告诉你"视觉层 OK", 还看不到线 = 渲染层/状态层问题, 不是 CSS 问题.

### ❌ 失败方案 C: snap handle 加 transform: none / borderRadius: 0

- **尝试**: `734b260` `fa0aa4c` `42b41bb`
- **失败原因**: 解决了 snap handle 的"只覆盖图左半"问题 (mobile OK), 但 desktop 上拖拽中的**候选线**还是不显示. snap handle 是 drop target, 不是 candidate line.
- **教训**: snap handle 是"接收 drop"问题, candidate line 是"渲染跟随鼠标"问题, **两件事**.

### ❌ 失败方案 D: fitViewOptions / 强制重测尺寸 / strip measured

- **尝试**: `babe919` `78724b2` `28a9e5a` `935a5b6` `c1c7ad3`
- **失败原因**: 修了 viewport 2x 锁住 + 节点尺寸溢出问题, 但**不影响拖线**.
- **教训**: viewport/measured 是 canvas 初始化问题, 跟拖拽交互无关. 修了 ≠ 拖线好.

### ❌ 失败方案 E: 改 snap handle 的 isConnectableEnd + pointerEvents

- **尝试**: `2409976` (isConnectableEnd=false) + `c1a7adc` (pointerEvents=none) + `f723be6` (+ left 端口 type=target)
- **失败原因**: 让 + 端口成为唯一 drop target. 改了 3 次. **候选线还是看不到**, **edge 还是创建不出来**.
- **教训**: 改 drop target 不解决"看不到候选线"问题. 候选线是 source handle → mouse position 的连线, 跟 drop target 无关.

### ❌ 失败方案 F: SSR hydration mismatch 修复 (ssr:false)

- **尝试**: `6c3c2cd` `page.tsx` 加 `next/dynamic` + `ssr:false`
- **失败原因 (推测)**: 这是个**理论正确的修复** (React Flow v12 不原生支持 SSR), 但**用户实测还是看不到线**. 可能:
  - 部署没真生效 (BUILD_ID 没更新 / 浏览器 cache)
  - 这个修复对"edge 消失"有效, 但对"看不到候选线"无效 (这是另一个 bug)
- **教训**: SSR hydration 修复只解决了"已有 edge 消失"的问题, 没解决"拖拽中候选线不可见"的问题. **两个症状可能是两个独立 bug**, 之前归因成"一个 bug"是错的.

### ❌ 失败方案 G: 改 + 端口 visibility / glow

- **尝试**: `35b6ce2`
- **失败原因**: 改了 + 端口在 selected || isBeingDraggedTo 时显示 + 蓝紫发光, 但**不影响拖拽交互**.
- **教训**: 这是纯视觉增强, 跟拖线功能正交.

---

## 4. 🔍 还没诊断的事 (UNKNOWN, 但可能是真因)

### UNKNOWN 1: 部署是否真生效

**没验证过**:
- 生产 `damai.net.cn` 服务的 `.next/BUILD_ID` 是否跟 git HEAD 一致
- 浏览器拿到的 main bundle hash 是否最新 commit
- 浏览器 cache 是否拦截了新 bundle
- localStorage 是否保存了**带 bug 的旧 state**, 干扰新代码

**为什么这是关键**: 30+ commit 改的都是代码, 但如果**生产没真收到这些代码**, 那改什么都没用. 之前 user 测试一直说"不好", 但**没有 1 次确认过 BUILD_ID 是否对**.

### UNKNOWN 2: React Flow v12.11.1 自身是否有 bug

**没查过**:
- React Flow GitHub issues 搜 "drag connection line not showing"
- React Flow v12.13+ 是否修了相关 issue
- `@xyflow/react@^12.11.1` 是否跟你的 Next.js 14.2.35 兼容

**为什么这是关键**: 当前版本是 `@xyflow/react@^12.11.1`, 最新 stable 是 v12.13+. 1 个 minor 版本里可能就 fix 了你的问题. 之前 7 个 fix 都没动 package.json.

### UNKNOWN 3: OpenNext + Cloudflare 的影响

**没查过**:
- `@opennextjs/cloudflare@^1.19.11` 跟 next/dynamic 的 ssr:false 兼容
- OpenNext 构建跟标准 next build 行为差异
- 部署到 ECS (不是 Cloudflare Workers), 但 package.json 里有 opennext 依赖, 是否影响 hydration 行为

**为什么这是关键**: 项目同时支持 Cloudflare Workers 和 ECS 部署, 但实际只在 ECS 跑. OpenNext 的存在可能影响 SSR 行为, 但没 agent 深入查过.

### UNKNOWN 4: 浏览器开发者工具的具体报错

**没收集过** (在症状出现时):
- F12 Console 完整 log (尤其 React Flow 内部 warning/error)
- F12 Network 是否有 4xx/5xx
- React DevTools 看 CanvasFlowEditor 的 component tree 状态
- 在隐身窗口 (无 cache + 无 localStorage) 的行为

**为什么这是关键**: 用户之前用 AI agent 跑过 console 数据, 但都是**测试成功路径** (onConnect log, edge count 等). 失败路径 (拖拽中 React Flow 内部 state) **没仔细看过**.

---

## 5. 🎯 推荐下一步 (按优先级, **不要改代码先做这些**)

### P0 (立刻, 今晚)

1. **验证部署生效**: `curl -s https://damai.net.cn | grep BUILD_ID` 对比 `ssh root@47.96.128.172 "cat /opt/damai/.next/BUILD_ID"`. 不一样 = 部署失败.
2. **隐身窗口测试**: `Ctrl+Shift+N` 打开无 cache + 无 localStorage 的窗口, 拉线. 能连 = localStorage 问题; 不能连 = 代码问题.
3. **Ctrl+Shift+R 强刷 + 仔细看 console**: 拖拽时 console 完整 log, 尤其 React Flow 内部 warning.

### P1 (明天)

4. **React Flow GitHub issues 搜**: `https://github.com/xyflow/xyflow/issues` 搜 "drag line not showing" / "candidate connection invisible"
5. **React Flow 升级测试**: `pnpm add @xyflow/react@^12.13.0` 看是否修
6. **找真人**: 公司前端工程师 30 分钟看, 比 AI 强 (尤其是 React DevTools 看 component tree)

### P2 (本周)

7. **git bisect**: `git bisect start HEAD HEAD~30` 二分找"哪个 commit 引入拖线不工作"
8. **临时降级方案**: feature flag 关闭画布的 React Flow, 退回老的自研 CanvasEditor (`CanvasEditor.tsx.bak-xxx` 还有备份). 让用户能用, 之后再修.
9. **降级 React Flow 到 v11**: v11 跟 Next.js SSR 兼容性更好, 可能跳过整个 SSR hydration 问题.

---

## 6. 环境信息 (tech stack)

```
Node: (unknown, 需要 user 提供)
Next.js: 14.2.35
React: 18
@xyflow/react: ^12.11.1 (最新 stable 是 12.13+)
@opennextjs/cloudflare: ^1.19.11 (有 Cloudflare 部署能力, 但 ECS 不需要)
部署: ECS 47.96.128.172:/opt/damai/, pm2 896Mi SWAS
生产 URL: https://damai.net.cn
canvas 路由: /canvas/[id]
localStorage key: damai:canvas-v2:r2:${projectId}
```

---

## 7. ⚠️ 不要做的 (PITFALLS)

1. **不要加新 commit 试错**. 30+ commit 都没修, 第 31 个大概率也不好.
2. **不要相信"再看一眼代码我能 fix"**. 看了 N 遍了, 信息不足.
3. **不要相信"我猜可能是 X"**. 猜了 30+ 次了, 没一次对.
4. **不要相信 AI 能修**. 多模型试过, 不是能力问题, 是信息问题.
5. **不要回退 commit**. 当前 `f723be6` HEAD 是"最完整尝试", 回退到任何一个老 commit 都会**去掉 mobile 上刚修好的部分**.

---

## 8. Handoff checklist (给下个 agent / 真人)

接手这个 bug 的人, **按顺序做**:

- [ ] **读本文档** (你正在读)
- [ ] 读 `state/HANDOFF-2026-07-01-DESKTOP-BUG.md` (更老但更系统的 handoff)
- [ ] 读 `state/HANDOFF-2026-07-01-REGRESSION-TEST.md` (回归测试 handoff)
- [ ] **先做 P0 诊断** (不写代码)
- [ ] 看 console log (拖拽失败时 React Flow 内部 warning)
- [ ] 看 React DevTools (CanvasFlowEditor component tree 状态)
- [ ] 用隐身窗口 + 强刷复现
- [ ] 搜索 React Flow GitHub issues
- [ ] **找真人** (公司前端)

---

## 9. 元数据

- **报告 commit**: HEAD `f723be6`
- **报告创建**: 2026-07-01 (手动, 整合 3 天调试)
- **作者**: 用户 + 多 AI agent 协作
- **后续更新**: 每 24h 一次, 直到 bug 修好
- **附件**: `git log --since="2026-07-01" --stat` 输出, `.bak-xxx` 文件列表 (见 working copy)