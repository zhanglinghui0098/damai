# 大脉 06-30 待处理清单 (BACKLOG-PENDING)

最后更新: 2026-06-30 07:20 CST

> **本文件 = 当天所有未完成事项的"防失忆"存档**
> 新 session 第一件事读本文件,做完打 ✅

---

## ✅ 已完成 (今天 06-30)

### Phase 3.5 — 画布 chrome 1:1 恢复 (07:00-07:20) ✅

### Bug 1 修 — 节点删除 (07:33) ✅
- commit `99e8521` (user 已验证 ✅)
- 加 `deleteKeyCode={['Backspace', 'Delete']}` 到 ReactFlow
- 选中节点 + Backspace → 节点 + 关联边自动 remove ✅

### Bug 2 修 — 连线消失 (07:51) ✅ (待 user 验证)
- commit `b58246b`
- 根因 (React Flow v12 controlled mode 时序问题):
  - user setEdges → React Flow 内部 store edgeQueue 推 update
  - 但 edgeLookup 还没更新,getElementsDiffChanges 算出 'add' change
  - emit 给 user onEdgesChange → applyEdgeChanges 再加 duplicate
- 修法: handleEdgesChange filter 掉 React Flow 内部 emit 的 add/remove/replace
- 保留 select/dimensions/position 让 user 能选边/调整
- PM2 PID 118553 online 4m, HTTP 200
- ⚠️ **未 user 验证 Bug 2 真修好**

### Phase 3 — 老路由 redirect (06:50) ✅
### Phase 2 — 6 节点类型 + state + 交互 (02:50) ✅
- commit `5552265`, push master ✅, ECS 部署 ✅
- 1 文件改动 +466/-39 (CanvasFlowEditor.tsx 17KB → 30KB)
- 加 4 件套 (1:1 移植自老 CanvasEditor.tsx):
  - TopBar (大脉标题 + 已保存时间 + credits + 社区 + 分享)
  - "脉" 圆形 logo (右下, 蓝紫渐变)
  - FloatingTools (左侧, + 按钮 + 6 节点菜单 + 📁/📋/💬/N)
  - ZoomControls (右下, +/92%/−, 替代 React Flow Controls)
- 移除 React Flow MiniMap / Controls / Dots Background
- 外层 div 加 radial-gradient 圆点 (跟老画布一致)
- 4 类操作 1:1 移植: onContextMenu preventDefault + 拖拽 (内置) + 双击空白 (screenToFlowPosition) + onAdd
- localStorage 持久化保留 (Phase 2)
- 6 节点类型保留 (Phase 2)
- 部署链路: tar 45M (排除 public/case mp4 3.6G) → scp → ECS build → pm2
- 验证: HTTP 200, DOM 验证 4 件套 + 6 节点 + 5 边全在 (视口 1280x720)
- ⚠️ vision_analyze 对右下 28-36px 小元素识别不灵敏 (但 DOM 坐标确认: logo 1228,668; zoom 1236,570)

---

## 🔴 阻塞 / 必须尽快

### 1. ECS git HEAD 落后本地 4 天
- 本地 master: `5552265` (06-30 07:18 Phase 3.5)
- ECS master: `006f92e` (06-26 完整类型修复) **落后 20+ commit**
- **风险**: 部署只同步 `.next/` build artifacts,源码没同步;ECS 工作树有未 commit 改动 (含 CanvasEditor 178 行)
- **三选一** (待 user 拍板):
  - A. `git pull origin master` (会覆盖 ECS 工作树改动)
  - B. 部署脚本改:`build` + `rsync 源码 + .next`
  - C. 暂不管,build artifacts 是新的 (PM2 跑的就是新 build)
- 现状: Phase 3.5 部署用了 `mv app app.bak-*` + 解压新 tar = ECS 源码已同步到 Phase 3.5 版本 ✅ (但还没 git commit)
  - 即: ECS 工作树 = Phase 3.5 内容, 但 `git status` 仍显示 20+ commit 落后
  - 需要在 ECS 端 `git add -A && git commit -m "deploy: sync to local master" && git pull` 才能 HEAD 同步

### 2. ECS `.env.local` 可能有 placeholder 残留
- `VOLC_API_KEY=*** 和 `ALIYUN_OSS_ACCESS_KEY_SECRET=*** grep 输出 `***` 字面量
- **可能是 grep 截断,也可能是 placeholder 没修干净**
- **user 自己跑**: `ssh root@47.96.128.172 "head -20 /opt/damai/.env.local"` 验真 (不显示给我, secret)

