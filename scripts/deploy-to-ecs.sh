#!/usr/bin/env bash
# 大脉 (damai) 一键部署到阿里云轻量 (47.96.128.172)
# 用法: ./scripts/deploy-to-ecs.sh
# 前置: SSH key 写到 ~/.ssh/damai-ecs (server authorized_keys 已加)
#   06-29 14:50 改: 弃 sshpass (密码文件被删), 改 SSH key
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
ECS_USER="admin"  # 06-29 15:55 改: root SSH 被禁, 改 admin + sudo 提权
ECS_APP_DIR="/opt/damai"
LOCAL_REPO="/opt/data/projects/damai"
SSH_KEY="/opt/data/home/.ssh/damai-ecs"
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

# === 2. 上传 (cat | ssh 替代 scp, 避免 server 端 sftp 没开) ===
echo ""
echo "=== 2. upload tar to server (cat | ssh) ==="
cat "$TAR" | ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o PasswordAuthentication=no -o IdentitiesOnly=yes "${ECS_USER}@${ECS_HOST}" "cat > /tmp/damai-deploy-${TS}.tar && echo '  ✓ uploaded $(du -h /tmp/damai-deploy-${TS}.tar | cut -f1)'"

# === 3-6. server: 备份 + extract + chown + chmod + npm install + build ===
# admin 登录 + sudo bash -s 提权到 root, 从 stdin 读脚本
echo ""
echo "=== 3-6. server operations (admin + sudo) ==="
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o PasswordAuthentication=no "${ECS_USER}@${ECS_HOST}" 'sudo bash -s' <<'SERVEREOF'
  set -e
  TS=$(date +%Y%m%d-%H%M%S)
  APP=/opt/damai

  echo "--- 3. backup ---"
  cp -a $APP $APP.bak-$TS 2>/dev/null || echo "  backup skipped (existing?)"

  echo "--- 4. extract tar ---"
  cd $APP
  TAR=$(ls -t /tmp/damai-deploy-*.tar 2>/dev/null | head -1)
  echo "  using: $TAR"
  tar xf "$TAR" --exclude=./.env.local

  echo "--- 5. chown + chmod (per LESSONS §3) ---"
  chown -R root:root $APP
  find $APP -type d -exec chmod 755 {} +
  find $APP -type f -exec chmod 644 {} +
  chmod 600 $APP/.env.local

  echo "--- 6a. npm install ---"
  cd $APP
  npm install --include=dev --legacy-peer-deps 2>&1 | tail -3

  echo "--- 6b. chmod .bin ---"
  find $APP/node_modules/.bin -type l -exec chmod +x {} +

  echo "--- 6c. next build ---"
  NODE_OPTIONS=--max-old-space-size=2048 npx next build 2>&1 | tail -5

  echo "--- 7. pm2 delete + start (env 强制 refresh, reload 不重新读 .env.local) ---"
  pm2 delete damai 2>/dev/null
  pm2 start npm --name damai -- run start 2>&1 | tail -3
  sleep 3
  pm2 list | tail -3

  echo "--- cleanup tar ---"
  rm -f /tmp/damai-deploy-*.tar
SERVEREOF

echo ""
echo "=== 8. verify ==="
echo "  damai.net.cn: $(curl -s -o /dev/null -w "HTTP %{http_code} | %{size_download}B | %{time_total}s" https://damai.net.cn/)"
echo "  /api/auth/send-code: $(curl -s -X POST http://127.0.0.1:3000/api/auth/send-code -H "Content-Type: application/json" -d '{"phone":"13800138000"}' 2>&1 | head -c 200)"
echo ""
echo "✓ Deploy done ($TS)"