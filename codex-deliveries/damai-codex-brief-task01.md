<!-- damai-codex-brief-task01.md
     生成时间: 2026-06-17T01:45:09+08:00
     用途: 给 Codex 看 task 01（代码）的完整 spec
     用法: 你复制整个文件 → 贴给 Codex → 它开始干活
-->

# Dami Codex Brief — Task 01 (代码)

---

## Part 1: PROJECT.md（项目全貌，5.5KB）

# Dami 项目 — 入口文档

> **这是什么**：Hermes Agent 的"项目外脑"。所有重要决策 / 进度 / 任务都写在这里，**不依赖 context window 记忆**。
> **何时读**：每个 session 第一件事 / context 截断后 / 你（用户）问"现在进度到哪"时。
> **维护人**：Hermes Agent
> **最后更新**：2026-06-17 01:18

---

## 1. 项目一句话（30 字内能说清）

**damai** = AI 武装的家居内容营销 SaaS 工具，1 人顶 5 人，试点天禧派 → 顾家 10 经销商。

---

## 2. 当前阶段（**备案等待期**）

**整体状态**：🔴 **阻塞中 — 等备案结果**（7-20 工作日）

```
[已完成] ✅ 域名注册 (damai.net.cn)             2026-06-16
[已完成] ✅ 阿里云备案提交                       2026-06-16
[已完成] ✅ 阿里云 ECS 购买 (2vCPU/0.5GiB)      2026-06-16
[进行中] 🔄 备案审核                             7-20 工作日
[已完成] ✅ Vercel 跑早期 demo (damai-gold.vercel.app)
[已完成] ✅ 飞书 12 张 Bitable 系统 (不动)
[已完成] ✅ tianxipai-bot 飞书机器人 (不动)
[已完成] ✅ Codex 桌面沙盒打开                    2026-06-17 (用户报)
[待办]   ⚠️ 5 件事 (代码/内容/功能/板块/业务流程) — 见 ROADMAP.md
```

**关键约束**（高频横跳警告 ⚠️）：

| 约束 | 状态 | 决策 |
|---|---|---|
| 部署平台 | 等待 | Vercel (试过) / Cloudflare Pages (试过) / 阿里云 ECS (买了没用) / Zeabur / 自建 NAS — 6/17 拍板"等阿里云" |
| ECS 配置 | 0.5GiB | 跑 Next.js 经常 OOM，2C/4G 差价 ¥60/月 — 用户"等审核通过再说" |
| Codex 通信 | 半自动 | **Codex 是桌面沙盒，不是 CLI agent** — 链路只能用户手动复制粘贴 |
| 多租户 | Day 1 就要 | tenant_id 列成本 0，P1 加要改全栈 |
| 1:5 护城河 | 完整工作流 | 不是单点功能（采纳 6/15 Codex 提案） |

---

## 3. 5 件事总览（备案前完成）

| # | 任务 | 估时 | 难度 | 是否要 Codex | 详细 |
|---|---|---|---|---|---|
| 1 | **代码** | 2-3 天 | 中 | ✅ | [tasks/01-code.md](tasks/01-code.md) |
| 2 | **内容** | 3-5 天 | 低 | ❌ 我写 | [tasks/02-content.md](tasks/02-content.md) |
| 3 | **功能 P0** | 3 天 | 高 | ✅ 必需要 | [tasks/03-features-p0.md](tasks/03-features-p0.md) |
| 4 | **板块设计** | 1 周 | 中 | 混合 | [tasks/04-pages.md](tasks/04-pages.md) |
| 5 | **业务流程** | 2 天 | 低 | ❌ 我画 | [tasks/05-business-flow.md](tasks/05-business-flow.md) |
| **合计** | | **2-3 周** | | | |

**注意**：
- 2 + 5 我（Hermes）能独立完成，**不依赖 Codex** → **建议先开**
- 1 + 3 + 4 需要 Codex → **先开 task spec，Codex 写代码**

---

## 4. Codex 协作模式（半自动）

**约束**：Codex 是桌面沙盒，无法直连 Hermes。

**协作流程**：

```
[你] 从 tasks/01-code.md 复制 "Codex 任务单" → 贴给 Codex
[Codex] 写代码到它自己的沙盒
[你] 把 Codex 写完的代码 / 报告 → 贴回 NAS /opt/data/projects/damai/codex-deliveries/
[Hermes] 读 codex-deliveries/ → 跟 project 状态对比 → 写报告到 hermes-reports/
[你] 把 hermes-reports/ 内容贴给 Codex → 下次会话第一句
```

**我优化的部分**：
- task 文件里有 **"Codex 任务单"** section（直接复制用）
- 接收目录 `codex-deliveries/` 自动按日期归档
- 报告目录 `hermes-reports/` 用结构化 markdown，复制友好

