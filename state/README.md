# 大脉 (damai) state/ — 必读

> **这个 README 是给所有 agent (Hermes, Codex, Claude Code, 任何新 session) 看的.**
>
> 任何 agent 进项目**第一件事** = 读这个 README, 然后按顺序读 STATUS.md + BACKLOG.md + HANDOFF-LATEST.md.
>
> 跳过这一步 = 改错 (这是 06-29 之前其他 agent 一直改错的 root cause)

---

## 路径速查 (在哪读)

| 环境 | 完整路径 | 备注 |
|---|---|---|
| **本地 NAS 容器 (我) / Hermes 容器** | `/opt/data/projects/damai/state/` | 我现在跑的地方, 容器内直读 |
| **4T 共享盘** | 同一目录, 因为整个 `/opt/data/projects/damai` 在 pool4-volume1 4T 盘 | 跟 NAS 容器是同一文件系统 |
| **Windows SMB 共享 (Z: 盘)** | `Z:\damai\hermes-project\damai\state\` | 2026-06-25 14:08 打通 (nas-windows-workflow-alignment skill) |
| **生产 SWAS (47.96.128.172) /opt/damai** | **没有 state/** | 生产只跑代码, 进度文档只在 NAS 本地 |

**所有 agent 读 state/ 必走 NAS 容器内路径** (4T 盘已经 mount 进容器) — 不要 SSH 上 SWAS 找 state, 没有.

---

## 文件清单 (按重要性排序, 必读顺序)

```
state/
├── README.md                  ← 本文件 (入口, 必读)
├── STATUS.md                  ← 32KB / 514 行 — 主状态文件
│                                2026-06-29 16:21 最后更新
│                                含: 当前在做 / 关键决策 / 待办 / 文件位置 / 重要背景 / 教训 / 历史里程碑
│                                ★ 任何决策前先看这个
├── BACKLOG.md                 ← 4.4KB / 69 行 — 待办 + 已完成
│                                2026-06-29 09:01 最后更新 (⚠️ 今天后面进展没回写)
│                                含: ✅ 已完成 / 🚧 进行中 / ⏳ 阻塞
├── HANDOFF-LATEST.md          ← 跨 session 交接 (HANDOFF-2026-06-28.md 的 copy)
│                                2026-06-28 22:00 最后更新
│                                ★ 接手别人干了一半的事, 先看这个
├── HANDOFF-2026-06-27.md      ← 历史交接
├── HANDOFF-2026-06-28.md      ← 历史交接
├── AGENT_MEMORY.md            ← 6.9KB — agent 内部备忘
├── ALIYUN-DEPLOY-LESSONS.md   ← 4.7KB — 阿里云部署踩坑 (06-27 写)
├── CANVAS_API_PROGRESS.md     ← 4.1KB — 画布 API 进度
├── 2026-06-24-featured-3up-revamp/ ← 24 日子项目存档
└── 案例/                      ← 客户案例存档
```

---

## ⚠️ 必读 3 件事 (省你 1h 走弯路)

### 1. 部署目标 = 阿里云**轻量 SWAS**, 不是 ECS
- **IP**: `47.96.128.172`
- **公网域名**: `damai.net.cn`
- **SSH user**: `admin` (不是 root, root SSH 禁了)
- **SSH 路径**: admin + NOPASSWD sudo + ed25519 密钥 (`/opt/data/home/.ssh/damai-ecs`)
- **控制台**: `https://swas.console.aliyun.com/` (**不是** ecs.console.aliyun.com)
- **项目根**: `/opt/damai`
- **历史教训**: user 多次纠正, 不要说 ECS, 不要用 ECS 控制台路径

### 2. 画布是 **React Flow (@xyflow/react v12)**, 06-30 迁移完成
- 文件: `app/canvas/[id]/CanvasFlowEditor.tsx` (Phase 3.5 完整版, 30KB)
- 老自研 SVG CanvasEditor 已改名 `.old.tsx` 备份
- 老路由 `/canvas/[id]` 直接 render React Flow (不再 redirect)
- 06-29 19:30 user 拍板, 06-30 Phase 1-4 完成
- 部署详情见 `state/PHASE4-DEPLOY-HANDOFF.md`

### 3. 飞书 Bitable 权限已开 (2026-06-11 升级)
- **App ID**: `cli_aa9768a568b8dcb6`
- **权限**: `drive:drive` + `bitable:app` 全开
- **app_token**: `RPvQbE65Ga4pN6sFop1cZfI1nWg` (12 表 389 字段)
- **直接调 OpenAPI 即可**, 不需要 webhook URL
- **不要**让 user 再开权限, 不要建 webhook

---

## 必读 4 件套 (按这个顺序)

| # | 文件 | 用途 | 大概行数 |
|---|---|---|---|
| 1 | `state/README.md` | 入口 (本文件) | 你正在读 |
| 2 | `state/STATUS.md` | 主状态 | 514 行 |
| 3 | `state/BACKLOG.md` | 待办 | 69 行 |
| 4 | `state/HANDOFF-LATEST.md` | 跨 session 交接 | 79 行 |

**禁止**:
- ❌ 不读 state/ 就改代码
- ❌ 改完代码不更新 state/STATUS.md (下次 agent 接手失忆)
- ❌ 用 `ecs.console.aliyun.com` (是 SWAS, 不是 ECS)
- ❌ 给画布加 react-flow (React Flow v12 已经装好了, 不要再装)

---

## 给 Windows 端 Codex / Claude Code 的 workdir

```toml
# Codex ~/.codex/config.toml
workdir = "Z:\\damai\\hermes-project\\damai"
# 或容器内
workdir = "/opt/data/projects/damai"

[sandbox]
allow_filesystem_read = ["Z:\\damai\\hermes-project\\damai"]
allow_filesystem_write = ["Z:\\damai\\hermes-project\\damai"]

[system_prompt_append]
"""
进项目第一步 = 读 state/README.md + state/STATUS.md + state/BACKLOG.md + state/HANDOFF-LATEST.md (按这个顺序).
绝对不要:
- 改 /opt/damai (那是 SWAS 生产, 用 deploy 脚本, 不要 SSH 直接改)
- 加 @xyflow/react 或 react-flow (画布是自研 SVG)
- 改完不更新 state/STATUS.md (下次接手失忆)
"""
```

---

## 最后更新
- 2026-06-29 18:00 by Hermes (现在 user 要求同步 4T 盘存档, 写这个 README)
- 维护人: 任何改完 state/ 文件的 agent 都要把 mtime 更新一下
