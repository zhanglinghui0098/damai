# 大脉 06-30 待处理清单 (BACKLOG-PENDING)

最后更新: 2026-06-30 05:55 CST

> **本文件 = 当天所有未完成事项的"防失忆"存档**
> 新 session 第一件事读本文件,做完打 ✅

---

## 🔴 阻塞 / 必须尽快

### 1. ECS git HEAD 落后本地 4 天
- 本地 master: `baa771d` (06-30 02:50 Phase 2 done)
- ECS master: `006f92e` (06-26 完整类型修复) **落后 12+ commit**
- **风险**: 部署只同步 `.next/` build artifacts,源码没同步;ECS 工作树有未 commit 改动 (含 CanvasEditor 178 行)
- **三选一** (待 user 拍板):
  - A. `git pull origin master` (会覆盖 ECS 工作树改动)
  - B. 部署脚本改:`build` + `rsync 源码 + .next`
  - C. 暂不管,build artifacts 是新的 (PM2 跑的就是新 build)

### 2. ECS `.env.local` 可能有 placeholder 残留
- `VOLC_API_KEY=***` 和 `ALIYUN_OSS_ACCESS_KEY_SECRET=***` grep 输出 `***` 字面量
- **可能是 grep 截断,也可能是 placeholder 没修干净**
- **user 自己跑**: `ssh root@47.96.128.172 "head -20 /opt/damai/.env.local"` 验真 (不显示给我, secret)

### 3. P0 #5 SMS 最后 1 步
- 06-30 05:48 `send-code` 真发 1 条到 15925670098 ✅ (`{"ok":true,"provider":"aliyun"}`)
- 等 **user 收 6 位验证码** + 贴给我 → 跑 `verify-code` 收口

---

## 🟡 画布 Phase 3-4 (讨论后拍板)

### 4. **Phase 3.5 — chrome 1:1 恢复 (用户反馈越权)** ⚠️ 紧急
- 详见 `state/PLAN-CHROME-RESTORE-06-30.md` (5 步方案 + 验收 checklist)
- 恢复: TopBar / "脉" logo / FloatingTools + 4 类操作 (contextmenu / 空白 / 拖拽 / onAdd)
- 移除: React Flow MiniMap / Controls / Dots background
- **当前 session call 超限,下次新 session 执行** (06-30 06:55 已存档 PLAN)

### 5. Phase 3: UI 入口切换 ✅ (已上线)
- 老路由 `/canvas/[id]` → 仍然指向自研 `CanvasEditor.tsx` (120KB / 3353 行)
- 新路由 `/canvas-v2/[id]` → 指向 React Flow `CanvasFlowEditor.tsx` (17KB / 493 行)
- **主页按钮/链接都指向老路由**,所以 user 打开还是老版本
- 需要:主页加切换入口 / 把按钮改到新路由 / 或加 toggle

### 5. Phase 2.4: 真实案例模板替换 placeholder
- 当前 6 demo 节点 + 5 bezier 边是占位
- 用真实家居案例 (老板出镜 + 交付案例) 替换

### 6. Phase 2.5: 5 核心交互 (目前只做 1)
- ✅ 已做: 双击空白创建节点
- ⏳ 待做: 4 个其他核心交互 (具体哪 4 个待 Phase 3 讨论后定)

### 7. Phase 4: A/B 测试 + 老路由下线决策
- 端口对比度优化 (vision 反馈偏低)
- 跑真实场景对比老 vs 新画布
- 决定 `/canvas/[id]` 下线时间

---

## 🟢 本地 git 待提交 (8 项 untracked + 1 项 modified)

### 文本文件 (待 commit,这次 session 一起)
1. `deploy-to-ecs.sh` (3K) — 06-29 部署脚本
2. `docs/08-OSS-部署与备份-2026-06-27.md` — OSS 部署文档
3. `scripts/alert-resources.sh` — 监控告警脚本
4. `scripts/backup-to-nas.sh` — NAS 备份脚本
5. `scripts/daily-handoff-daemon.sh` — 每日交接脚本
6. `state/ALIYUN-DEPLOY-LESSONS.md` — 阿里云部署教训

### 大文件 (待决策)
7. `state/案例库/` — 30+ mp4/jpg 案例素材 (~200MB? 待 `du -sh` 验)
   - 决策 A: `.gitignore` 整个目录 (内容已迁 OSS,git 不需要)
   - 决策 B: 用 `git-lfs` (需装 lfs)
   - 决策 C: 单独建一个 repo (案例库专用)
   - **推荐 A**: 内容已迁 OSS (`case-library` 06-27 commit),git 只需要元数据

### ECS 工作树未 commit (待 user 决策丢/留)
8. ECS 上有未 commit 改动:
   - `.gitignore / DECISIONS / PROJECT / ROADMAP` (4 文件, ~110 行)
   - `app/api/auth/verify-code/route.ts` (7/2)
   - `app/api/canvas/run-image/route.ts` (10/4)
   - **`app/canvas/[id]/CanvasEditor.tsx` (178/41)** — 老画布大改动, 是否丢?

---

## 📋 待 user 拍板清单

| # | 项 | 状态 |
|---|---|---|
| A | 下一步做什么 (Phase 3 / Phase 2.4 / 端口对比度 / commit untracked) | 待拍 |
| B | ECS git 同步方案 (A/B/C) | 待拍 |
| C | 案例库文件去留 (.gitignore / git-lfs / 单独 repo) | 待拍 |
| D | 老画布 178 行改动 (丢 / 保留 / 合并) | 待拍 |
| E | P0 #5 SMS 验证码 6 位数 | 待贴 |
| F | 老路由 `/canvas/[id]` 下线时间 | 待拍 |

---

## 验收标准 (本文件清空 = 当天收口)

- [ ] 6 个 🔴🟡🟢 项全部完成
- [ ] A-F 6 个拍板全部完成
- [ ] ECS `git log --oneline -1` == 本地 master HEAD
- [ ] damai.net.cn/canvas-v2/[id] 实测 vision 验证通过
- [ ] P0 #5 verify-code 收口