#!/usr/bin/env bash
# =====================================================================
# 大脉项目 — 每天 22:00 自动 handoff 备份
# 目的: 抗失忆 + 跨 session 连贯性
#
# 做什么 (4 件事):
# 1. 生成 state/HANDOFF-YYYY-MM-DD.md (给下次 session 看的项目简报)
# 2. 生成 state/HANDOFF-LATEST.md (永远指向最新 handoff, agent 启动直接读)
# 3. git commit + push master (锁住当天进度)
# 4. 飞书 webhook 通知 (可选, 没 URL 时跳过)
#
# crontab: 0 22 * * * /opt/data/projects/damai/scripts/daily-handoff.sh >> /var/log/damai-handoff.log 2>&1
#
# 触发时机: user 下班后 / NAS 空闲时, 22:00 北京时间
# =====================================================================

set -euo pipefail

# ---------- 配置 ----------
PROJECT_ROOT="/opt/data/projects/damai"
STATE_DIR="$PROJECT_ROOT/state"
LOG_FILE="${LOG_FILE:-/var/log/damai-handoff.log}"
HANDOFF_FILE="$STATE_DIR/HANDOFF-$(date +%Y-%m-%d).md"
LATEST_LINK="$STATE_DIR/HANDOFF-LATEST.md"
FEISHU_WEBHOOK="${DAMI_HANDOFF_WEBHOOK:-}"  # 飞书告警机器人 URL, 跟告警脚本同 webhook
cd "$PROJECT_ROOT"

mkdir -p "$STATE_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "===== daily-handoff start ====="

# ---------- 1. 收集当天 git 信息 ----------
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "")
TODAY_COMMIT_COUNT=$(git log --since="midnight" --oneline 2>/dev/null | wc -l)
TODAY_CHANGED_FILES=$(git diff --name-only HEAD@{24.hour.ago} HEAD 2>/dev/null | wc -l || echo "0")
GIT_STATUS=$(git status --short 2>/dev/null | head -10 || echo "")

# ---------- 2. 生成 HANDOFF-YYYY-MM-DD.md (10 节) ----------
cat > "$HANDOFF_FILE" <<HEADER
# 大脉项目 — Daily Handoff ($(date +%Y-%m-%d))

