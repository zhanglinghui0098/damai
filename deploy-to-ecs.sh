#!/bin/bash
# 大脉 (damai.net.cn) 一键部署脚本
# 用法（在 NAS 上运行）:
#   bash deploy-to-ecs.sh                         # 全量部署
#   bash deploy-to-ecs.sh components/SiteNav.tsx  # 只传单个文件然后 build

set -e

ECS="root@47.96.128.172"
ECS_PASS="Zlh199483"
ECS_PROJECT="/opt/damai"
NAS_SRC="${NAS_SRC:-$(cd "$(dirname "$0")" && pwd)}"
DOCKER_PREFIX="docker exec hermes-hermes-1"
SSH_CMD="sshpass -p ${ECS_PASS} ssh -o StrictHostKeyChecking=no ${ECS}"
SCP_CMD="sshpass -p ${ECS_PASS} scp -o StrictHostKeyChecking=no"

echo "=== 大脉部署开始 ==="
echo "源码: ${NAS_SRC}"
echo "目标: ${ECS}:${ECS_PROJECT}"

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

echo ""
echo "=== 部署完成！==="
echo "检查: https://damai.net.cn/"
