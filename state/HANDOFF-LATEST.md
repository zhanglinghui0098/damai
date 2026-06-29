# 大脉项目 — Daily Handoff (2026-06-29 18:30, manual update)

> **用途**: 抗失忆 + 跨 session 连贯性
> **维护**: 06-29 18:30 手动更新 (user 反馈其他 agent 一直改错, 写全 handoff)
> **下次 session 启动**: 读本文件 + `state/README.md` (新入口) + `state/STATUS.md` + `git log --oneline -10`

---

## 0. 一句话 (今天做了什么)

- 今天 commit 数: 8+ (06-29 整日)
- 关键里程碑: P0 #1-5 全完成 / P1 #2.1 S1-S3 / Canvas 3 轮修 / OSS 3.6G 迁移 / state/ 完整化
- 最近 commit: `34f9481 fix(canvas): SVG 10400x9600 + 线条 + toolbar`
- **新增存档** (06-29 18:30): `state/README.md` (5KB, 强制所有 agent 必读, 治"其他 agent 改错")

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
- **公网 URL**: https://damai.net.cn (阿里云轻量 SWAS 47.96.128.172, 不是 ECS)
- **详细**: `state.json` + `ROADMAP.md` 任务总览

## 3. 今日完成 (06-29 整日)

```
34f9481 fix(canvas): SVG 10400x9600 + 线条 + toolbar (18:00)
937137f fix(deploy): cleanup tar + 旧 bak (撑爆 30G 盘根因) (16:54)
81e2e22 fix(canvas): 右键回退 panning, 保留双向 port + 5 真 bug 修 (16:54)
2afd8cc feat(cases): 迁移 3.6G 视频到 OSS, server 释放 3.6G (13:00)
bbc3b85 fix(canvas): 链接线消失 + 新节点位置跑到画外 (11:30)
48c783a fix(deploy): admin + sudo + pm2 env refresh (10:00)
29122a0 feat(api): P1 #2.1 飞书项目表 S3 — 4 API routes + MyProjects (10:00)
55ab837 feat(bitable): P1 #2.1 飞书项目表 S1+S2 — 00_项目表 (09:00)
1e825c1 fix(canvas): 06-29 14:55 紧急恢复 Codex 同步覆盖的 CanvasEditor.tsx (09:30)
```

## 4. 阻塞 ask user (0 件 — 都通了)

**06-29 之前 3 件全通**:
- ✅ 飞书告警 webhook URL — 改用 OpenAPI 直推, 不需要 webhook
- ✅ NAS 备份 SSH user — admin + NOPASSWD sudo + ed25519 密钥, 全跑通
- ✅ ECS root 密码 — SWAS 不是 ECS, admin + sudo 路径已通, 不需要 root

**06-29 唯一 ask**:
- [ ] 收 SMS 验证码 (15925670098, 已真发 1 条) → 贴 6 位数 → 跑 verify-code 收 P0 #5

## 5. 关键新存档 (任何 agent 必读)

| 文件 | 大小 | 何时读 |
|---|---|---|
| `state/README.md` | 5KB | session 第一件事, 路径速查 + 必读 4 件套 + 3 警告 |
| `state/STATUS.md` | 33KB | 当前状态 + 决策 + 教训 |
| `state/BACKLOG.md` | 7KB | ✅ 已完成 + 🚧 进行中 + ⏳ 阻塞 |
| `state/HANDOFF-LATEST.md` | 本文件 | 跨 session 交接 |
| `codex-deliveries/damai-codex-brief-overview.md` | ⚠️ 已过期 | **不要读**, 改读 state/README.md |

## 6. 改了什么下次注意

- **P1 #2.1 S4** (dashboard ProjectsTab 接真 Bitable) — 下 session 必做
- **P0 #5 verify-code 收口** — 等 user 贴 6 位验证码
- **Codex 不要再 touch /opt/damai (生产 SWAS)**, 必须用 deploy 脚本
- **Codex workdir**: `Z:\damai\hermes-project\damai` (Windows) 或 `/opt/data/projects/damai` (容器内)
- **画布不要加 @xyflow/react**, 是自研 SVG

## 7. 06-29 紧急 lesson (给所有 agent)

1. **session 必读 state/README.md**, 不读就改代码 = 必错
2. **改完代码必更新 state/STATUS.md** (下次接手失忆)
3. **部署 = 阿里云 SWAS, 不是 ECS** (user 多次骂)
4. **画布 = 自研 SVG**, 不是 React Flow
5. **Codex 同步覆盖 working tree = 大事故** (06-29 14:55 应急过, 5min 恢复)

---

## 维护说明
- 每天 22:00 cron 之前本文件被覆盖 (scripts/daily-handoff.sh 自动跑)
- 06-29 18:30 是**手动**更新, 因为 user 觉得其他 agent 改错, 提前写完整 handoff
- 下次 cron 跑会覆盖本文件, 但 4 件套 (README/STATUS/BACKLOG/HANDOFF-LATEST) 会保持 current
3. **ECS 47.96.128.172 root 密码** (推 1.1 脚本用)

## 6. 关键文件位置
- `PROJECT.md` — 项目入口
- `ROADMAP.md` — 任务总览
- `DECISIONS.md` — 决策日志
- `state.json` — 机器可读进度
- `state/STATUS.md` — 状态详情
- `state/HANDOFF-LATEST.md` — 最新 handoff (本文件的副本)

## 7. Agent 操作原则 (硬规则)
- 6 步启动 checklist: state.json → PROJECT.md → DECISIONS.md → ROADMAP.md → codex-deliveries/ → hermes-reports/
- 不要盲信 user "X 已建立" → 先验证
- 改状态文件前问"我亲眼看到 vs user 说的"是否一致
- "继续"= 接上一 session 末尾, 不是新事

## 8. Git 状态
- HEAD: 71b14c0
- 远端: origin/master
- 落后远端: 2 commit
- 未提交: 10 个文件
```
 M app/api/agent/route.ts
 M app/canvas/[id]/CanvasEditor.tsx
 M app/canvas/[id]/page.tsx
 M app/case/[id]/CanvasViewer.tsx
 M app/case/[id]/page.tsx
 M app/case/page.tsx
 M app/dashboard/page.tsx
 M app/data/analytics/page.tsx
 M app/data/layout.tsx
 M app/data/review/page.tsx
```

## 9. 教训 (按 06-27 update 累计)
- **mtime 假阳性**: 35 个 M 文件但 numstat 0 0 = 没改
- **session_search summary ≠ transcript**: 必须 git diff + mtime 反查
- **commit 范围**: `numstat > 0` 过滤, 别 `git add -A`
- **时间戳**: `datetime.fromtimestamp(t, UTC+8)` 换算
