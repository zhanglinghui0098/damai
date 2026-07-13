# 大脉 (damai) 项目状态

最后更新: **2026-07-13 21:50 CST** (画布 v5 brief 定稿: 换栈到 @antv/x6)

## 🟢 当前在做 (07-13)

### 📋 **画布 v5 项目 Brief 定稿** (commit pending, 07-13 21:50)
**user 痛点**: 画布 v3/v4 累计 35+ 次改动全部失败, 6+ 横跳血泪, 业务推进困难

**🎯 35+ 失败根因 (本 session 突破)**:
- codex 抄 TapNow UI 时, 自动触发了 `@antv/x6` (阿里 AntV) 的训练数据
- 但项目用的是 `@xyflow/react 12.5.0`, 2 个库**完全不同**:
  - x6 用 `Port/Cell/Graph`, xyflow 用 `Handle/Node/Edge`
  - x6 命令式 (`graph.addNode`), xyflow 声明式 (props)
  - 事件名 / 渲染机制 / 状态管理 全部不同
- codex 写的是 x6 API 风格, 跑在 xyflow 引擎 = 35+ 次**全部行为不匹配**

**🔍 验证 (07-13)**:
- `tapnow.com/zh-HK` HTML + bundle 扫描
- 425 处 `Port` 命中, 0 处 `Handle` → 100% 用 x6
- 阿里 AntV 全家桶 (x6 + g6 + Cell + Graph)

**✅ 决策: 换底座到 @antv/x6 (v5 重做)**
- 业务对标 TapNow **同栈**, 抄无障碍
- 阿里生态 (你的 ECS/OSS/钉钉/飞书 全部阿里系)
- 国内 B 端标准 (钉钉/飞书/简道云/ProcessOn 早期都用 x6)
- 中文文档/招聘, 团队学习成本低
- 商业升级路径明确 (XFlow 商业版)

**📄 完整 Brief**: `state/CANVAS_V5_BRIEF.md` (17 KB, 5 Part + 7 TBD + 5 阶段)
- 包含: 需求侧 / 技术栈 / 风险与已踩坑 / 实施计划 / TBD
- 包含: 35+ 失败档案 + 8 个新风险 + 7 条工作流纪律
- 包含: 禁用词清单 (Grep Gate) + 验收标准 + 时间盒

**⏰ 时间盒**:
- 理想: 4 周出 v5 1.0
- 现实: 5-6 周 (含学习 + 招人)
- **7-15 顾家 717 deadline**: 1.0 仍用 v2 production, v5 是 1.1 之后

**🎯 Phase 0 启动项** (1 周):
- [ ] Hermes 读 @antv/x6 官方文档
- [ ] codex 写 50 行 x6 demo
- [ ] 跑通最小 reference (2 节点 + 1 连线)
- [ ] 写 `state/CODE_STYLE.md` (禁用词清单)
- [ ] 写 `state/CANVAS_FAILURES.md` (历史 35+ 失败档案)

**⚠️ 7 条工作流纪律 (防再踩)**:
1. 视觉/实现分离 (看截图只参考视觉, 不说"做这个")
2. 改前必查 (列方案 + 风险 + 等拍板)
3. Grep Gate (禁用词验证, 通过才 commit)
4. Minimal Reference (50 行黄金 reference)
5. 验证 Gate (5 步清单, 不信 "完成")
6. Post-Mortem (失败立刻写, 不积压)
7. 招人配合 (招 1 个 x6 经验, 1-2 周)

## 🟢 当前在做 (07-10)

### ✅ **画布 v2 codex 静态 SPA 已 work + user 验收** (07-10)
- 部署链路: codex 静态 SPA → `public/canvas-v2/{index.html, assets/}` + nginx `location /canvas-v2` 块 (不经过 next.js 重 build, 绕 1.8G OOM)
- React Flow v12 uncontrolled 模式, 6 节点 (text/image/video/audio/merge/output), i2i auto, MiniMap, ZoomControls, 双击菜单
- **节点连不上问题已修** (user 验收)
- 主页所有画布入口 (5 处) → `/canvas-v2`: `StartCreating.tsx:27,42` + `HeroAgent.tsx:247` + `SiteFooter.tsx:13` + `app/canvas/page.tsx` redirect
- **⚠️ 硬警告 user 07-10 原话: "后续调整的时候, 切记不要再去动这一块, 动时必须先提醒, 你自己不要动"**
  - 架构已 6+ 次横跳血泪 (06-08 / 06-19 / 06-23 / 06-26 / 07-08)
  - user 明令 "实在是不想再改了"
  - 后续画布 UI/功能微调必须先列方案 + 风险 + 等 user 拍板, **绝不擅自改**

