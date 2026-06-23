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
