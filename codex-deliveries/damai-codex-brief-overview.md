<!-- damai-codex-brief-overview.md
     ⚠️ 2026-06-29 已过期
     不要再用这个 brief! 改读 state/README.md (4T 盘, Windows Z:\damai\hermes-project\damai\state\)
     state/README.md 永远 current, 每次 session 必读
     保留这个文件仅作历史, 不再分发
     — Hermes Agent
     ============================
     原: 2026-06-18T23:07:23+08:00
     用途: 让 Codex 了解大脉项目全部工作进度 + 当前状态
     用法: 你复制整个文件 → 贴给 Codex → 它就知道项目全貌
     大小目标: 10-15KB

     ⚠️ 重要: 公网 URL 临时, 每次重启 cloudflared 会变
     稳定 URL 需要 named tunnel (Codex 不要假设 URL 不变)
-->

# ⚠️ 此 brief 已过期 (6/18 → 6/29), 改读 state/README.md

**正确入口**:
- 容器内: `/opt/data/projects/damai/state/README.md`
- Windows SMB: `Z:\damai\hermes-project\damai\state\README.md`
- 必读 4 件套: `README.md` → `STATUS.md` (32KB) → `BACKLOG.md` → `HANDOFF-LATEST.md`

**为什么这个 brief 过期了**:
- 6/18 之后: 阿里云 OSS 接入 (06-27) + 阿里云 SMS 真发 (06-29) + 画布 3 轮修 (06-29) + 部署脚本修 (06-29) + 飞书项目表 API (06-29) + state/ 完整化 (06-29)
- 总计 50+ commit, 6+ 关键决策, 5+ 部署修复
- 旧 brief 没覆盖这些, 会误导

**如果 user 让你看这个 brief, 礼貌拒绝并指向 state/README.md**:
> "这个文件 2026-06-29 已过期. 项目进度和决策都写到 state/ 里 (4T 盘), 入口是 state/README.md. 请让我先读那个."

# Dami Codex Brief — 项目总览 (6/18 v2.1, ⚠️ 已过期, 改读 state/README.md)

## Part 1: PROJECT.md (项目入口, 6.4KB)

# Dami 项目 — 入口文档

> **这是什么**：Hermes Agent 的"项目外脑"。所有重要决策 / 进度 / 任务都写在这里，**不依赖 context window 记忆**。
> **何时读**：每个 session 第一件事 / context 截断后 / 你（用户）问"现在进度到哪"时。
> **维护人**：Hermes Agent
> **最后更新**：2026-06-18 18:00 |
> **当前状态**: 🟢 **合规对齐完成 + 私域过渡启动** — 备案在审（10-20 工作日），同步 NAS 跑 Next.js

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

## Part 2: state.json (机器可读进度, 2.5KB)