### ✅ **Login fix v3 完成** (commit `a69a53b`, 07-10 13:15)
**user 痛点**: "登录页面的ui设计有点问题, 输入栏跑到画面外了" → "没有work, 还是跑出去"

**3 件事一起改**:
1. **6 位 input 加 `size={1}`** ← 关键, 防浏览器默认 size=20 intrinsic min-width 撑出 grid
2. **input style**: `width: "100%"` + `boxSizing: "border-box"` + `padding: 0` + `height: 48` (从 56)
3. **父容器**: `maxWidth: 420 → 320` + `padding: "2rem 1.5rem" → "1rem 0.5rem"` + `boxSizing: "border-box"` + `overflowX: "hidden"`

**配套 nginx 修**:
- `/_next/static` cache `max-age=31536000, immutable` → `max-age=3600, must-revalidate`
- **user "还是跑出" 真根因**: 浏览器 cache 1 年吃老 chunk, webpack content hash 没变 → 用户永远拿到没 size:1 的老 JS
- nginx reload 不杀 server

**user 接下来要做的**: **硬刷 /login** (`Ctrl+Shift+R` / `Cmd+Shift+R`) 清浏览器端 cache → 测 mobile (375 / 320 viewport)

### ✅ **SMS 真发 work** (07-10)
- 签名「杭州即客传媒」+ 模板 SMS_335341232 审核通过 (06-29)
- 3 家运营商签名报备通过 (07-02)
- `DAMI_SMS_REAL=false → true` + 重 build 让 inline 进 bundle (07-10)
- `curl POST /api/auth/send-code` 15925670098 → `{"ok":true,"provider":"aliyun"}` 200 ✅
- user 收到真短信验证码 (138 号段限流但 user 真号 OK)
- **隐藏 bug**: `lib/auth.ts` d() 函数 hardcode `dev-stub-damai-session-secret-rotate-in-prod-2026-06-24`, `DAMI_SESSION_SECRET` 真值在 .env.local 但 sign + verify 都用 stub → session 仍 work, 不阻塞

## 🟡 P0 公测前必做 (07-15 deadline)

### ⏳ **账号区隔/多租户数据隔离 (P0 未验)**
**user 07-10 原话**: "账号的区隔啊等等一些信息数据啊, 这个还需要验证"

**需测 (短 <30 min)**:
1. 不同手机号注册 → 各自 session 隔离
2. 各自 canvas/projects 互不可见
3. middleware `x-tenant-id` header 注入正确
4. 飞书 Bitable 写库按 `tenant_id` 分区 (没混数据)
5. 同 session 跨浏览器失效 (cookie httpOnly + sameSite)
6. `lib/canvas-store.ts` / `lib/feishu-bitable.ts` 所有 read/write 都有 tenant_id 过滤

**已知风险**:
- `middleware.ts` verifySession 只校验签名, 不带 tenant_id 注入 (待查)
- `app/api/canvas/[id]/route.ts` 可能没 tenant_id 过滤
- 飞书 Bitable `case-library` / `task-log` 写库没 `tenant_id` 字段

### ⏳ **Login mobile viewport 验证 (P0)**
- user 硬刷 /login + 测 mobile (iPhone SE 320 / iPhone 12 390 / Android 360)
- vision 验 mobile 6 位 input 真的 fit

## 🚧 已知 Issue (不阻塞 P0, 但要追踪)

### ⚠️ **task-log 路由 silent fail**
- `app/api/canvas/task-log/route.ts` (untracked) 引用 `lib/feishu-bitable.ts` 5 个不存在的 export
- build silent 跳过, 实际编译不出路由
- **修法**: 加 5 个函数到 `lib/feishu-bitable.ts` 或 删 `task-log/`

### ⚠️ **devDeps 跟 next 14 冲突**
- `@opennextjs/cloudflare@1.19.11` 要 `next@>=15.5.18`, 跟 `next@14.2.35` 冲突
- `@playwright/test` + `wrangler` 也是大包
- 用 `--legacy-peer-deps` 绕过
- 长期 fix: 删这 3 个 devDeps 或升 next 15+ (大改)

### ⚠️ **DAMI_SESSION_SECRET dev-stub**
- `lib/auth.ts` d() 函数 hardcode dev-stub secret, 不是 .env.local 真值
- sign + verify 两边都用 stub → session 仍 work
- **修法**: d() 函数改 `process.env.DAMI_SESSION_SECRET` 优先

### ⚠️ **deploy-to-ecs.sh 永久 bug**
- 假设 `DOCKER_PREFIX="docker exec hermes-hermes-1"` 在容器内跑
- 实际在 NAS host (`DXP4800PLUS-8BAF`) 跑不通 (`docker: command not found`)
- **修法**: 改脚本适配 host 或建 `deploy-from-nas-host.sh`

