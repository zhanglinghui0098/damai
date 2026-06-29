# 大脉项目 — Daily Handoff (2026-06-29 19:15, manual update 收口)

> **用途**: 抗失忆 + 跨 session 连贯性
> **维护**: 06-29 19:15 手动更新 (本次 session 收口)
> **下次 session 启动**: 读本文件 + `state/README.md` (新入口) + `state/STATUS.md` + `git log --oneline -15`

---

## 0. 一句话 (今天 06-29 做了什么)

- **session 时长**: 11:00 - 19:15 = 8h15min (中间断过 2 次 user inactivity, 06-27 教训 验证 8h+ context 撑爆)
- **commit 数 (06-29 整日)**: 14 (从 48c783a deploy fix 到 ddfa331 fix(canvas) bezier+arrow)
- **关键里程碑**: P0 #1-5 全完成 (除 P0 #5 verify-code 最后 1 步) / P1 #2.1 S1-S3 / Canvas 4 轮修 / OSS 3.6G 迁移 / state/ 完整化
- **最近 commit**: `ddfa331 fix(canvas): 连接线改贝塞尔+箭头+SVG覆盖全区域` (19:10 deploy 终态)
- **本地领先 origin**: 4 commit (1c3be77, a163d0f, de85d9c, ddfa331 vs origin e7aaefd) — push 等网络好

## 1. 商业方案 (静态)

- **项目**: 大脉 = AI 武装的家居 ToB 营销案例库 (对标 TapNow 模式)
- **客户**: 张凌辉 / 杭州即客传媒 / 天禧派 (城北万象城 2000方)
- **路径**: 天禧派自己门店 → 顾家家居 10 经销商
- **收费**: 工具免费 + 服务收费 (¥3000-5000/月)
- **护城河**: 1:5 = 完整工作流, 不是单点功能
- **详细**: `PROJECT.md` §1

## 2. 当前阶段 (动态)

- **v2.7.0** phase: 阶段 0 完成 + 阶段 1 部分阻塞 + 备案在审
- **phase_status**: phase_0_done_phase_1_partial_blocked
- **公网 URL**: https://damai.net.cn (阿里云轻量 SWAS 47.96.128.172, **不是 ECS**)
- **详细**: `state.json` + `ROADMAP.md` 任务总览

## 3. 今日完成 (06-29 整日 14 commits)

```
ddfa331 fix(canvas): 连接线改贝塞尔+箭头+SVG覆盖全区域 (19:10) ★ 终态
de85d9c chore(gitignore): 忽略 tsconfig.tsbuildinfo build cache (19:10)
e7aaefd docs(state): 4T 共享盘 state/ 完整化 + 旧 brief 标过期 (18:30) ★ 推过 origin
7c31971 docs(canvas): 加注释说明 zoom 缩放不影响 UI 元素的架构
a163d0f fix(canvas): 连接线改正交阶梯 (像即梦/TapNow 竞品), 移除 cubic bezier 飘线 (18:41)
1c3be77 fix(canvas): port 默认 subtle 永远可见 + toolbar 节点不走 click 位置 (3 真 bug 修)
34f9481 fix(canvas): SVG 10400x9600 覆盖全 panning 区域 + 线条加粗 + toolbar 用真实点击位置 (18:00)
937137f fix(deploy): cleanup tar + 旧 bak (server 30G 小, 留最新 1 个 bak) (16:54)
81e2e22 fix(canvas): 右键回退到 panning, 保留双向 port + 5 真 bug 修 (16:54)
2afd8cc feat(cases): 迁移 3.6G 视频到 OSS, server 释放 3.6G (13:00)
bbc3b85 fix(canvas): 06-29 17:00 修 2 个画布 bug (链接线没了 + 新节点跑画外) (11:30)
48c783a fix(deploy): admin + sudo + pm2 env refresh (10:00)
29122a0 feat(api): P1 #2.1 飞书项目表 S3 — 4 API routes + MyProjects (10:00)
55ab837 feat(bitable): P1 #2.1 飞书项目表 S1+S2 — 00_项目表 (09:00)
1e825c1 fix(canvas): 06-29 14:55 紧急恢复 Codex 同步覆盖的 CanvasEditor.tsx (09:30)
```

## 4. 阻塞 ask user (1 件)

- [ ] **P0 #5 verify-code 收口**: 你手机 15925670098 19:10 收到 1 条杭州即客传媒的验证码短信, 贴 6 位数给我, 我跑 verify-code 收 P0 #5

(06-29 之前 3 件全通: 飞书告警 webhook → 改 OpenAPI 直推 / NAS SSH user → admin + NOPASSWD sudo / ECS root 密码 → SWAS 不是 ECS, admin + sudo 路径已通)

