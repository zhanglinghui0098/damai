#!/bin/bash
# 大脉 (damai.net.cn) 一键部署脚本
# 用法（在 NAS 上运行）:
#   bash deploy-to-ecs.sh                         # 全量部署
#   bash deploy-to-ecs.sh components/SiteNav.tsx  # 只传单个文件然后 build
#
# 07-08 P1: 加备份 + smoke test + 失败回滚
#   1. 部署前 (全量模式): 备份当前 /opt/damai (排除 node_modules/.next) 到 /tmp/damai.backup.<ts>/
#   2. 部署后: 等 10s, curl 关键路由 (/, /login, /canvas, /sandbox/canvas)
#   3. smoke test fail → 删新 build, 恢复 backup, restart PM2
#   4. smoke test pass → 删 backup
# 教训: 5 天 deploy working tree → 拖线 bug 持续, user 出问题 5 天不知道
#        有了回滚 + smoke test, deploy 错了 production 30 秒恢复

set -e

ECS="root@47.96.128.172"
ECS_PASS="Zlh199483"
ECS_PROJECT="/opt/damai"
NAS_SRC="${NAS_SRC:-$(cd "$(dirname "$0")" && pwd)}"
DOCKER_PREFIX="docker exec hermes-hermes-1"
SSH_CMD="sshpass -p ${ECS_PASS} ssh -o StrictHostKeyChecking=no ${ECS}"
SCP_CMD="sshpass -p ${ECS_PASS} scp -o StrictHostKeyChecking=no"

# 07-08 P1: 备份目录 (全量 deploy 才备份, 单文件模式不备份)
BACKUP_DIR="/tmp/damai.backup.$(date +%Y%m%d-%H%M%S)"
ROLLBACK_DONE=0

# 07-08 P1: 回滚函数 (deploy 失败 / smoke test 失败时调用)
rollback() {
  local reason="$1"
  echo ""
  echo "--- ⚠️  ROLLBACK ($reason) ---"
  if [ ! -d "${BACKUP_DIR}" ]; then
    echo "  ERROR: 备份目录不存在 (${BACKUP_DIR}), 无法自动回滚"
    echo "  请手动: ssh ECS, cd /opt/damai, git pull <上次 commit>"
    exit 2
  fi
  ${DOCKER_PREFIX} ${SSH_CMD} bash <<REMOTE
    set -e
    ${DOCKER_PREFIX} pm2 stop damai 2>&1 | tail -3 || true
    rm -rf /opt/damai
    mkdir -p /opt/damai
    tar -xzf ${BACKUP_DIR}/source.tar.gz -C /opt/damai
    chown -R root:root /opt/damai
    find /opt/damai -type d -exec chmod 755 {} +
    find /opt/damai -type f -exec chmod 644 {} +
    find /opt/damai/node_modules/.bin -type l -exec chmod +x {} + 2>/dev/null || true
    chmod 600 /opt/damai/.env.local 2>/dev/null || true
    cd /opt/damai && NODE_OPTIONS="--max-old-space-size=512" npm install --include=dev --legacy-peer-deps
    pm2 start damai 2>&1 | tail -3
    echo "  rollback done"
REMOTE
  ROLLBACK_DONE=1
}

# 07-08 P1: 部署失败时自动回滚 (替代 set -e 直接 exit)
trap 'if [ $ROLLBACK_DONE -eq 0 ] && [ -d "${BACKUP_DIR}" ]; then rollback "deploy failed (line $LINENO)"; fi' ERR

echo "=== 大脉部署开始 ==="
echo "源码: ${NAS_SRC}"
echo "目标: ${ECS}:${ECS_PROJECT}"
echo "备份目录: ${BACKUP_DIR}"

if [ -n "$1" ]; then
  # 单文件模式：只传指定文件
  FILE="$1"
  echo ""
  echo "--- 单文件模式: ${FILE} ---"
  cat "${NAS_SRC}/${FILE}" | docker exec -i hermes-hermes-1 sh -c "cat > /tmp/_deploy_tmp"
  ${DOCKER_PREFIX} ${SCP_CMD} /tmp/_deploy_tmp "${ECS}:${ECS_PROJECT}/${FILE}"
  echo "  文件已传输到 ECS"
else
  # 全量模式：打包 + 传输 + 解压 + 修权限 + npm install

  # 07-08 P1: 部署前备份当前 /opt/damai (排除 node_modules/.next 节省空间)
  echo ""
  echo "--- 备份当前 /opt/damai → ${BACKUP_DIR} ---"
  ${DOCKER_PREFIX} ${SSH_CMD} bash <<REMOTE
    set -e
    mkdir -p ${BACKUP_DIR}
    cd /opt/damai
    tar --exclude='./node_modules' --exclude='./.next' --exclude='./videos' -czf ${BACKUP_DIR}/source.tar.gz .
    echo "  backup size: \$(du -sh ${BACKUP_DIR}/source.tar.gz | cut -f1)"
