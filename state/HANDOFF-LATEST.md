# 大脉项目 — Daily Handoff (2026-06-27)

> **用途**: 抗失忆 + 跨 session 连贯性, 每天 22:00 cron 自动生成
> **下次 session 启动**: 读本文件 + `state/STATUS.md` + `git log --oneline -10`
> **维护**: scripts/daily-handoff.sh

---

## 0. 一句话 (今天做了什么)

- 今天 commit 数: 7
- 改了 16 个文件
- 最近 commit: `b37a3e7` chore(handoff): 2026-06-27 daily handoff backup
- 还在 working tree 没 commit 的: 10 个文件

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
- **公网 URL**: https://damai.net.cn
- **详细**: `state.json` + `ROADMAP.md` 任务总览

## 3. 今日完成 (自动统计)
```
b37a3e7 chore(handoff): 2026-06-27 daily handoff backup
f57afa8 chore(handoff): 2026-06-27 daily handoff backup
0994476 docs(state): 06-27 10:00 PROJECT/ROADMAP/DECISIONS/state.json 4 文件更新 + daily-handoff.sh
6c7bcf0 docs(state): 06-27 9:50 项目连贯性收口
68df2b5 feat(nav): 06-27 9:25 导航 UI 重构 (SVG 图标 + 重命名 + 用户菜单 + 登录按钮)
b214eee feat(oss): 06-27 阿里云 OSS 接入 (run-image + upload + lib/oss + 备份告警脚本)
006f92e fix(canvas): 06-26 完整类型修复 + run-image 安全加固
```

## 4. 明日计划 (待 user 拍板 / 阻塞项)
参见 `state/STATUS.md` 末尾 + `DECISIONS.md` 待拍板段

## 5. 阻塞 ask user (3 件事)
1. **飞书告警 webhook URL** (阶段 1.2 阻塞)
2. **NAS 备份 SSH user 确认** + 是否配 key (阶段 1.1 阻塞)
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
- HEAD: b37a3e7
- 远端: origin/master
- 落后远端: 1 commit
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
