#!/bin/bash
# 大脉 (damai.net.cn) 一键部署脚本
# 用法（在 NAS 上运行）:
#   bash deploy-to-ecs.sh                         # 全量部署
#   bash deploy-to-ecs.sh components/SiteNav.tsx  # 只传单个文件然后 build

set -e

ECS="root@47.96.128.172"
ECS_PASS="Zlh199483"
ECS_PROJECT="/opt/damai"
NAS_SRC="/volume4/4T/damai/hermes-project"
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
    cd /opt/damai && NODE_OPTIONS="--max-old-space-size=512" npm install --include=dev --legacy-peer-deps 2>&1 | tail -5
REMOTE
fi

# Build
echo ""
echo "--- npm run build（约 2-4 分钟）---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
  cd /opt/damai && NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1 | tail -20
REMOTE

# PM2 reload
echo ""
echo "--- PM2 reload ---"
${DOCKER_PREFIX} ${SSH_CMD} pm2 reload damai

echo ""
echo "=== 部署完成！==="
echo "检查: https://damai.net.cn/"