---

## 5. 文件清单

| 文件 | 用途 | 何时读 |
|---|---|---|
| `PROJECT.md` | **入口**，单文件能看懂全貌 | 第 1 件事 |
| `ROADMAP.md` | 5 件事时间表 + 依赖 | 看进度 |
| `DECISIONS.md` | 决策日志（防横跳） | 用户问"为什么"时 |
| `state.json` | 机器可读进度 | agent 启动 |
| `README.md` | 怎么用这套文档 | 用户不会用时 |
| `tasks/01-05.md` | 5 件事详细拆解 | 具体做某件事时 |
| `codex-deliveries/` | Codex 写完的代码 | Hermes 收 |
| `hermes-reports/` | Hermes 写给 Codex 的报告 | 用户贴给 Codex |

---

## 6. 下次 session 启动流程（agent 必读 checklist）

1. 读 `PROJECT.md`（本文件）→ 知道全貌
2. 读 `state.json` → 知道当前进度（每件事 done/in-progress/pending）
3. 读 `DECISIONS.md` → 知道为什么这么做
4. 读最近一个 `hermes-reports/` → 知道上次给 Codex 留了什么
5. 检查 `codex-deliveries/` 有没有新文件
6. **6 件事做完再回应用户**

---

## 7. 用户偏好（项目相关，不写 memory tool）

- 沟通风格：**直接务实**，要解决方式不要问题分析
- **别横跳** — 方案定就执行
- **付费方案前置披露** — 持续成本 vs 一次性成本
- **范围严格** — 别主动越界
- **不打无准备的仗** — 操作前先验证
- **Codex 沙盒限制** — 我能优化的：写好任务单、收好交付物，**不能**替代用户中转

---

## 8. 关键文件位置速查

| 用途 | 路径 |
|---|---|
| Next.js 项目根 | `/opt/data/projects/damai/` |
| Codex 通信 inbox | `/opt/data/damai-inbox/{from-codex,to-codex,done}/` |
| 飞书 Bitable | https://z0f6fp1bjaz.feishu.cn/base/RPvQbE65Ga4pN6sFop1cZfI1nWg |
| Vercel demo | https://damai-gold.vercel.app |
| NAS 备份 | `/volume1/10T/Hermes/backups/hermes_backup_20260616.tar.gz` |
| 12 张 Bitable schema | `/opt/data/output/tianxipai_ai_marketing_system/` |
| 老 PROJECT_STATE | `/opt/data/projects/damai/PROJECT_STATE.md` （已升级，保留作历史） |

---

## Part 2: state.json（机器可读进度，2.6KB）

{
    "project": "damai",
    "version": "0.2.0",
    "last_updated": "2026-06-17T01:18:00",
    "current_phase": "\u5907\u6848\u7b49\u5f85\u671f",
    "blocked": true,
    "blocker": "\u7b49\u5907\u6848\u7ed3\u679c\uff087-20 \u5de5\u4f5c\u65e5\uff09",
    "next_milestone": "\u5907\u6848\u901a\u8fc7 + \u90e8\u7f72\u5230 ECS",
    "tasks": {
        "01-code": {
            "status": "pending",
            "estimate_days": 3,
            "needs_codex": true,
            "depends_on": [],
            "progress": 0,
            "notes": "3 commit \u672a push / \u9274\u6743\u672a\u505a / \u5ba2\u6237\u7248 README \u672a\u5199"
        },
        "02-content": {
            "status": "pending",
            "estimate_days": 4,
            "needs_codex": false,
            "depends_on": [],
            "progress": 0,
            "notes": "3 case study + 5 hero \u6587\u6848 + 20 FAQ + 3 \u6837\u7247"
        },
        "03-features-p0": {
            "status": "pending",
            "estimate_days": 3,
            "needs_codex": true,
            "depends_on": [
                "01-code"
            ],
            "progress": 0,
            "notes": "\u9009\u9898\u6a21\u677f + \u591a\u6a21\u578b\u8def\u7531 + \u98de\u4e66\u5ba1\u6838 + \u590d\u76d8\u9875"
        },
        "04-pages": {
            "status": "pending",
            "estimate_days": 7,
            "needs_codex": "mixed",
            "depends_on": [
                "03-features-p0"
            ],
            "progress": 0,
            "notes": "11 \u4e2a\u9875\u9762\uff0c\u542b\u9274\u6743 / \u5de5\u4f5c\u53f0 / \u540e\u53f0"
        },
        "05-business-flow": {
            "status": "pending",
            "estimate_days": 2,
            "needs_codex": false,
            "depends_on": [],
            "progress": 0,
            "notes": "3 \u7c7b\u6d41\u7a0b\uff1a\u5ba2\u6237\u65c5\u7a0b / \u5e97\u4e3b SOP / \u5f02\u5e38\u6d41"
        }
    },
    "external_state": {
        "domain": "damai.net.cn",
        "domain_provider": "\u963f\u91cc\u4e91",
        "domain_registered": "2026-06-16",
        "beian_submitted": "2026-06-16",
        "beian_status": "\u5ba1\u6838\u4e2d\uff087-20 \u5de5\u4f5c\u65e5\uff09",
        "ecs_purchased": "2026-06-16",
        "ecs_config": "2vCPU / 0.5GiB",
        "ecs_deployed": false,
        "vercel_demo_url": "https://damai-gold.vercel.app",
        "vercel_running": true,
        "feishu_bitable": "https://z0f6fp1bjaz.feishu.cn/base/RPvQbE65Ga4pN6sFop1cZfI1nWg",
        "tianxipai_bot": "\u8fd0\u884c\u4e2d\uff08\u4e0d\u52a8\uff09"
    },
    "codex_relationship": {
        "type": "desktop_sandbox",
        "can_write_code": true,
        "can_be_spawned_by_hermes": false,
        "communication": "\u534a\u81ea\u52a8\uff08\u7528\u6237\u624b\u52a8\u590d\u5236\u7c98\u8d34\uff09",
        "last_active": "2026-06-17 (\u7528\u6237\u62a5\u544a\u5df2\u6253\u5f00)",
        "inbox_status": "\u5df2\u505c\u7528\uff086/15 17:48 \u540e\u65e0\u6587\u4ef6\u6d41\u52a8\uff09"
    },
    "recommended_order": [
        "02-content",
        "05-business-flow",
        "01-code",
        "03-features-p0",
        "04-pages"
    ],
    "files": {
        "entry": "PROJECT.md",
        "roadmap": "ROADMAP.md",
        "decisions": "DECISIONS.md",
        "tasks_dir": "tasks/",
        "codex_deliveries": "codex-deliveries/",
        "hermes_reports": "hermes-reports/"
    }
}