REMOTE
  echo "  备份完成"

  echo ""
  echo "--- 打包源码（排除 node_modules/.next/videos）---"
  tar -C "${NAS_SRC}" \
    --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./videos' \
    --exclude='./backups' \
    --exclude='./.git' \
    --exclude='./.open-next' \
    --exclude='./.vercel' \
    --exclude='./.wrangler' \
    --exclude='./.bak-v1' \
    --exclude='./public/case' \
    --exclude='./public/case/*' \
    --exclude='./state/案例' \
    --exclude='./state/案例/*' \
    --exclude='./state/案例库' \
    --exclude='./state/案例库/*' \
    --exclude='./hermes-reports' \
    --exclude='./hermes-reports/*' \
    --exclude='./.env.local.bak-*' \
    --exclude='./test*.txt' \
    --exclude='./codex-cli' \
    --exclude='./scripts/deploy-to-ecs.sh' \
    -czf /tmp/damai_deploy.tar.gz .
  echo "  打包完成"

  echo ""
  echo "--- 传输到 ECS ---"
  cat /tmp/damai_deploy.tar.gz | docker exec -i hermes-hermes-1 sh -c "cat > /tmp/damai_deploy.tar.gz"
  ${DOCKER_PREFIX} ${SCP_CMD} /tmp/damai_deploy.tar.gz "${ECS}:/tmp/damai_deploy.tar.gz"
  echo "  传输完成"

echo ""
echo "--- 备份 public/case (deploy 不会带视频, 备份防止丢失) ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
    if [ -d /opt/damai/public/case ]; then
        rm -rf /tmp/case.bak
        cp -a /opt/damai/public/case /tmp/case.bak
        echo "case backup: $(du -sh /tmp/case.bak | cut -f1)"
    else
        echo "no public/case to backup"
    fi
REMOTE

echo ""
echo "--- 解压 + 修权限 ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
    cd /opt/damai && tar -xzf /tmp/damai_deploy.tar.gz
    chown -R root:root /opt/damai
    find /opt/damai -type d -exec chmod 755 {} +
    find /opt/damai -type f -exec chmod 644 {} +
    find /opt/damai/node_modules/.bin -type l -exec chmod +x {} + 2>/dev/null || true
    chmod 600 /opt/damai/.env.local 2>/dev/null || true
    echo "权限修复完成"
REMOTE

echo ""
echo "--- 恢复 public/case (deploy 不会带视频, 从 backup 恢复) ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
    if [ -d /tmp/case.bak ] && [ ! -d /opt/damai/public/case ]; then
        cp -a /tmp/case.bak /opt/damai/public/case
        echo "case restored: $(du -sh /opt/damai/public/case | cut -f1)"
    fi
REMOTE

echo ""
echo "--- npm install ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
  set -e
  set -o pipefail
  cd /opt/damai && NODE_OPTIONS="--max-old-space-size=512" npm install --include=dev --legacy-peer-deps
REMOTE
fi

# Build (07-01 修: ECS 物理内存仅 896Mi, 1024M OOM. 改 512M + 先停 PM2 释放 60M)
echo ""
echo "--- PM2 stop (释放 60M 内存, 避 build OOM) ---"
${DOCKER_PREFIX} ${SSH_CMD} pm2 stop damai 2>&1 | tail -3

echo ""
echo "--- npm run build（约 2-4 分钟，512M heap 适配 896Mi ECS）---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
  set -e
  set -o pipefail
  cd /opt/damai && NODE_OPTIONS="--max-old-space-size=512" NEXT_TELEMETRY_DISABLED=1 npm run build
REMOTE

# PM2 restart
echo ""
echo "--- PM2 start ---"
${DOCKER_PREFIX} ${SSH_CMD} pm2 start damai 2>&1 | tail -3

# 07-08 P1: Smoke test (PM2 起来后, 等 10s, curl 关键路由)
# 07-08 P2: 加 /api/health (公测前 1 秒判断 prod 是否 OK)
echo ""
echo "--- Smoke test (等 10s 让 PM2 起来, curl 关键路由) ---"
SMOKE_OK=0
${DOCKER_PREFIX} ${SSH_CMD} bash <<'REMOTE' && SMOKE_OK=1 || SMOKE_OK=0
  set +e
  sleep 10
  SMOKE_RESULT=0
  for url in /api/health / /login /canvas /sandbox/canvas; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000${url})
    echo "  GET ${url} → ${code}"
    if [ "${code}" != "200" ]; then
      SMOKE_RESULT=1
    fi
  done
  # 07-08 P2: 健康 endpoint 还要返回 status=ok (不只是 200)
  HEALTH=$(curl -s --max-time 5 http://localhost:3000/api/health)
  echo "  /api/health body: ${HEALTH}"
  if ! echo "${HEALTH}" | grep -q '"status":"ok"'; then
    echo "  /api/health 返回 status != ok"
    SMOKE_RESULT=1
  fi
  exit ${SMOKE_RESULT}
REMOTE

# 07-08 P1: Smoke test 失败 → 触发回滚
if [ $SMOKE_OK -ne 1 ]; then
  rollback "smoke test failed"
  echo ""
  echo "=== ⚠️  部署失败已自动回滚, production 在上一版 ==="
  exit 3
fi

# 07-08 P1: Smoke test 通过 → 删 backup, 清 /tmp/damai_deploy.tar.gz
echo ""
echo "--- Smoke OK, 清理 backup + deploy tar ---"
${DOCKER_PREFIX} ${SSH_CMD} rm -rf "${BACKUP_DIR}" 2>&1 | tail -3
${DOCKER_PREFIX} ${SSH_CMD} rm -f /tmp/damai_deploy.tar.gz 2>&1 | tail -3

echo ""
echo "=== 部署完成！==="
echo "检查: https://damai.net.cn/"
