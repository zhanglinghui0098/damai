#!/bin/bash
# 大脉 v3 画布 - Hermes 端同步脚本 (2026-06-23)
# 用法: 把整个 codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign/ 目录 scp 过来后, 在 Hermes 跑:
#   bash /opt/data/projects/damai/codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign/sync-v3-canvas.sh

set -e

PROJECT_DIR="/opt/data/projects/damai"
DELIVERY_DIR="$PROJECT_DIR/codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign"
BAK_SUFFIX="bak-0623"

cd "$PROJECT_DIR"

echo "=== 1. 备份当前画布文件 (后缀 .${BAK_SUFFIX}) ==="
cp "app/canvas/[id]/CanvasEditor.tsx" "app/canvas/[id]/CanvasEditor.tsx.${BAK_SUFFIX}"
cp "app/canvas/[id]/page.tsx"         "app/canvas/[id]/page.tsx.${BAK_SUFFIX}"
ls -la "app/canvas/[id]/"

echo ""
echo "=== 2. 校验交付物 ==="
ls -la "$DELIVERY_DIR/app/canvas/[id]/"

echo ""
echo "=== 3. 复制新文件 ==="
cp "$DELIVERY_DIR/app/canvas/[id]/CanvasEditor.tsx" "app/canvas/[id]/CanvasEditor.tsx"
cp "$DELIVERY_DIR/app/canvas/[id]/page.tsx"         "app/canvas/[id]/page.tsx"

echo ""
echo "=== 4. 行数对比 (期望 1755 + 24) ==="
wc -l "app/canvas/[id]/CanvasEditor.tsx" "app/canvas/[id]/page.tsx"

echo ""
echo "=== 5. 完成 ==="
echo "已有 dev server: 等 HMR 自动刷新 3-5 秒"
echo "没有:           cd $PROJECT_DIR && rm -rf .next && npm run dev"
echo ""
echo "回滚命令 (如需):"
echo "  cp app/canvas/[id]/CanvasEditor.tsx.${BAK_SUFFIX} app/canvas/[id]/CanvasEditor.tsx"
echo "  cp app/canvas/[id]/page.tsx.${BAK_SUFFIX}         app/canvas/[id]/page.tsx"