---

## Part 3: tasks/01-code.md（这次的具体 spec，4.4KB）

# Task 01 — 代码

**状态**：🟡 pending
**估时**：2-3 天
**是否要 Codex**：✅ 必需要
**依赖**：无
**最后更新**：2026-06-17 01:18

---

## 目标

把 `/opt/data/projects/damai/` 的 Next.js 项目推到"客户能看、能用、有基础安全"的状态。

---

## 现状盘点

**已有**（8 个 commit，3 个 ahead of origin）：
- 路由：`/`（首页）、`/generate`（生成）、`/asset`（视频库）
- API：`/api/generate`、`/api/poll/[taskId]`
- lib：`video_client.py`（worker）+ `video_client.ts`（前端）
- Tailwind UI + 极简视觉
- `.env.example`（6/14 22:06 ✅）

**缺**：
- 3 commit 没 push（`0c3a23f` / `dc47be2` / `b1cb5fb`）— 决定 push/drop
- 4 个 untracked 文件（`PROJECT_STATE.md` / `docs/dns-setup.md` / `open-next.config.ts` / `wrangler.toml`）— 决定 commit/ignore
- `package.json` / `package-lock.json` 有未提交改动（升级 next？）— 看 diff
- **`.env.local` 没建** → 火山方舟 API key 缺失 = `/generate` 点不开
- **没鉴权** → 任何人都能调 API
- **没客户版 README**（现有 README 是开发者向）
- **没 CI / 没测试**

---

## 子任务

### ST-1.1 处理 3 commit + 4 untracked + 2 改动（半天）

- [ ] `git diff package.json` 看 next 升级是不是有意为之
- [ ] 看 3 commit 内容，决定 push / drop
- [ ] `PROJECT_STATE.md` 移到 `docs/PROJECT_STATE.md` + commit（不污染根）
- [ ] `docs/dns-setup.md` 决定 commit
- [ ] `open-next.config.ts` / `wrangler.toml` 决定保留（说明用 Cloudflare Pages 备选）

### ST-1.2 加基础鉴权（1 天）

