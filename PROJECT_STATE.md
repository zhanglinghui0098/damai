# Dami 项目状态（真相之源）

> **这是什么**：Hermes Agent 的"项目外脑"。所有重要决策 / 进度 / 阻塞都写在这里，**不依赖 context window 记忆**。
> **何时读**：每个 session 开始 / context 截断后 / 打岔回来时 / 你（用户）说"现在进度到哪了"时。
> **何时写**：每次拍板 / 完成里程碑 / 出现阻塞 / 换方向时。
> **维护人**：Hermes Agent
> **最后更新**：2026-06-18 18:00

> ⚠️ **本文件已升级**：主入口已迁到 [PROJECT.md](PROJECT.md)。本文件保留作历史档案，状态同步在主入口。

---

## 1. 项目一句话

**damai** = AI 武装的家居**ToB 营销案例库**（对标 TapNow TapTV 模式），签约经销商用 AI 工作流生成家居爆款短视频，1 人顶 5 人，试点天禧派 → 顾家 10 经销商。

---

## 2. 当前阶段（**备案等待期 + 私域过渡**）

**整体状态**：🟢 **合规对齐完成 + 私域过渡启动中**

```
[已完成] 域名注册 → damai.net.cn (6/16)
[已完成] 阿里云备案提交 (6/16)
[已完成] 阿里云 ECS 购买 (2vCPU / 0.5GiB)
[进行中] 等备案结果 (10-20 工作日)
[已完成] 合规调研 (6/18) — 砍功能 + TapTV 模式确定 + LibTV 对标确认
[已完成] Vercel 跑早期 demo (damai-gold.vercel.app) — ⚠️ 国内需翻墙
[已完成] 飞书 12 张 Bitable 系统 (不动)
[已完成] tianxipai-bot 飞书机器人 (不动)
[进行中] NAS 私域部署 (39.182.89.211:3000) — 域名下来前用 CF Tunnel 国内直连
[待办]   4 件事 (代码/内容/板块/流程) + 2 新 (合规备案/私域部署) — 见 ROADMAP.md
```

**未拍板（6/18 已大量对齐，⚠️ 别横跳）**：
- ~~部署平台~~ → ✅ **私域过渡 = NAS 跑 Next.js + CF Tunnel**
- ~~ECS 配置~~ → ✅ 等审核通过后看 OOM 再升
- ~~公域视频分享~~ → ❌ **砍**（视听许可证限制）
- ~~公域收款~~ → ❌ **砍**（ICP 经营许可证限制）
- ✅ **公域案例展示 = TapTV 模式**（官方精选 + AI 水印 + Canvas 制作过程）
- ⏳ **算法备案** — 待用户回拨网信办 (010)82990520 确认

---

## 3. 备案前要完成（6/18 重排）

> 用户 6/17 原话："在备案之前能够把网站的基础设计都筹备好…备案之后上线节奏快"
> 用户 6/18 补充："先在 NAS 上做私域，域名下来再移植"

1. **#9 私域部署**（NAS + CF Tunnel）— 国内直连访问
2. **#8 合规备案**（算法备案 + 深度合成标识 + 用户协议）
3. **#1 代码**（鉴权 + 多租户 + 案例库 Canvas + AI 水印）
4. **#2 内容**（3 case study + 5 hero + FAQ 20 条）
5. **#4 板块**（11 页面，公域 6 + 私域 5）
6. **#5 流程**（3 类流程图）

**关键设计原则**（6/18 更新）：
- Day 1 就要支持多租户（`tenant_id` 列成本 0）
- 1:5 护城河靠完整工作流（不是单点功能）
- **不开放用户公域视频上传**（砍掉）
- **公域无收款**（砍掉）
- **公域案例库 = TapTV 模式**（卖工作流不卖视频）
- **AI 内容强制标识**（合规义务）
- 私域过渡 = NAS 跑 Next.js（GFW 绕开）

---

## 4. 决策日志（防止反复横跳）

> 完整决策日志见 [DECISIONS.md](DECISIONS.md)（6/18 已加 7 条新决策）

| 日期 | 决策 | 原因 |
|---|---|---|
| 2026-06-18 | 砍掉用户公域视频分享 | 视听许可证民营拿不到 |
| 2026-06-18 | 砍掉公域收款 | ICP 经营许可证限制 |
| 2026-06-18 | 公域案例库 = TapTV 模式 | 卖工作流不卖视频 |
| 2026-06-18 | 国内对标 = LibTV (liblib.tv) | 已确认 LabTV 实际是 Liblib 旗下 |
| 2026-06-18 | 合规义务清单确认 | 读网信办《生成式人工智能服务管理暂行办法》原文 |
| 2026-06-18 | 私域过渡 = NAS + CF Tunnel | Vercel 国内需翻墙 |
| 2026-06-18 | 任务优先级重排 | 合规 + 私域是新约束 |

