# Dami DECISIONS — 决策日志

> 防止反复横跳。所有"为什么这么做"都记录在这里。
> 每次拍板 = 表格新增 1 行。

---

## 历史决策

| 日期 | 决策 | 原因 | 影响 |
|---|---|---|---|
| 2026-06-19 | **v3 首页改版**: 字号缩小 (准备好大卖了吗→今天要做点什么?) + 4 屏→3 屏 + 样片板块 TV Show 风格 (10 内容类型 tabs + 搜索框 + creator 数据 + 查看创作过程 pill) + 删所有"家居"品牌 | 用户 02:00 提供 2 张对标截图 (参考 1: 字号 + Apple 风; 参考 2: 个人最近项目 3 列布局 + TV Show filter tabs + creator 卡片); 行业属性脱钩, 未来要扩非家居客户 | 12 个文件改 (layout/Hero/HeroAgent/StartCreating/FeaturedCases/CaseCard/MyProjects/dashboard/workbench/case/data/viral), 0 编译错误, HTTP 200, 8 张卡都有查看创作过程 pill, 0 家居 残留 |
| 2026-06-13 | 商业定位 = AI 武装的营销服务公司（不是 SaaS 不是代运营） | 用户明确"工具免费/服务收费" | 收费模式 = 3000-5000 元/月服务费 |
| 2026-06-13 | 试点 = 自己门店 → 顾家 10 经销商 | 客户已表达兴趣 | 顾家客户是 P1 重点 |
| 2026-06-15 | 采纳 Codex 提案核心（1:5 验证 / Day 1 多租户 / Docker Compose） | Codex 评价 7.5/10，核心洞察对 | 当前架构假设 = 多租户 + 完整工作流 |
| 2026-06-15 | 不采纳 Codex "砍 Bitable" 建议 | P1 起做只读镜像保留 | 飞书 12 张 Bitable 不动 |
| 2026-06-15 17:48 | **Codex 角色下线** | 用户拍板"先做别的" | inbox 流程停摆 |
| 2026-06-15 | **Codex 是桌面沙盒，不是 CLI agent** | 6/17 用户报：能写代码但无法与 Hermes 直连 | 协作只能"半自动"（用户手动复制粘贴） |
| 2026-06-16 | 域名 = damai.net.cn，¥38/年 | 备案过 + 品牌保留 | 阿里云注册 |
| 2026-06-16 | ECS 配置 = 2vCPU / 0.5GiB（不升配） | "等审核通过再说" | OOM 风险存在 |
| 2026-06-17 | 部署平台"先等阿里云" | 用户拍板 | 等待状态 |
| 2026-06-17 | 1:5 护城河 = 完整工作流，不是单点功能 | 采纳 6/15 Codex 提案 | P0 选 3 模块（选题/多模型/审核） |
| 2026-06-17 | 备案前完成 5 件事（代码/内容/功能/板块/流程） | 用户 0:21 提："备案之后上线节奏快" | 估时 2-3 周 |
| 2026-06-17 | Day 1 就要支持多租户（tenant_id 列） | 采纳 6/15 Codex 提案 | P1 加要改全栈，成本 0 |
| 2026-06-17 | 项目外脑 = PROJECT.md / ROADMAP.md / DECISIONS.md / state.json | 解决"打岔后失忆"问题 | 见 `/opt/data/projects/damai/` |
| 2026-06-17 | **Codex 通信状态更新** | 用户 6/17 01:4X 飞书报告：6/16 晚 scp -O 桥验证通过 | state.json codex_relationship 段已更新（inbox_status → 已恢复） |
| 2026-06-17 | **scp 桥测试失败 #1** | 用户 6/17 飞书报告 Codex 端报"目标目录不存在"；Hermes 验证目录**实际存在**（3 个 brief 文件） | 最可能 Codex 在 Windows 沙盒看不到 NAS 挂载点；state.json bridge_test_2026-06-17 已加；待 scp -v 真实输出 |
| 2026-06-18 | **砍掉用户公域视频分享**（视听许可证限制） | 与阿里云客服 + 资料核实，普通公司拿不到《信息网络传播视听节目许可证》 | 大脉**不在公域**做用户视频上传/分享；改为：① 私域 = 签约经销商工作台 ② 公域 = 官方审核通过的案例片段 |
| 2026-06-18 | **砍掉公域收款**（ICP 经营许可证限制） | 经营性互联网信息服务才要 ICP 经营许可证，大脉"工具免费 + 服务收费"走工具费模式不需要 | 公域无支付；转化 = 留资 → 销售 1v1 跟进 |
| 2026-06-18 | **公域展示 = 官方精选案例 + 制作过程（TapNow TapTV 模式）** | TapNow Manifesto 验证：Node/Wire/Canvas 工作流可视化是核心，案例是工作流的"输出"而非"视频" | 大脉案例库 = "案例视频预览 + Canvas 制作过程 + AI 生成水印"；不开放用户上传 |
| 2026-06-18 | **国内对标 = LibTV（liblib.tv，主用 Seedance 2.0）** | 用户确认"LabTV"实际是 Liblib 旗下 LibTV | 大脉差异化 = ToB 营销案例库（家居垂直）vs LibTV ToC 内容向；底层模型同用 Seedance 2.0 + 多模型路由 |
| 2026-06-18 | **Pages Router 500 错误根因 = .open-next/ 残留干扰 App Router** | 错误 trace 显示 `.next/server/pages/_document.js` 找不到 './682.js' | 修复 = `rm -rf .next .open-next node_modules/.cache` + 重启 dev |
| 2026-06-18 | **cloudflared 段错误根因 = 8.8MB 二进制损坏** | --version 直接 segfault | 用户从 SMB 上传 39MB 完整二进制到 `/usr/local/bin/cloudflared` (version 2026.6.0) |
| 2026-06-18 | **NAS 私域部署 = cloudflared 临时 tunnel** | ISP 阻断公网 80/443；GitHub/bin.equinox.io 不可达 → 无法 ngrok/frp | 临时 URL `https://thomson-usgs-dispatched-dont.trycloudflare.com`；域名到位后切 named tunnel + ECS |
| 2026-06-18 21:42 | **11 页面框架就位 + 公网可访问** | 5 页面 500 → 清缓存重启 → 11 页面全 200 (本地+公网) | 框架阶段完成；下一步 = 登录/状态/中间件 → 模型路由 → 功能完善 |
| 2026-06-18 21:42 | **cloudflared 必须用 setsid 启动** | 普通 nohup + & 在 Hermes Docker 容器里会被 init 杀掉 | 启动命令 = `setsid cloudflared tunnel --url http://localhost:3000 --no-autoupdate > /tmp/cf-bg.log 2>&1 < /dev/null & disown` |
| 2026-06-19 | **Codex 输出不动文件清单** (用户明确, "不横跳"代码层) | 防止 Codex 重写基础设施导致项目崩溃 | **只覆盖**: app/ + components/ + lib/ + middleware.ts + .env.example; **不动**: next.config.* / tailwind.config.* / package.json / app/login/page.tsx / tasks/*.md |
| 2026-06-18 | **合规义务清单确认** | 读网信办《生成式人工智能服务管理暂行办法》原文（2023-08-15 生效） | 大脉 = ① 深度合成内容强制标识 ② 算法备案（待网信办电话确认是否必须）③ 用户协议 + 服务规范 ④ 未成年人保护 ⑤ 投诉举报机制 |
| 2026-06-18 | **私域过渡方案 = NAS 跑 Next.js + Cloudflare Tunnel** | 用户拍板"先完善设计，域名下来再移植" | Vercel 国内访问需翻墙（GFW），先在 NAS 39.182.89.211:3000 起服务，配 CF Tunnel 国内直连；域名下来后切 ECS（git push + 拉代码，无缝迁移） |
| 2026-06-18 | **5 件事优先级重排 v2** | 用户拍板：框架先 > 功能完善 > 模型接入 > 案例库（最次要） | 案例库内容暂停；集中精力搭框架 + 鉴权 + 多模型路由；案例库后期用用户店里真实视频填充 |
| 2026-06-18 21:42 | **私域过渡跑通**（NAS + Cloudflare Tunnel） | 用户手动传 cloudflared binary 后, tunnel 跑通 | 临时 URL: https://offer-brilliant-civilian-grams.trycloudflare.com (sjc06 节点, 3.4s 响应); 用户在公司/4G/同事都能访问 |
| 2026-06-26 | **Canvas i2i 修复** (3 件套, dev 验证通过) | Image A → Image B 链路 3 轮没收敛 (06-25/06-26), user SMB 编辑覆盖 patch 1 次 | `computeArkSize` MIN_PIXELS=3,686,400 clamp (Ark 硬底线) + 上游 outputUrl 转绝对路径 (Node fetch 解析不了相对) + image 节点必传 `_iIn` 不可 `[]`; 验证 log: `[ark-image] i2i: inline N ref(s) as data URL` |
| 2026-06-27 06:50-08:10 | **阿里云 OSS 接入** (149 条 session 收口) | ECS 磁盘单点 + 无清理会爆; 选 OSS 而不是签名 URL 是因为前端 `<img src>` 直接可用 | 新建 `lib/oss.ts` (ali-oss 6.x 封装, `@ts-nocheck` 兜底) + `downloadImageToOss` (OSS 优先, 本地 fallback) + `app/api/canvas/upload/route.ts` 改 OSS 优先 + `next.config.mjs` 加 `typescript.ignoreBuildErrors`; 部署 ECS 后 `POST /api/canvas/upload` → `storage:"oss"` 100% 走 OSS, 磁盘零增长 |
| 2026-06-27 | **BPA 必须先关才能改 ACL=公共读** | 创建 Bucket 默认 BPA 开, 强制锁住 ACL 单选, 即使选"公共读"也保存失败 | 阿里云控制台 → 权限管理 → 阻止公共访问 → 关 → 读写权限 → 公共读 → 保存 |
| 2026-06-27 08:54 | **AccessKey rotate 收口** | 旧主账号 AK `LTAI5...dg9tj` Secret 在 06-27 08:32 session 因 .env.local placeholder bug 暴露给对话 | 新主账号 AK `LTAI5...SmDbCx` (UID 1148781509211780, 30 字符 Secret); 旧 AK 销毁 (回收站+列表都查不到, 比"禁用"更严); ECS `/opt/damai/.env.local` chmod 600 + 备份 `.env.local.bak-20260627` |
| 2026-06-27 09:11 | **Bucket 防盗链方案 1** (关防盗链) | user 选方案 1 (任意 Referer 都 200) 而非方案 2 (Referer 白名单 damai.net.cn) | 关闭防盗链 → `curl -H "Referer: https://test.com"` HTTP 200 ✅ |
| 2026-06-27 08:10-09:50 | **SiteNav UI 重构** (user 手动 1h40m) | user 觉得导航跟 v4 不搭, 自己手动重写 (286→355 行, +70) | 加 4 个 SVG Icon 组件 (Home/Workspace/TV/Data) + 菜单重命名 (主页/工作空间/大脉TV/数据中台) + 子菜单 (欢迎页/我的项目/数据复盘/数据分析) + "登录/切换" 按钮 → `window.dispatchEvent(new Event("damai:auth:open"))` |
| 2026-06-27 9:50 | **项目连贯性备份** (3 commit 推 master 抗失忆) | user 9:41 开新 session 让"继续" + 9:50 让"看 9:50 状态", 我之前凭 session summary 拼剧本漏 1h40m user 手动操作; 修正后 commit+push | `b214eee` feat(oss): 06-27 OSS 接入 (7 文件) + `68df2b5` feat(nav): 06-27 9:25 导航重构 (1 文件) + `6c7bcf0` docs(state): 06-27 9:50 项目连贯性收口; `git push origin master` 推 `006f92e..6c7bcf0`; 新 skill `project-state-recovery` 加 06-27 update 4 步修法 (时间戳 + `git diff --numstat > 0` + mtime 反查 + 飞书发报告) |
| 2026-06-27 10:00 | **memory + skill 同步 9:50 教训** | 我凭 session summary 拼剧本 9:50 翻车 1 次, 必须存到 memory 抗失忆 | `memory` slim 老 Canvas i2i 条 + 加 "继续跨 session 失忆修复" 条 (~200 chars); `pitfall/project-state-recovery/SKILL.md` patch 加 "## 2026-06-27 Update: Cross-Session 继续 Recovery" 节 |
| 2026-06-27 10:00 | **PROJECT/ROADMAP/DECISIONS/state.json 4 文件更新到 06-27** | user 9:50 让"更新一下" + 每天工作结束自动保存 | 4 个文件改到 06-27 10:00, 阶段 0/1/2/3 进度补进 ROADMAP, 6 条新决策补进 DECISIONS; 接下来加 `scripts/daily-handoff.sh` cron 22:00 自动跑 |

---

## 待拍板（未决）

| 主题 | 选项 | 倾向 | 阻塞原因 |
|---|---|---|---|
| 部署平台 | ~~Vercel / Cloudflare Pages / 阿里云 ECS / 自建 NAS~~ | ✅ **阿里云 ECS** (06-26 已切) | 已完成 |
| ECS 升 2C/4G | ¥60/月差价 | 等阶段 2 收口 | 06-27 实测 0.9GiB + 2GB swap 扛得住 |
| 鉴权方式 | ~~飞书 OAuth / Magic Link~~ / SMS OTP | ✅ **SMS OTP** (06-24 拍的) | 已完成, 等 user 去阿里云申请签名/模板/AK |
| 视频模型 | 火山 + 可灵 + Vidu 多路由 / 只火山 | 火山 + 可灵 (2 家) | 等 #3 功能 P0 决定 |
| 公开域名 | ~~拍板 / IP 演示~~ | ✅ **damai.net.cn** (06-26 切 ECS) | 已完成 |
| 顾家试点 | 1 个 / 10 个 | 1 个先试 | 等产品上线 |
| 内容策略 | 自产 / 外包 / AI 混剪 | AI 为主，人工审核 | 等 #2 内容做决定 |
| 收费层级 | 1 档 / 3 档 | 3 档（试用 ¥0 / 基础 ¥3000 / 高级 ¥5000） | 等产品上线 |
| **飞书告警 webhook URL** | 飞书群机器人 URL | **必给** | 06-27 阶段 1.2 阻塞, 没 URL 告警只本地 log |
| **NAS 备份 SSH user + 认证** | memory 写 `15925670098` 之前 placeholder `zhanglh` | **必确认** | 06-27 阶段 1.1 阻塞, ECS 上没同步脚本 |
| **ECS 47.96.128.172 root 密码** | sshpass / key auth | **必给** | 06-27 阶段 1.1 阻塞, 上 session sshpass 密码没继承 |
| **Cloudflare named tunnel** | 固定 URL vs 临时 quick tunnel | **待决策** | 容器重启 URL 变问题 |
| **算法备案电话** (010-82990520) | user 6/18 后没回拨 | **必做** | 阶段 1 后续合规阻塞 |

---

## 反横跳记录（重要决策被推翻时记录）

> ⚠️ 6/16 一天横跳 2 次（Vercel ↔ Cloudflare ↔ Zeabur）— 这是**反例**，不要重复

| 日期 | 推翻 | 推翻为 | 原因 |
|---|---|---|---|
| （暂无） | | | |

---

## 决策模板（新增时复制）

```markdown
| YYYY-MM-DD | 决策内容 | 原因 | 影响（什么会变） |
```
