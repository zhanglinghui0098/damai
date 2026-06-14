#!/bin/bash
# 测试火山方舟 Seedance 2.0 API
# 用法: VOLC_API_KEY=ark-xxx bash scripts/test_volc.sh
set -e

if [ -z "$VOLC_API_KEY" ]; then
  echo "❌ 缺少 VOLC_API_KEY"
  echo "用法: VOLC_API_KEY=ark-你的key bash scripts/test_volc.sh"
  exit 1
fi

cd /opt/data/projects/tianxipai-video

# 把 key 写到临时 .env（用完即删）
echo "VOLC_API_KEY=$VOLC_API_KEY" > .env
trap 'rm -f .env; echo "🧹 .env 已清理"' EXIT

/opt/hermes/.venv/bin/python lib/video_client.py