### ⚠️ **deploy 后 30G 磁盘满风险**
- 每次 deploy backup 3.6G (`/tmp/damai.bak.20260710-*`)
- 旧 `app.bak-20260701-*` 6 个 × 12 dir 残留 (3-5G) — 07-10 10:50 已清
- **修法**: deploy 脚本备份成功后自动 `rm -rf ${BACKUP_DIR}` (只保留当前次)

## 📊 ECS 资源现状 (07-10 13:25)

| 资源 | 状态 |
|------|------|
| 内存 | 1.8Gi total / 1.5Gi available (升配后 2C/2G, 不是 4G) |
| Swap | 2.0Gi (我加的 swapfile2) |
| 磁盘 | 30G / 19G used / 8.9G avail 69% |
| next-server | v14.2.35 online, pid 6754, mem 58.1MB |
| PM2 damai | online, pid 6742, uptime 10s |
| 公网路由 | /api/health / / /login /canvas-v2/ 全 200/307 |

## 📁 关键文件位置

| 文件 | 作用 |
|------|------|
| `app/login/page.tsx` | LoginForm (a69a53b fix v3) |
| `components/StartCreating.tsx` | 主页画布入口 (line 27, 42 → /canvas-v2) |
| `app/canvas/page.tsx` | /canvas redirect → /canvas-v2 |
| `public/canvas-v2/` | codex 静态 SPA 384K |
| `/etc/nginx/conf.d/damai.conf` | nginx 配置 (cache header 已修) |
| `lib/feishu-bitable.ts` | 飞书 Bitable SDK (缺 5 个 export) |
| `lib/auth.ts` | d() 函数 hardcode dev-stub (待修) |
| `middleware.ts` | session 验证 (待查 tenant_id 注入) |
| `next.config.mjs` | `env: { DAMI_SESSION_SECRET, DAMI_SMS_REAL }` inline |
| `.env.local` | DAMI_SMS_REAL=true ✅, VOLC_API_KEY=*** 真值, DAMI_SESSION_SECRET=*** 真值 (但被 hardcode 覆盖) |
| `state/HANDOFF-2026-07-10.md` | 详细时间线 + 部署命令 (待写) |
| `state/CANVAS_CHANGE_CHECKLIST.md` | 画布改动硬规则 (防横跳血泪重演) |
| `state/AGENT_MEMORY.md` | agent 视角 (07-03 视角, 需更新到 07-10) |

## 🔑 关键密码/IP 备忘

- ECS: `root@47.96.128.172` (阿里云轻量 SWAS, **不是** ECS)
- SSH 密码: `Zlh199483`
- sshpass: `sshpass -p Zlh199483 ssh -o StrictHostKeyChecking=no root@47.96.128.172`
- ECS hostname: `DXP4800PLUS-8BAF` (UGREEN DXP4800 Plus)
- 飞书 App: `cli_aa9768a568b8dcb6`
- Bitable app_token: `RPvQbE65Ga4pN6sFop1cZfI1nWg` (12 表 389 字段)

## ⏳ D1-D5 公测倒计时 (07-10 → 07-15)

| 日期 | 任务 | 状态 |
|------|------|------|
| 07-10 (D5) | 画布重设计 + deploy ✅, login fix v3 ✅, SMS 真发 ✅ | ✅ |
| 07-10 (D5) | 账号区隔/多租户验证 | ⏳ P0 |
| 07-10 (D5) | login mobile viewport 验证 | ⏳ 等 user 硬刷 |
| 07-11 (D4) | ARMS 阈值告警 + 全 e2e | ⏳ |
| 07-12 (D3) | 4 人 soak day 0 | ⏳ |
| 07-13 (D2) | 修 P0P1 | ⏳ |
| 07-14 (D1) | 修 P0P1 | ⏳ |
| 07-15 (D0) | 公测开闸 50 人 | ⏳ |

## 📝 下一 session 第一步

1. 读 `state/STATUS.md` (本文件, 07-10 视角)
2. 读 `state/AGENT_MEMORY.md` (需更新)
3. 读 `state/CANVAS_CHANGE_CHECKLIST.md` (画布改动硬规则)
4. **账号区隔验证**: 不同手机号注册 → session/canvas/Bitable 隔离
5. **等 user 反馈 mobile login fit**

---

## 已完结 (历史)
- ✅ 07-03 4 天 gap 收口 + 画布改动 checklist 创建
- ✅ 07-02 画布 (sandbox v2) 改好 + user 验收
- ✅ 07-01 ImageNode UI 重做
- ✅ 06-30 画布 Phase 3.5 (chrome 1:1 恢复) + Bug 1+2 修复
- ✅ 06-26 v4 减法 + 一站式重构
- (更早 略)
