#!/usr/bin/env bash
# 大脉 (damai) 一键部署到阿里云轻量 (47.96.128.172)
# 用法: ./scripts/deploy-to-ecs.sh
# 前置: sshpass 已装, 密码在 ~/.ssh/damai-ecs-pw (chmod 600)
#
# 流程 (per ALIYUN-DEPLOY-LESSONS.md):
# 1. 打包本地源码 (排除 node_modules + .next + .env.local + 大目录)
# 2. scp 到服务器
# 3. 备份 /opt/damai
# 4. 解压 + chown + chmod
# 5. npm install
# 6. next build
# 7. pm2 reload
#
# 注意: .env.local 不会被覆盖 (server 上有自己的, 含生产 secrets)

set -euo pipefail

# === 配置 ===
ECS_HOST="47.96.128.172"
ECS_USER="root"
ECS_APP_DIR="/opt/damai"
LOCAL_REPO="/opt/data/projects/damai"
PW_FILE="${HOME}/.ssh/damai-ecs-pw"
TS=$(date +%Y%m%d-%H%M%S)
TAR="/tmp/damai-deploy-${TS}.tar"

# === 1. 打包 ===
echo "=== 1. tar local source ==="
cd "$LOCAL_REPO"
tar \
  --exclude='./node_modules' --exclude='./.next' --exclude='./.env.local' \
  --exclude='./.git' --exclude='./.venv' --exclude='./scripts/workflow-setup' \
  --exclude='tsconfig.tsbuildinfo' --exclude='*.log' \
  --exclude='./public/case' --exclude='./public/canvas-output' --exclude='./state' \
  -cf "$TAR" .
TAR_SIZE=$(du -h "$TAR" | cut -f1)
echo "  ✓ $TAR ($TAR_SIZE)"

# === 2. scp ===
echo ""
echo "=== 2. scp to server ==="
sshpass -f "$PW_FILE" scp -o StrictHostKeyChecking=no "$TAR" "${ECS_USER}@${ECS_HOST}:/tmp/"
echo "  ✓ uploaded"

# === 3-6. server: 备份 + extract + chown + chmod + npm install + build ===
echo ""
echo "=== 3-6. server operations ==="
sshpass -f "$PW_FILE" ssh -o StrictHostKeyChecking=no "${ECS_USER}@${ECS_HOST}" <<EOF
  set -e
  echo "--- 3. backup \${ECS_APP_DIR} ---"
  cp -a \${ECS_APP_DIR} \${ECS_APP_DIR}.bak-\${TS} || echo "backup skipped (existing?)"

  echo "--- 4. extract tar ---"
  cd \${ECS_APP_DIR}
  tar xf /tmp/$(basename $TAR) --exclude='./.env.local'

  echo "--- 5. chown + chmod (per LESSONS §3) ---"
  chown -R root:root \${ECS_APP_DIR}
  find \${ECS_APP_DIR} -type d -exec chmod 755 {} +
  find \${ECS_APP_DIR} -type f -exec chmod 644 {} +
  chmod 600 \${ECS_APP_DIR}/.env.local

  echo "--- 6a. npm install ---"
  cd \${ECS_APP_DIR}
  npm install --include=dev --legacy-peer-deps 2>&1 | tail -3

  echo "--- 6b. chmod .bin (per LESSONS §3 末行) ---"
  find \${ECS_APP_DIR}/node_modules/.bin -type l -exec chmod +x {} +

  echo "--- 6c. next build ---"
  NODE_OPTIONS=--max-old-space-size=2048 npx next build 2>&1 | tail -5

  echo "--- 7. pm2 reload ---"
  pm2 reload damai 2>&1 | tail -3
  sleep 3
  pm2 list | tail -3

  echo "--- cleanup tar ---"
  rm -f /tmp/$(basename $TAR)
EOF

echo ""
echo "=== 8. verify ==="
echo "  damai.net.cn: $(curl -s -o /dev/null -w "HTTP %{http_code} | %{size_download}B | %{time_total}s" https://damai.net.cn/)"
echo "  /api/auth/send-code: $(curl -s -X POST http://127.0.0.1:3000/api/auth/send-code -H "Content-Type: application/json" -d '{"phone":"13800138000"}' 2>&1 | head -c 200)"
echo ""
echo "✓ Deploy done ($TS)"