## 5. 关键新存档 (任何 agent 必读)

| 文件 | 大小 | 何时读 |
|---|---|---|
| `state/README.md` | 5KB / 120 行 | session 第一件事, 路径速查 + 必读 4 件套 + 3 警告 |
| `state/STATUS.md` | 33KB / 524+ 行 | 当前状态 + 决策 + 教训 |
| `state/BACKLOG.md` | 7KB / 116+ 行 | ✅ 已完成 + 🚧 进行中 + ⏳ 阻塞 |
| `state/HANDOFF-LATEST.md` | 本文件 | 跨 session 交接 |
| `codex-deliveries/damai-codex-brief-overview.md` | ⚠️ 已过期 | **不要读**, 改读 state/README.md |

## 6. 19:15 当前 canvas 行为 (终态, ddfa331)

- **连接线**: cubic bezier 平滑曲线 (cp = max(NODE_W*0.4, |dx|*0.5, |dy|*0.5))
- **箭头**: `<marker id="arrow">` + `<marker id="arrow-pending">`, path markerEnd 引用
- **线条颜色**: rgba(110, 180, 255, 0.75), pending 时 (160, 200, 255, 0.9)
- **strokeWidth**: 2 / pending 2.5
- **SVG 大小**: 10400×9600 (覆盖 4000px margin 全 panning 区域, 跨 margin 也能看到连接线)
- **port**: subtle 状态 opacity 0.32 scale 0.65 (默认), hover 时 full + breathing
- **toolbar**: click 在画布内 → 走 click 位置 (点哪出哪); click 在菜单 → 走 lastMouseRef (user 终态设计)
- **right-click**: panning (右键回退过)
- **port 拖线**: 双向 (input → output 或 output → input)

## 7. 改了什么下次注意

- **P1 #2.1 S4** (dashboard ProjectsTab 接真 Bitable) — 下 session 必做
- **P0 #5 verify-code 收口** — 等 user 贴 6 位验证码
- **Codex 不要再 touch /opt/damai (生产 SWAS)**, 必须用 deploy 脚本
- **Codex workdir**: `Z:\damai\hermes-project\damai` (Windows) 或 `/opt/data/projects/damai` (容器内)
- **画布不要加 @xyflow/react**, 是自研 SVG
- **deploy 前必看 `git diff`** (防误并 commit, 0d380f8 教训)

## 8. 06-29 紧急 lesson (给所有 agent)

1. **session 必读 state/README.md**, 不读就改代码 = 必错
2. **改完代码必更新 state/STATUS.md** (下次接手失忆)
3. **部署 = 阿里云 SWAS, 不是 ECS** (user 多次骂)
4. **画布 = 自研 SVG**, 不是 React Flow
5. **Codex 同步覆盖 working tree = 大事故** (06-29 14:55 应急过, 5min 恢复)
6. **commit 前必看 diff** (0d380f8 误并, reset --soft 拆 2 commit 修复)
7. **pm2 restart 不读 .env.local** (deploy 完等 30s, curl send-code, stub 就 pkill -9 + pm2 auto-respawn)
8. **长 session 8h+ context 撑爆** (06-29 验证, 必收口: 推 commit + state/ 收口 + 开新 session)

## 9. Git 状态 (19:15)

- **本地 HEAD**: `ddfa331 fix(canvas): 连接线改贝塞尔+箭头+SVG覆盖全区域`
- **origin/master**: `e7aaefd docs(state): 4T 共享盘 state/ 完整化` (落后 4 commit)
- **落后/领先**: 本地领先 4 commit (1c3be77, a163d0f, de85d9c, ddfa331)
- **未推送原因**: 18:30 e7aaefd 推过, 18:41-19:10 网络不稳 push 卡住
- **下一次 push**: `git push origin master --force-with-lease` (origin 落后, 需 force)

## 10. 下个 session 任务 (按优先级)

1. **P0 #5 verify-code 收口**: 跑 `curl POST /api/auth/verify-code` 用 user 贴的 6 位数
2. **push 落后 4 commit**: 等网络好, `git push origin master --force-with-lease`
3. **P1 #2.1 S4**: dashboard ProjectsTab 接真 Bitable (替换 mock-data-workbench)
4. **user 硬刷测画布**: Ctrl+Shift+R 测 bezier 平滑 / 箭头方向 / SVG 10400 跨 margin
5. **讨论技术问题** (user 19:15 说要新开 session 讨论)

---

## 维护说明

- 本文件 19:15 手动收口更新
- 下次 cron 跑会覆盖本文件, 但 4 件套 (README/STATUS/BACKLOG/HANDOFF-LATEST) 会保持 current
- 每日 22:00 自动备份 (scripts/daily-handoff.sh)
