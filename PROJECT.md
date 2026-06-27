# Dami 项目 — 入口文档

> **这是什么**：Hermes Agent 的"项目外脑"。所有重要决策 / 进度 / 任务都写在这里，**不依赖 context window 记忆**。
> **何时读**：每个 session 第一件事 / context 截断后 / 你（用户）问"现在进度到哪"时。
> **维护人**：Hermes Agent
> **最后更新**：2026-06-27 10:00
> **当前状态**: 🟢 **阶段 0 完成 + 阶段 1 部分阻塞 + 备案在审** — ECS 生产 (damai.net.cn) 跑通, AK rotate 收口, 每天 22:00 自动 handoff 备份 (新)

---

## 1. 项目一句话（30 字内能说清）

**damai** = AI 武装的家居**ToB 营销案例库**（对标 TapNow 模式），签约经销商用 AI 工作流生成家居爆款短视频，1 人顶 5 人，试点天禧派 → 顾家 10 经销商。

---

## 2. 当前阶段（**备案等待期 + 私域过渡**）

**整体状态**：🟢 **合规对齐完成 + 私域过渡启动中**

```
[已完成] ✅ 域名注册 (damai.net.cn)             2026-06-16
[已完成] ✅ 阿里云备案提交                       2026-06-16
[已完成] ✅ 阿里云 ECS 购买 (2vCPU/0.5GiB)      2026-06-16
[进行中] 🔄 备案审核                             10-20 工作日
[已完成] ✅ 合规调研（6/18）                      砍掉用户公域分享 + 砍掉公域收款 + 案例库=TapNow TapTV 模式
[已完成] ✅ Vercel 跑早期 demo (damai-gold.vercel.app) — ⚠️ 国内需翻墙（GFW）
[已完成] ✅ 飞书 12 张 Bitable 系统 (不动)
[已完成] ✅ tianxipai-bot 飞书机器人 (不动)
[进行中] 🔄 NAS 私域部署 (39.182.89.211:3000)    域名下来前用 CF Tunnel 国内直连
[待办]   ⚠️ 4 件事 (代码/内容/板块/流程) + 2 新 (合规备案/私域部署) — 见 ROADMAP.md
```

**关键约束**（6/18 已对齐，⚠️ 别横跳）：

| 约束 | 状态 | 决策（6/18 拍板） |
|---|---|---|
| 公域视频分享 | ❌ 砍 | 视听许可证民营拿不到 |
| 公域收款 | ❌ 砍 | ICP 经营许可证限制；改留资转化 |
| 公域案例展示 | ✅ TapTV 模式 | 官方精选 + AI 生成水印 + 制作过程 Canvas |
| 私域（签约经销商） | ✅ 工作台 | 自用，不"向公众提供" |
| 部署平台 | 过渡期 | **NAS 跑 Next.js + Cloudflare Tunnel**（6/18 拍板），域名下来切 ECS |
| ECS 配置 | 0.5GiB | 等审核通过后看 OOM 再升 |
| Codex 通信 | 半自动 | **Codex 是桌面沙盒** — 链路只能用户手动复制粘贴 |
| 多租户 | Day 1 就要 | tenant_id 列成本 0，P1 加要改全栈 |
| 1:5 护城河 | 完整工作流 | 不是单点功能（采纳 6/15 Codex 提案） |
| 国内对标 | LibTV (liblib.tv) | 主用 Seedance 2.0 + 多模型路由 |
| AI 内容标识 | 必做 | 按《深度合成管理规定》强制标识 |
| 算法备案 | 待定 | 用户回拨网信办 (010)82990520 确认是否必须 |

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
| ECS 生产 | `47.96.128.172` / `/opt/damai/` (PM2 跑, nginx + certbot) |
| ECS 域名 | https://damai.net.cn (Let's Encrypt 90天自动续期) |
| 阿里云 OSS | Bucket `damai-zlh-prod` (oss-cn-hangzhou, 公共读+BPA关) |
| NAS LAN | LAN1 `192.168.2.10` (10Gbps) / LAN2 `192.168.31.198` (2.5Gbps) |
| 部署踩坑 | `state/ALIYUN-DEPLOY-LESSONS.md` + `docs/08-OSS-部署与备份-2026-06-27.md` |
| 运维脚本 | `scripts/backup-to-nas.sh` + `scripts/alert-resources.sh` (cron 跑) |
| OSS 封装 | `lib/oss.ts` (新, ali-oss 6.x 封装) |
| 项目连贯性备份 | `state/HANDOFF-YYYY-MM-DD.md` (cron 每天 22:00 自动生成) |
| 备份 commit | GitHub `master` 分支, `git push origin master` (3 commit/收口) |

---

## 9. 06-26 / 06-27 关键事件 (新)

| 日期 | 事件 | 影响 |
|---|---|---|
| 06-26 | Canvas i2i 修复 (dev 验证通过) | 图生图链路 3 件套: `computeArkSize` MIN_PIXELS=3,686,400 clamp + 上游 outputUrl 转绝对路径 + image 节点必传 `_iIn` |
| 06-27 06:50-08:10 | 阿里云 OSS 接入 (149 条 session) | lib/oss.ts + downloadImageToOss + upload/route.ts 改 OSS 优先, OSS 公共读 + BPA 关后 i2i 生产端到端 |
| 06-27 08:54 | AccessKey rotate | 新主账号 AK `LTAI5...SmDbCx`, 旧 AK `LTAI5...dg9tj` 销毁 (回收站+列表都查不到) |
| 06-27 09:11 | Bucket 防盗链 | 方案 1 (关防盗链, 任意 Referer 都 200) |
| 06-27 08:10-09:50 | SiteNav UI 重构 (user 手动 1h40m) | 286→355 行 (+70), SVG 图标 + 菜单重命名 (主页/工作空间/大脉TV/数据中台) + "登录/切换" 按钮 |
| 06-27 09:50 | **项目连贯性备份** (3 commit 推 master) | `b214eee` feat(oss) + `68df2b5` feat(nav) + `6c7bcf0` docs(state) 推 `006f92e..6c7bcf0` |

---

## 10. 阶段 0/1/2/3 进度 (user 9:50 复盘, 06-27 更新)

| 阶段 | 内容 | 状态 | 阻塞 |
|---|---|---|---|
| **0** | OSS + AK + 公共读 + 防盗链 + i2i 端到端 | ✅ **完成** | - |
| **1** | NAS 备份 + 飞书告警 + Bitable 用户表 | ⚠️ **部分阻塞** | 飞书 webhook URL / NAS 备份 SSH user / ECS 密码 (3 件事 user 还没给) |
| **2** | canvas + project 接飞书 (5-7 天工作日) | ❌ 未启动 | 等阶段 1.3 Bitable 用户表收口 |
| **3** | CDN + 升级 2C/4G (¥80/月) + Sentry | ❌ 未启动 | 等阶段 2 收口 |

**当前阻塞 ask user (清单)**:
1. 飞书告警 webhook URL — 飞书群 → 设置 → 群机器人 → 添加机器人 → 自定义机器人 → 复制 URL
2. NAS 备份 SSH user 确认 + 是否配 key (placeholder 是 `15925670098` 待确认)
3. ECS `47.96.128.172` root 密码 (推 1.1 脚本用, 上 session sshpass 临时密码没继承)
