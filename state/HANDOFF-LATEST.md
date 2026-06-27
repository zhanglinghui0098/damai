# 大脉项目 — Daily Handoff (YYYY-MM-DD)

> **用途**: 抗失忆 + 跨 session 连贯性, 每天 22:00 cron 自动生成
> **下次 session 启动**: 读本文件 + `state/STATUS.md` + `git log --oneline -10`
> **维护**: scripts/daily-handoff.sh

---

## 0. 一句话 (今天做了什么)

- 今天 commit 数: 5
- 改了 14 个文件
- 最近 commit: `0994476` docs(state): 06-27 10:00 PROJECT/ROADMAP/DECISIONS/state.json 4 文件更新 + daily-handoff.sh
- 还在 working tree 没 commit 的: 10 个文件

## 1. 商业方案 (静态)
- **项目**: 大脉 = AI 武装的家居 ToB 营销案例库 (对标 TapNow 模式)
- **客户**: 张凌辉 / 杭州即客传媒 / 天禧派 (城北万象城 2000方)
- **路径**: 天禧派自己门店 → 顾家家居 10 经销商
- **收费**: 工具免费 + 服务收费 (¥3000-5000/月)
- **护城河**: 1:5 = 完整工作流, 不是单点功能
- **详细**: `PROJECT.md` §1

## 2. 当前阶段 (动态)
- **v2.7.0** phase: $(jq -r '.current_phase' state.json)
- **phase_status**: $(jq -r '.phase_status' state.json)
- **公网 URL**: $(jq -r '.deployment.public_url' state.json)
- **详细**: `state.json` + `ROADMAP.md` 任务总览

## 3. 今日完成 (自动统计)
```
$(git log --since="midnight" --pretty=format:"%h %s" 2>/dev/null | head -20 || echo "no commit today")
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
- HEAD: 0994476
- 远端: $(git rev-parse --abbrev-ref @{u} 2>/dev/null || echo "no upstream")
- 落后远端: $(git rev-list --left-only --count HEAD...@{u} 2>/dev/null || echo "?") commit
- 未提交: $(echo " M app/api/agent/route.ts
 M app/canvas/[id]/CanvasEditor.tsx
 M app/canvas/[id]/page.tsx
 M app/case/[id]/CanvasViewer.tsx
 M app/case/[id]/page.tsx
 M app/case/page.tsx
 M app/dashboard/page.tsx
 M app/data/analytics/page.tsx
 M app/data/layout.tsx
 M app/data/review/page.tsx" | grep -c "^" || echo "0") 个文件
```
$(echo " M app/api/agent/route.ts
 M app/canvas/[id]/CanvasEditor.tsx
 M app/canvas/[id]/page.tsx
 M app/case/[id]/CanvasViewer.tsx
 M app/case/[id]/page.tsx
 M app/case/page.tsx
 M app/dashboard/page.tsx
 M app/data/analytics/page.tsx
 M app/data/layout.tsx
 M app/data/review/page.tsx" | head -20)
```

## 9. 教训 (按 06-27 update 累计)
- **mtime 假阳性**: 35 个 M 文件但 numstat 0 0 = 没改
- **session_search summary ≠ transcript**: 必须 git diff + mtime 反查
- **commit 范围**: `numstat > 0` 过滤, 别 `git add -A`
- **时间戳**: `datetime.fromtimestamp(t, UTC+8)` 换算