---

## 5. 打岔处理协议（防止失忆）

**触发条件**：用户说"等等，先做 X" / "新项目 Y" / "我问你个新问题" / 出现 context compaction

**强制执行**：
1. **先冻结当前项目** → 更新 PROJECT.md"当前阶段" + DECISIONS.md + state.json
2. **再开新任务** → 写到对应新文件 `/opt/data/projects/<name>/PROJECT.md`
3. **回归时** → 先读旧文件，再回应用户

**违反此协议 = 失忆 = 用户体验崩溃。** 这是最高优先级 skill 之一。

---

## 6. 待办（按优先级）— 6/18 更新

### P0（备案期必做，2-3 周）

- [x] **#9 私域部署**（NAS + CF Tunnel）— ✅ **6/18 21:42 完成**，公网 URL `https://thomson-usgs-dispatched-dont.trycloudflare.com`（cloudflared quick-tunnel，URL 每次重启会变）
- [ ] **#8 合规备案**：用户回拨网信办 (010)82990520 问 3 件事
- [ ] **#1 代码**：鉴权 + 多租户 + Canvas + AI 水印 — **in-progress**（11 页面框架已就位，下一步：NextAuth + 飞书 OAuth + 状态中间件）
- [ ] **#2 内容**：3 case study + 5 hero + FAQ 20 条
- [x] **#4 板块**：11 页面（公域 5 + 私域 6）— ✅ **6/18 21:10 完成**（已 5 页面 500 错误已修复，全 200）
- [ ] **#5 流程**：3 类流程图（内部对齐用）— pending
- [ ] AI 内容标识 100% 覆盖
- [ ] 公域首页展示 3 个真实案例（手动筛选 + 审核 + 水印）

### P1（备案中可做）

- [ ] 本地 3 个 commit 决定是否 push 到 GitHub
- [ ] 招 Codex 重新上线写代码（如果 PowerShell 通道确认存在）
- [ ] 爆款选题库（数据看板 P0）
- [ ] 多模型路由（Seedance 2.0 主用）

### P2（备案后做）

- [ ] 部署到阿里云 ECS
- [ ] 域名 `damai.net.cn` 解析到 ECS IP
- [ ] 真实用户测试
- [ ] 算法备案完成

---

## 7. 关键文件位置速查

| 用途 | 路径 |
|---|---|
| Next.js 项目根 | `/opt/data/projects/damai/` |
| 主入口文档 | `/opt/data/projects/damai/PROJECT.md` |
| 决策日志 | `/opt/data/projects/damai/DECISIONS.md` |
| 机器可读进度 | `/opt/data/projects/damai/state.json` |
| 5 件事时间表 | `/opt/data/projects/damai/ROADMAP.md` |
| 任务详细拆解 | `/opt/data/projects/damai/tasks/` |
| Codex 通信目录 | `/opt/data/damai-inbox/{from-codex,to-codex,done}/`（6/15 17:48 停用） |
| 飞书 Bitable 链接 | https://z0f6fp1bjaz.feishu.cn/base/RPvQbE65Ga4pN6sFop1cZfI1nWg |
| Vercel demo | https://damai-gold.vercel.app （跑早期版本，国内需翻墙） |
| NAS 公网 IP | 39.182.89.211 |
| 12 张 Bitable schema | `/opt/data/output/tianxipai_ai_marketing_system/` |

---

## 8. 用户偏好（不写 memory tool，留在项目里）

- 沟通风格：**直接务实**，"我要的是解决问题的方式不是问题本身"
- **别横跳** — 方案定就执行，不许过几轮翻回旧选项
- **付费方案前置披露** — 持续成本 vs 一次性成本分清楚
- **范围严格** — 别主动越界重写用户已 OK 的部分
- **不打无准备的仗** — 操作前先 web_search / 实测验证

---

**下次 session 启动流程**（agent 必读）：
1. 读 `PROJECT.md`（主入口）
2. 读 `state.json`（机器可读进度）
3. 读 `DECISIONS.md`（决策上下文）
4. 读 `ROADMAP.md`（下一步计划）
5. 扫 `codex-deliveries/` 有没有新文件
6. 扫 `hermes-reports/` 上次留了什么
7. **7 件事做完再回应用户**
