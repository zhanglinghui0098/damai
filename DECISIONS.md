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
| 2026-06-18 | **私域过渡跑通**（NAS + Cloudflare Tunnel） | 用户手动传 cloudflared binary 后，tunnel 跑通 | 临时 URL: https://offer-brilliant-civilian-grams.trycloudflare.com (sjc06 节点，3.4s 响应)；用户在公司/4G/同事都能访问 |

---

## 待拍板（未决）

| 主题 | 选项 | 倾向 | 阻塞原因 |
|---|---|---|---|
| 部署平台 | Vercel / Cloudflare Pages / 阿里云 ECS / 自建 NAS | 等阿里云 | 备案通过后才能切 ECS |
| ECS 升 2C/4G | ¥60/月差价 | 等审核 | 当前 0.5GiB 跑 Next.js 经常 OOM |
| 鉴权方式 | 飞书 OAuth / Magic Link / SMS OTP | 飞书 OAuth（已有 App） | 等 #1 代码任务做决定 |
| 视频模型 | 火山 + 可灵 + Vidu 多路由 / 只火山 | 火山 + 可灵（2 家） | 等 #3 功能 P0 决定 |
| 公开域名 | 拍板 / IP 演示 | 备案前用 Vercel 子域名 | 备案后切 damai.net.cn |
| 顾家试点 | 1 个 / 10 个 | 1 个先试 | 等产品上线 |
| 内容策略 | 自产 / 外包 / AI 混剪 | AI 为主，人工审核 | 等 #2 内容做决定 |
| 收费层级 | 1 档 / 3 档 | 3 档（试用 ¥0 / 基础 ¥3000 / 高级 ¥5000） | 等产品上线 |

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