{
    "version": "2.1.0",
    "last_updated": "2026-06-18T21:42:00+08:00",
    "current_phase": "\u6846\u67b6\u53ef\u8bbf\u95ee \u2014 \u516c\u7f51\u53ef\u8bbf\u95ee",
    "phase_status": "framework_built_and_deployed",
    "deployment": {
        "public_url": "https://thomson-usgs-dispatched-dont.trycloudflare.com",
        "internal_url": "http://127.0.0.1:3000",
        "tunnel_type": "cloudflared quick-tunnel (\u4e34\u65f6)",
        "tunnel_note": "URL \u6bcf\u6b21\u91cd\u542f cloudflared \u4f1a\u53d8\u3002\u7a33\u5b9a\u9700\u8981 named tunnel (\u9700 Cloudflare \u8d26\u53f7 + \u57df\u540d)\u3002",
        "dev_server_pid": 77238,
        "cloudflared_pid": 77967,
        "next_step_after_domain": "\u57df\u540d\u5230\u4f4d\u540e\u5207\u5230 ECS (\u963f\u91cc\u4e91 0.5GiB) + named tunnel + \u56fd\u5185 CDN"
    },
    "tasks": {
        "01_\u4ee3\u7801\u6846\u67b6": {
            "status": "in_progress",
            "progress": 95,
            "note": "11 \u9875\u9762\u5168\u90e8 HTTP 200 (\u672c\u5730 + \u516c\u7f51)\uff0c\u6846\u67b6\u57fa\u672c\u5c31\u4f4d"
        },
        "02_\u529f\u80fd\u5b8c\u5584": {
            "status": "pending",
            "progress": 0,
            "next_actions": [
                "\u767b\u5f55/\u6388\u6743 (NextAuth.js + \u98de\u4e66 OAuth)",
                "\u79df\u6237\u9694\u79bb (middleware)",
                "AI \u89c6\u9891\u751f\u6210 (\u6a21\u578b\u8def\u7531)",
                "Canvas \u5de5\u4f5c\u6d41 (Node/Wire/Group)",
                "\u6570\u636e\u770b\u677f (\u63a5\u53e3 + \u56fe\u8868)",
                "\u5ba1\u6838\u6d41\u7a0b (\u63d0\u4ea4\u2192\u5ba1\u6838\u2192\u53d1\u5e03)"
            ]
        },
        "03_\u6a21\u578b\u63a5\u5165": {
            "status": "pending",
            "progress": 0,
            "blocked_on": "\u7528\u6237\u9700\u63d0\u4f9b API keys (\u706b\u5c71\u65b9\u821f Seedance 2.0 / \u5373\u68a6 / \u53ef\u7075 / Vidu)",
            "architecture": "\u6a21\u578b\u8def\u7531\u5c42 (model router) \u2014 \u8f93\u5165\u4efb\u52a1\u2192\u9009\u6700\u5408\u9002\u6a21\u578b\u2192\u51fa\u7247\u2192\u52a0\u6c34\u5370"
        },
        "04_\u6848\u4f8b\u5e93": {
            "status": "pending",
            "progress": 0,
            "priority": "lowest",
            "note": "\u7528\u6237\u81ea\u884c\u7528\u5de5\u5177\u751f\u6210\u6848\u4f8b\u540e\u4e0a\u4f20 (TapTV \u6a21\u5f0f: Node/Wire/Canvas \u5de5\u4f5c\u6d41\u56fe\uff0c\u975e\u539f\u59cb\u89c6\u9891)"
        },
        "05_\u5408\u89c4\u6a21\u677f": {
            "status": "in_progress",
            "progress": 30,
            "next_actions": [
                "AI \u6807\u8bc6 (\u7b2c\u5341\u4e8c\u6761) \u2014 \u6240\u6709\u751f\u6210\u89c6\u9891\u5f3a\u5236\u52a0 'AI \u751f\u6210' \u6c34\u5370",
                "\u7b97\u6cd5\u5907\u6848 (\u7b2c\u5341\u4e03\u6761) \u2014 \u5f85\u7f51\u4fe1\u529e (010)82990520 \u7535\u8bdd\u786e\u8ba4\u662f\u5426\u5fc5\u987b",
                "\u79c1\u57df\u5206\u53d1\u7b56\u7565 (\u5907\u6848\u524d\u53ea\u670d\u52a1 B \u7aef\u7b7e\u7ea6\u5ba2\u6237)"
            ]
        }
    },
    "build_history": {
        "v1_2026-06-12": "Vercel \u4e0a\u7ebf (commit dc47be2)",
        "v2_2026-06-18_2045": "11 \u9875\u9762\u6846\u67b6\u5c31\u4f4d + 5 \u9875\u9762 500 \u9519\u8bef (Pages Router \u51b2\u7a81)",
        "v2_2026-06-18_2110": "\u6e05\u7a7a .next/.open-next/.cache \u2192 11 \u9875\u9762\u5168 200",
        "v2_2026-06-18_2142": "cloudflared setsid \u542f\u52a8 \u2192 \u516c\u7f51 9 \u9875\u9762\u5168 200"
    },
    "next_priority": "01_\u4ee3\u7801\u6846\u67b6 \u6536\u5c3e (\u767b\u5f55/Cookie/\u72b6\u6001) \u2192 02_\u529f\u80fd\u5b8c\u5584"
}

