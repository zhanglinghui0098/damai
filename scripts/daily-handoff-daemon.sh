#!/usr/bin/env bash
# =====================================================================
# 大脉项目 — daily-handoff daemon (Hermes 容器内常驻)
# 原因: 绿联 NAS 物理 crond 未装, systemd 不支持, 用常驻进程代替 cron
#
# 做什么: 每 60s 检查一次, 到 22:00 (北京时间) 触发 daily-handoff.sh
# 启动方式: nohup bash scripts/daily-handoff-daemon.sh > /tmp/daily-handoff-daemon.log 2>&1 &
# 查 PID: pgrep -f daily-handoff-daemon
# 停: kill $(pgrep -f daily-handoff-daemon)
# =====================================================================

set -uo pipefail

HANDOFF_SCRIPT="/opt/data/projects/damai/scripts/daily-handoff.sh"
LOG_FILE="/tmp/daily-handoff-daemon.log"
TRIGGER_HOUR=22
CHECK_INTERVAL=60  # 秒

# 启动日志
echo "[$(date '+%Y-%m-%d %H:%M:%S')] daily-handoff-daemon started, trigger at ${TRIGGER_HOUR}:00, check every ${CHECK_INTERVAL}s" | tee -a "$LOG_FILE"

# 启动时立即跑一次 (让 user 验证 daemon 启动后立刻出 handoff)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] initial run on startup" | tee -a "$LOG_FILE"
bash "$HANDOFF_SCRIPT" >> "$LOG_FILE" 2>&1

LAST_TRIGGER_DATE=""

while true; do
  sleep "$CHECK_INTERVAL"

  NOW_HOUR=$(date +%H)
  NOW_MIN=$(date +%M)
  NOW_DATE=$(date +%Y-%m-%d)

  # 每天 TRIGGER_HOUR:00 触发一次 (避免重复: 用 LAST_TRIGGER_DATE 记录)
  if [ "$NOW_HOUR" = "$TRIGGER_HOUR" ] && [ "$NOW_MIN" = "00" ] && [ "$LAST_TRIGGER_DATE" != "$NOW_DATE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] trigger: ${TRIGGER_HOUR}:00 hit, running daily-handoff.sh" | tee -a "$LOG_FILE"
    bash "$HANDOFF_SCRIPT" >> "$LOG_FILE" 2>&1
    LAST_TRIGGER_DATE="$NOW_DATE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] trigger done, daily-handoff.sh exit=$?" | tee -a "$LOG_FILE"
  fi
done