> **用途**: 抗失忆 + 跨 session 连贯性, 每天 22:00 cron 自动生成
> **下次 session 启动**: 读本文件 + \`state/STATUS.md\` + \`git log --oneline -10\`
> **维护**: scripts/daily-handoff.sh

---

## 0. 一句话 (今天做了什么)

- 今天 commit 数: ${TODAY_COMMIT_COUNT}
- 改了 ${TODAY_CHANGED_FILES} 个文件
- 最近 commit: \`${COMMIT_HASH}\` ${COMMIT_MSG}
- 还在 working tree 没 commit 的: $(echo "$GIT_STATUS" | grep -c "^" || echo "0") 个文件

## 1. 商业方案 (静态)
- **项目**: 大脉 = AI 武装的家居 ToB 营销案例库 (对标 TapNow 模式)
- **客户**: 张凌辉 / 杭州即客传媒 / 天禧派 (城北万象城 2000方)
- **路径**: 天禧派自己门店 → 顾家家居 10 经销商
- **收费**: 工具免费 + 服务收费 (¥3000-5000/月)
- **护城河**: 1:5 = 完整工作流, 不是单点功能
- **详细**: \`PROJECT.md\` §1

## 2. 当前阶段 (动态)
- **v2.7.0** phase: $(python3 -c "import json; print(json.load(open('state.json'))['current_phase'])" 2>/dev/null || grep -oE '"current_phase": *"[^"]*"' state.json | head -1 | sed 's/.*: *"//;s/"$//')
- **phase_status**: $(python3 -c "import json; print(json.load(open('state.json'))['phase_status'])" 2>/dev/null || grep -oE '"phase_status": *"[^"]*"' state.json | head -1 | sed 's/.*: *"//;s/"$//')
- **公网 URL**: $(python3 -c "import json; print(json.load(open('state.json'))['deployment']['public_url'])" 2>/dev/null || grep -oE '"public_url": *"[^"]*"' state.json | head -1 | sed 's/.*: *"//;s/"$//')
- **详细**: \`state.json\` + \`ROADMAP.md\` 任务总览

## 3. 今日完成 (自动统计)
\`\`\`
$(git log --since="midnight" --pretty=format:"%h %s" 2>/dev/null | head -20 || echo "no commit today")
\`\`\`

## 4. 明日计划 (待 user 拍板 / 阻塞项)
参见 \`state/STATUS.md\` 末尾 + \`DECISIONS.md\` 待拍板段

## 5. 阻塞 ask user (3 件事)
1. **飞书告警 webhook URL** (阶段 1.2 阻塞)
2. **NAS 备份 SSH user 确认** + 是否配 key (阶段 1.1 阻塞)
3. **ECS 47.96.128.172 root 密码** (推 1.1 脚本用)

## 6. 关键文件位置
- \`PROJECT.md\` — 项目入口
- \`ROADMAP.md\` — 任务总览
- \`DECISIONS.md\` — 决策日志
- \`state.json\` — 机器可读进度
- \`state/STATUS.md\` — 状态详情
- \`state/HANDOFF-LATEST.md\` — 最新 handoff (本文件的副本)

## 7. Agent 操作原则 (硬规则)
- 6 步启动 checklist: state.json → PROJECT.md → DECISIONS.md → ROADMAP.md → codex-deliveries/ → hermes-reports/
- 不要盲信 user "X 已建立" → 先验证
- 改状态文件前问"我亲眼看到 vs user 说的"是否一致
- "继续"= 接上一 session 末尾, 不是新事

## 8. Git 状态
- HEAD: ${COMMIT_HASH}
- 远端: $(git rev-parse --abbrev-ref @{u} 2>/dev/null || echo "no upstream")
- 落后远端: $(git rev-list --left-only --count HEAD...@{u} 2>/dev/null || echo "?") commit
- 未提交: $(echo "$GIT_STATUS" | grep -c "^" || echo "0") 个文件
\`\`\`
$(echo "$GIT_STATUS" | head -20)
\`\`\`

## 9. 教训 (按 06-27 update 累计)
- **mtime 假阳性**: 35 个 M 文件但 numstat 0 0 = 没改
- **session_search summary ≠ transcript**: 必须 git diff + mtime 反查
- **commit 范围**: \`numstat > 0\` 过滤, 别 \`git add -A\`
- **时间戳**: \`datetime.fromtimestamp(t, UTC+8)\` 换算
HEADER

log "✅ handoff doc 写完: $HANDOFF_FILE"

# ---------- 3. 复制为 LATEST (agent 启动直接读) ----------
cp "$HANDOFF_FILE" "$LATEST_LINK"
log "✅ LATEST link: $LATEST_LINK"

# ---------- 4. git commit + push (锁住当天进度) ----------
if [ -n "$(git status --short)" ]; then
  git add "$HANDOFF_FILE" "$LATEST_LINK" 2>/dev/null || true
  # 同时 add 任何 user 当天在 working tree 改的 (但 numstat > 0 才 add)
  git diff --numstat HEAD | awk '$1+$2 > 0 {print $3}' | xargs -r git add 2>/dev/null || true
  git commit -m "chore(handoff): $(date +%Y-%m-%d) daily handoff backup

- 自动生成 state/HANDOFF-$(date +%Y-%m-%d).md (10 节模板)
- 复制为 HANDOFF-LATEST.md (agent 启动直接读)
- 锁住当天 commit + working tree 真改的文件
- cron: 0 22 * * * /opt/data/projects/damai/scripts/daily-handoff.sh" 2>&1 | tee -a "$LOG_FILE"

  if git push origin HEAD 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ git push 成功"
  else
    log "⚠️ git push 失败 (可能没 upstream / network), commit 留在本地"
  fi
else
  log "ℹ️ working tree 干净, 无新 commit"
fi

# ---------- 5. 飞书 webhook 通知 (可选) ----------
if [ -n "$FEISHU_WEBHOOK" ]; then
  PAYLOAD=$(cat <<EOF
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {"tag": "plain_text", "content": "✅ 大脉项目 每日 handoff 备份完成"},
      "template": "green"
    },
    "elements": [
      {"tag": "div", "text": {"tag": "lark_md", "content": "**日期**: $(date +%Y-%m-%d)\n**今天 commit**: ${TODAY_COMMIT_COUNT} 个\n**改了**: ${TODAY_CHANGED_FILES} 个文件\n**HEAD**: ${COMMIT_HASH}\n**handoff doc**: \`state/HANDOFF-$(date +%Y-%m-%d).md\`"}},
      {"tag": "note", "elements": [{"tag": "plain_text", "content": "$(date '+%Y-%m-%d %H:%M:%S') | cron: 0 22 * * *"}]}
    ]
  }
}
EOF
)
  curl -s -X POST "$FEISHU_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null
  log "✅ 飞书通知已发"
else
  log "ℹ️ FEISHU_WEBHOOK 没设, 跳过飞书通知 (跟告警脚本同 webhook, 拿到 URL 后会一起推)"
fi

log "===== daily-handoff done ====="