## Part 3: 关键决策 (DECISIONS.md 6/18 新增 8 条)

| 日期 | 决策 | 影响 |
|---|---|---|
| 2026-06-18 | **砍掉用户公域视频分享**（视听许可证限制） | 与阿里云客服 + 资料核实，普通公司拿不到《信息网络传播视听节目许可证》 | 大脉**不在公域**做用户视频上传/分享；改为：① 私域 = 签约经销商工作台 ② 公域 = 官方审核通过的案例片段 |
| 2026-06-18 | **砍掉公域收款**（ICP 经营许可证限制） | 经营性互联网信息服务才要 ICP 经营许可证，大脉"工具免费 + 服务收费"走工具费模式不需要 | 公域无支付；转化 = 留资 → 销售 1v1 跟进 |
| 2026-06-18 | **公域展示 = 官方精选案例 + 制作过程（TapNow TapTV 模式）** | TapNow Manifesto 验证：Node/Wire/Canvas 工作流可视化是核心，案例是工作流的"输出"而非"视频" | 大脉案例库 = "案例视频预览 + Canvas 制作过程 + AI 生成水印"；不开放用户上传 |
| 2026-06-18 | **国内对标 = LibTV（liblib.tv，主用 Seedance 2.0）** | 用户确认"LabTV"实际是 Liblib 旗下 LibTV | 大脉差异化 = ToB 营销案例库（家居垂直）vs LibTV ToC 内容向；底层模型同用 Seedance 2.0 + 多模型路由 |
| 2026-06-18 | **Pages Router 500 错误根因 = .open-next/ 残留干扰 App Router** | 错误 trace 显示 `.next/server/pages/_document.js` 找不到 './682.js' | 修复 = `rm -rf .next .open-next node_modules/.cache` + 重启 dev |
| 2026-06-18 | **cloudflared 段错误根因 = 8.8MB 二进制损坏** | --version 直接 segfault | 用户从 SMB 上传 39MB 完整二进制到 `/usr/local/bin/cloudflared` (version 2026.6.0) |
| 2026-06-18 | **NAS 私域部署 = cloudflared 临时 tunnel** | ISP 阻断公网 80/443；GitHub/bin.equinox.io 不可达 → 无法 ngrok/frp | 临时 URL `https://thomson-usgs-dispatched-dont.trycloudflare.com`；域名到位后切 named tunnel + ECS |
| 2026-06-18 21:42 | **11 页面框架就位 + 公网可访问** | 5 页面 500 → 清缓存重启 → 11 页面全 200 (本地+公网) | 框架阶段完成；下一步 = 登录/状态/中间件 → 模型路由 → 功能完善 |
| 2026-06-18 21:42 | **cloudflared 必须用 setsid 启动** | 普通 nohup + & 在 Hermes Docker 容器里会被 init 杀掉 | 启动命令 = `setsid cloudflared tunnel --url http://localhost:3000 --no-autoupdate > /tmp/cf-bg.log 2>&1 < /dev/null & disown` |
| 2026-06-18 | **合规义务清单确认** | 读网信办《生成式人工智能服务管理暂行办法》原文（2023-08-15 生效） | 大脉 = ① 深度合成内容强制标识 ② 算法备案（待网信办电话确认是否必须）③ 用户协议 + 服务规范 ④ 未成年人保护 ⑤ 投诉举报机制 |
| 2026-06-18 | **私域过渡方案 = NAS 跑 Next.js + Cloudflare Tunnel** | 用户拍板"先完善设计，域名下来再移植" | Vercel 国内访问需翻墙（GFW），先在 NAS 39.182.89.211:3000 起服务，配 CF Tunnel 国内直连；域名下来后切 ECS（git push + 拉代码，无缝迁移） |
| 2026-06-18 | **5 件事优先级重排 v2** | 用户拍板：框架先 > 功能完善 > 模型接入 > 案例库（最次要） | 案例库内容暂停；集中精力搭框架 + 鉴权 + 多模型路由；案例库后期用用户店里真实视频填充 |