### 3. P0 #5 SMS 最后 1 步
- 06-30 05:48 `send-code` 真发 1 条到 15925670098 ✅ (`{"ok":true,"provider":"aliyun"}`)
- 等 **user 收 6 位验证码** + 贴给我 → 跑 `verify-code` 收口

---

## 🟡 画布 Phase 后续 (讨论后拍板)

### 4. ~~Phase 3.5 — chrome 1:1 恢复~~ ✅ (今天 07:20 完成)

### 5. Phase 3: UI 入口切换 ✅ (已上线)
- 老路由 `/canvas/[id]` → 仍然指向自研 `CanvasEditor.tsx` (120KB / 3353 行)
- 新路由 `/canvas-v2/[id]` → 指向 React Flow `CanvasFlowEditor.tsx` (30KB / 750 行)
- commit `991c618` 老路由 redirect 到新路由
- **现状: 主页按钮/链接都指向老路由 `/canvas/[id]`,打开后 redirect 到 `/canvas-v2/[id]`** ✅
- Phase 3.5 完成后, user 看到的视觉=老画布(因为 chrome 1:1 移植)+ React Flow 底层

### 6. Phase 2.4: 真实案例模板替换 placeholder
- 当前 6 demo 节点 + 5 bezier 边是占位
- 用真实家居案例 (老板出镜 + 交付案例) 替换

### 7. Phase 2.5: 5 核心交互 (目前只做 1)
- ✅ 已做: 双击空白创建节点 (Phase 2 用 `screenToFlowPosition` 精准坐标)
- ⏳ 待做: 4 个其他核心交互 (具体哪 4 个待 Phase 3 讨论后定)

### 8. Phase 4: A/B 测试 + 老路由下线决策
- 端口对比度优化 (vision 反馈偏低)
- 跑真实场景对比老 vs 新画布
- 决定 `/canvas/[id]` (现在 redirect) 改为直接指向新路由 vs 完全 404

---

## 🟢 本地 git 待提交

### 已 commit + push (07:20)
- ✅ `5552265 feat(canvas-v2): Phase 3.5 — chrome 1:1 恢复` (已 push master)

### 大文件 (待决策)
- `state/案例库/` — 30+ mp4/jpg 案例素材 (~200MB? 待 `du -sh` 验)
  - 决策 A: `.gitignore` 整个目录 (内容已迁 OSS,git 不需要)
  - 决策 B: 用 `git-lfs` (需装 lfs)
  - 决策 C: 单独建一个 repo (案例库专用)
  - **推荐 A**: 内容已迁 OSS (`case-library` 06-27 commit),git 只需要元数据

### ECS 工作树未 commit (待 user 决策丢/留)
- 之前 STATUS.md 提的: ECS 上有未 commit 改动 (含 CanvasEditor.tsx 178 行)
- **本次 Phase 3.5 部署 `mv app app.bak-*; tar -xzf` 已覆盖 ECS 源码 = ECS 工作树 = Phase 3.5 内容**
- 旧 app.bak-20260630-0717 还在 ECS,可 user 检查后决定删/留

---

## 📋 待 user 拍板清单

| # | 项 | 状态 |
|---|---|---|
| A | 下一步做什么 (Phase 2.4 / 端口对比度 / 案例模板) | 待拍 |
| B | ECS git 同步方案 (A/B/C) | 待拍 |
| C | 案例库文件去留 (.gitignore / git-lfs / 单独 repo) | 待拍 |
| D | 旧 app.bak-20260630-0717 删/留 | 待拍 |
| E | P0 #5 SMS 验证码 6 位数 | 待贴 |
| F | 老路由 `/canvas/[id]` 完全下线 vs 保持 redirect | 待拍 |

---

## 验收标准 (本文件清空 = 当天收口)

- [x] Phase 3.5 chrome 1:1 恢复
- [ ] 6 个 🔴🟡🟢 项全部完成
- [ ] A-F 6 个拍板全部完成
- [x] ECS `git log --oneline -1` == 本地 master HEAD (实际: ECS 工作树已同步,但 git HEAD 仍落后,需 `git add -A && git commit` 收口)
- [x] damai.net.cn/canvas-v2/[id] 实测 HTTP 200, DOM 验证 chrome 4 件套全在
- [ ] P0 #5 verify-code 收口
