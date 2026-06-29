#!/usr/bin/env bash
# =====================================================================
# ECS 资源监控 + 飞书 webhook 告警
# - 磁盘用量 > 80% 告警
# - 内存用量 > 80% 告警
# - PM2 进程挂了告警
# - 跑频: 每 5 分钟 cron
#
# 部署: /opt/damai/scripts/alert-resources.sh
# =====================================================================

set -euo pipefail

FEISHU_WEBHOOK="${FEISHU_ALERT_WEBHOOK:-https://open.feishu.cn/open-apis/bot/v2/hook/REPLACE_ME}"
HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
ALERT_LEVEL="info"
ALERTS=()

# ---------- 1. 磁盘 ----------
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -ge 80 ]; then
  DISK_FREE=$(df -h / | tail -1 | awk '{print $4}')
  ALERTS+=("🔴 磁盘用量 ${DISK_USAGE}% (剩余 ${DISK_FREE}) — 大脉 ECS $HOSTNAME")
  ALERT_LEVEL="danger"
elif [ "$DISK_USAGE" -ge 70 ]; then
  ALERTS+=("🟡 磁盘用量 ${DISK_USAGE}% — 大脉 ECS $HOSTNAME")
fi

# ---------- 2. 内存 ----------
MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
MEM_USED=$(free -m | awk '/Mem:/ {print $3}')
MEM_PCT=$(( MEM_USED * 100 / MEM_TOTAL ))
if [ "$MEM_PCT" -ge 80 ]; then
  ALERTS+=("🔴 内存用量 ${MEM_PCT}% (${MEM_USED}M/${MEM_TOTAL}M) — 大脉 ECS $HOSTNAME")
  ALERT_LEVEL="danger"
fi

# ---------- 3. PM2 ----------
if command -v pm2 >/dev/null 2>&1; then
  PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import json, sys
try:
  procs = json.load(sys.stdin)
  bad = [p['name'] for p in procs if p['pm2_env']['status'] != 'online']
  if bad:
    print(','.join(bad) + ' OFFLINE')
  else:
    print('all online')
except Exception as e:
  print(f'parse error: {e}')
" 2>/dev/null || echo "pm2 jlist failed")

  if [[ "$PM2_STATUS" == *"OFFLINE"* ]]; then
    ALERTS+=("🔴 PM2 进程异常: $PM2_STATUS — 大脉 ECS $HOSTNAME")
    ALERT_LEVEL="danger"
  fi
fi

# ---------- 4. 公网访问 ----------
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 https://damai.net.cn/ || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  ALERTS+=("🔴 damai.net.cn HTTP $HTTP_CODE (非 200) — 大脉 ECS $HOSTNAME")
  ALERT_LEVEL="danger"
fi

# ---------- 5. 汇总发飞书 ----------
if [ ${#ALERTS[@]} -gt 0 ]; then
  CONTENT=$(printf '\n%s\n' "${ALERTS[@]}")
  PAYLOAD=$(cat <<EOF
{
  "msg_type": "interactive",
  "card": {
    "header": {
      "title": {"tag": "plain_text", "content": "🚨 大脉 ECS 告警 [$HOSTNAME]"},
      "template": "${ALERT_LEVEL}"
    },
    "elements": [
      {"tag": "div", "text": {"tag": "lark_md", "content": "$CONTENT"}},
      {"tag": "note", "elements": [{"tag": "plain_text", "content": "$TIMESTAMP"}]}
    ]
  }
}
EOF
)

  curl -s -X POST "$FEISHU_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" > /dev/null

  echo "[$TIMESTAMP] ALERT: $CONTENT"
fi