## Part 4: 协作约定 (Codex 必读)

### 你的位置
- 你 (Codex) 是**桌面沙盒**, 不能直接读 NAS 文件
- 你 (Codex) 跟 Hermes (在 NAS 容器) **完全独立**, 没有直接通信
- 中间人 = **用户**, 通过 SMB 共享 + 复制粘贴

### 你能做的事
1. 读这个 brief, 知道项目全貌
2. 在你自己的沙盒写代码/做设计
3. 输出一份 markdown 报告 (决策 + diff + 测试结果) 给用户

### 你的输出格式 (用户复制回 NAS 用)
  把报告保存为: 2026-MM-DD-taskNN-delivery.md
  命名示例: 2026-06-19-task01-delivery.md
  路径(用户操作): /volume1/10T/Hermes/damai/codex-deliveries/
  然后告诉我 (Hermes) 'Codex 交报告了', 我 (Hermes) 读 + 评估

### 你的工作目录 (Hermes 现状, 你可以参考设计)
  - 11 页面都在 `/opt/data/projects/damai/app/*/page.tsx`
  - 你写的代码会同步到 SMB: `/volume1/10T/Hermes/damai/` (用户可访问)
  - 框架就位 (11 页面 HTTP 200), 公网 URL 可用 (但临时)

## Part 5: 你的任务清单 (按优先级, 6/18 锁定)

### Task 00 (in_progress, 95%): 框架搭设
  - 11 页面已就位, 本地 + 公网全 200
  - **待做**: NextAuth + 飞书 OAuth + tenant middleware
  - Spec: /opt/data/projects/damai/tasks/00-framework.md (7KB)
  - DoD: `/login` 能跳转飞书 OAuth, 登录后 `/dashboard` 显示真实用户

### Task 01 (pending): 鉴权 + 多租户 + AI 水印
  - Spec: /opt/data/projects/damai/tasks/01-code.md (4.4KB)
  - DoD: middleware 隔离租户, AI 生成视频强制加 'AI 生成' 水印

### Task 02 (pending): 内容
  - Spec: /opt/data/projects/damai/tasks/02-content.md
  - DoD: 3 case study + 5 hero + FAQ 20 条

### Task 03 (pending): 多模型路由 (P1 重要)
  - Spec: /opt/data/projects/damai/tasks/03-features-p0.md
  - 架构: Seedance 2.0 (主) + 即梦/可灵/Vidu (备)
  - **需要用户先提供 API keys 才能测试**

### Task 04 (pending): 板块 (基本完成, 微调)
  - Spec: /opt/data/projects/damai/tasks/04-pages.md

## Part 6: 你不应该做的事

- ❌ 假设公网 URL 不会变 (每次重启会变)
- ❌ 改 `app/page.tsx` 之外的页面 (用户优先级: 框架先, 别动静态内容)
- ❌ 假设你能用 npm install (Hermes 容器网络受限, 必须用户用 SMB 传文件)
- ❌ 给 Hermes 提反建议 (决策都写在 DECISIONS.md, 有疑问先问用户)
- ❌ 直接 push git (无凭据, 只能让用户手动 push)

## Part 7: 关键事实 (防止重复问)

- **公网 URL**: `https://thomson-usgs-dispatched-dont.trycloudflare.com` (临时)
- **本地 URL**: `http://127.0.0.1:3000` (Hermes 容器内)
- **NAS IP**: 39.182.89.211 (ISP 阻断 80/443, 所以用 CF Tunnel)
- **Bitable**: https://z0f6fp1bjaz.feishu.cn/base/RPvQbE65Ga4pN6sFop1cZfI1nWg
- **飞书 App ID**: cli_aa9768a568b8dcb6 (Hermes 已有)
- **SMB 共享**: `/volume1/10T/Hermes/damai/` (你代码会同步到这里)
- **Hermes 容器限制**: 无 docker / 无 SSH / 网络受限 (GitHub ❌, npm ✅, aliyun ✅)

