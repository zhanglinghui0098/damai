#!/bin/bash
# 大脉 v2 数据工作台设计稿 - Hermes 端同步脚本 (2026-06-23)
# 用法: scp/rsync 把整个 codex-deliveries/2026-06-23-data-workbench-v2/ 目录搬过来后,
#       在 Hermes 跑这个脚本:
#   cd /opt/data/projects/damai/codex-deliveries/2026-06-23-data-workbench-v2
#   bash sync-v2-data-workbench.sh

set -e

PROJECT_DIR="/opt/data/projects/damai"
DELIVERY_DIR="$PROJECT_DIR/codex-deliveries/2026-06-23-data-workbench-v2"
DESIGN_DIR="$PROJECT_DIR/docs/design"
TS=$(date +%Y%m%d-%H%M%S)

cd "$PROJECT_DIR"

echo "=== 1. 准备 docs/design 目录 ==="
mkdir -p "$DESIGN_DIR"

echo ""
echo "=== 2. 校验交付物 ==="
ls -la "$DELIVERY_DIR/"
echo ""
wc -l "$DELIVERY_DIR/README.md" "$DELIVERY_DIR/data-workbench-mockup.html"
echo ""

echo "=== 3. 备份 (如果已有 v1) ==="
if [ -f "$DESIGN_DIR/data-workbench-v1.md" ]; then
  cp "$DESIGN_DIR/data-workbench-v1.md" "$DESIGN_DIR/data-workbench-v1.md.bak-$TS"
  echo "已备份 v1 -> data-workbench-v1.md.bak-$TS"
else
  echo "未发现 v1 设计稿, 跳过备份"
fi

echo ""
echo "=== 4. 复制新文件 ==="
cp "$DELIVERY_DIR/README.md"                  "$DESIGN_DIR/data-workbench-v2.md"
cp "$DELIVERY_DIR/data-workbench-mockup.html" "$DESIGN_DIR/data-workbench-v2.html"

echo ""
echo "=== 5. 完成 ==="
ls -la "$DESIGN_DIR/"
echo ""
echo "查看方式:"
echo "  cat $DESIGN_DIR/data-workbench-v2.md"
echo "  浏览器打开: $DESIGN_DIR/data-workbench-v2.html"
echo "  (或者 scp 回本机: scp damai:$DESIGN_DIR/data-workbench-v2.html .)"
echo ""
echo "回滚命令 (如需):"
echo "  rm $DESIGN_DIR/data-workbench-v2.md $DESIGN_DIR/data-workbench-v2.html"