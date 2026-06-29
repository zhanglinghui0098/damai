#!/usr/bin/env bash
# =====================================================================
# NAS 备份脚本 — 把 ECS /opt/damai/canvas-output/ + uploads/ rsync 到 NAS
# 凌晨 2 点 cron 跑, 跑完写日志
#
# 部署位置: /opt/damai/scripts/backup-to-nas.sh (ECS)
# 目标: NAS /volume1/10T/Hermes/projects/damai-backup/
# =====================================================================

set -euo pipefail

# 配置
NAS_HOST="${NAS_BACKUP_HOST:-192.168.2.10}"  # NAS LAN1 (10Gbps, MTU 9000) — 改 06-27 09:41
NAS_USER="${NAS_BACKUP_USER:-15925670098}"    # ⚠️ 待 user 确认 — 之前 placeholder 是 zhanglh
NAS_PATH="${NAS_BACKUP_PATH:-/volume1/10T/Hermes/projects/damai-backup}"
SRC_DIR="/opt/damai/public"
LOG_FILE="/var/log/damai-backup.log"
DATE_TAG=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "===== backup start ====="

# 检查源目录
if [ ! -d "$SRC_DIR/canvas-output" ] && [ ! -d "$SRC_DIR/uploads" ]; then
  log "WARN: 源目录无 canvas-output/ 或 uploads/, 可能还没接 OSS, 跳过"
  exit 0
fi

# rsync 到 NAS (走 ssh, 限速 50MB/s 防爆带宽)
RSYNC_OPTS=(
  -avz
  --progress
  --bwlimit=50000
  --delete-after              # 删除 NAS 上 ECS 已删的文件
  --exclude='*.tmp'
  --exclude='.DS_Store'
)

# 测试 NAS 可达
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$NAS_USER@$NAS_HOST" "test -d $NAS_PATH" 2>/dev/null; then
  log "ERROR: NAS 不可达 ($NAS_USER@$NAS_HOST:$NAS_PATH)"
  exit 1
fi

# 同步
log "rsync $SRC_DIR/canvas-output → $NAS_USER@$NAS_HOST:$NAS_PATH/canvas-output/"
rsync "${RSYNC_OPTS[@]}" "$SRC_DIR/canvas-output/" "$NAS_USER@$NAS_HOST:$NAS_PATH/canvas-output/" 2>&1 | tail -20 | tee -a "$LOG_FILE"

if [ -d "$SRC_DIR/uploads" ]; then
  log "rsync $SRC_DIR/uploads → $NAS_USER@$NAS_HOST:$NAS_PATH/uploads/"
  rsync "${RSYNC_OPTS[@]}" "$SRC_DIR/uploads/" "$NAS_USER@$NAS_HOST:$NAS_PATH/uploads/" 2>&1 | tail -20 | tee -a "$LOG_FILE"
fi

# 清理 NAS 上 $RETENTION_DAYS 天前的归档 (可选, 默认保留)
# ssh "$NAS_USER@$NAS_HOST" "find $NAS_PATH/archive -mtime +$RETENTION_DAYS -type f -delete" 2>&1 | tee -a "$LOG_FILE"

# 磁盘用量
USED=$(du -sh "$SRC_DIR" 2>/dev/null | cut -f1)
log "ECS 占用: $USED"

log "===== backup done ====="