- [ ] 装 NextAuth.js
- [ ] 用飞书 OAuth provider（App ID 已有：`cli_aa9768a568b8dcb6`）
- [ ] 鉴权中间件：/api/* 必须登录
- [ ] 公开路由白名单：`/` `/pricing` `/about` `/contact`

### ST-1.3 建 `.env.local` + 火山方舟 API key（0.5 天）

- [ ] 从阿里云百炼开通火山方舟（如果还没）
- [ ] 创建 API key
- [ ] 写进 `.env.local`（不入 git）
- [ ] 测试 `/generate` 真能跑出视频

### ST-1.4 客户版 README（0.5 天）

- [ ] 介绍工具是啥、3 步流程图
- [ ] 定价（试用 ¥0 / 基础 ¥3000 / 高级 ¥5000）
- [ ] FAQ 链接（指向 `/faq` 或 docs）
- [ ] 联系信息

### ST-1.5 客户真实试跑（备案前 1 天）

- [ ] 至少 1 个客户（顾家 1 个经销商）走完完整路径
- [ ] 录屏 + 截图 → 放进 `tasks/02-content.md` 的 case study

---

## 给 Codex 的任务单（直接复制）

```
你好 Codex，我是张凌辉。请按以下 spec 写代码：

【项目位置】
/opt/data/projects/damai/

【现状】
- 8 个 commit, ahead of origin by 3 (0c3a23f / dc47be2 / b1cb5fb)
- 4 个 untracked 文件: PROJECT_STATE.md, docs/dns-setup.md, open-next.config.ts, wrangler.toml
- package.json / package-lock.json 有未提交改动
- 没鉴权 / .env.local 没建 / 客户版 README 没写

【任务清单】

ST-1.1 处理 commit / untracked
  1. git log --oneline -10 看 3 commit 内容
  2. git diff package.json 看 next 升级是不是有意为之
  3. 决定: 3 commit 全部 push / 哪个 drop / 哪个重写
  4. 4 个 untracked 文件决定: commit / gitignore / drop
  5. 把 PROJECT_STATE.md 移到 docs/PROJECT_STATE.md

ST-1.2 加 NextAuth.js
  1. npm i next-auth
  2. 用飞书 OAuth provider
  3. 飞书 App ID: cli_aa9768a568b8dcb6
  4. 中间件: /api/* 必须登录
  5. 公开路由白名单: / /pricing /about /contact

ST-1.3 客户版 README
  1. 重写 README.md (客户视角, 不是开发者视角)
  2. 含 3 步流程图
  3. 含定价
  4. 含 FAQ 链接

【输出】
完成后, 把:
1. 你做的所有决策 (push/drop/commit/ignore) 列表
2. 关键代码 diff
3. 测试结果 (鉴权能不能登入 / README 排版)

写到一份 markdown 报告, 贴回给我。
```

---

## 完成标准（DoD）

- [ ] 3 commit + 4 untracked 全部处理完，git tree 干净
- [ ] NextAuth 装好，飞书 OAuth 能登
- [ ] `.env.local` 有了，`/generate` 能真跑出视频
- [ ] 客户版 README 写好，给非开发者看能看懂
- [ ] 1 个客户走完完整路径

---

## 风险

| 风险 | 概率 | 应对 |
|---|---|---|
| 鉴权破坏现有 Vercel 部署 | 中 | 先在本地 dev 测，再 push |
| 3 commit 跟现网版本冲突 | 中 | 先 git fetch，看 origin/master 状态 |
| 飞书 OAuth 域名限制 | 高 | Vercel 子域名要先在飞书 App 加回调 |

---

## Part 4: 协作约定（重要）

### 你 (Codex) 怎么写代码
1. 你有自己的沙盒文件系统, 写代码到那里
2. 写完准备一份 markdown 报告 (决策 + diff + 测试结果)
3. 把报告贴回给用户

### 用户怎么把报告转给我 (Hermes)
1. 用户把你的报告贴到 NAS: /opt/data/projects/damai/codex-deliveries/2026-MM-DD-task01.md
2. 我 (Hermes) 读到后:
   - 跟 state.json 对比, 更新进度
   - 写报告到 /opt/data/projects/damai/hermes-reports/2026-MM-DD-task01-review.md
   - 用户把这份报告贴给你 → 你下次会话第一句

### 关键事实
- **飞书 App ID**: cli_aa9768a568b8dcb6 (Hermes 已有, 你要单独建自己的)
- **Bitable 链接**: https://z0f6fp1bjaz.feishu.cn/base/RPvQbE65Ga4pN6sFop1cZfI1nWg
- **你跟 Hermes 完全独立**, 不要假设你们能直接通信
- **用户是中间人**, 复制粘贴是常态

---

## Part 5: 完成标准 (DoD)

Task 01 完成时, 你应该告诉用户:
1. 3 commit + 4 untracked + 2 改动 全部处理完 (push/drop/commit 列表)
2. NextAuth 装好, 飞书 OAuth 能登
3. .env.local 有了, /generate 能真跑出视频
4. 客户版 README 写好
5. 关键 diff + 测试截图

我 (Hermes) 拿到你的报告后会:
1. 验证你做的事 (git status / .env.example / 鉴权是否能跑)
2. 更新 state.json (status: pending → in_progress → done)
3. 更新 PROJECT.md 当前阶段
4. 写反馈报告 → 你下次会话第一句
