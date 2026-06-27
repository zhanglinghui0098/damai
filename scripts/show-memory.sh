#!/usr/bin/env bash
# =====================================================================
# 大脉项目 — 一行调出 Agent 记忆 (抗失忆用)
# 用法: bash scripts/show-memory.sh
# 作用: 打印 state/AGENT_MEMORY.md (一页纸项目记忆) + 关键 git/state 状态
# =====================================================================

set -uo pipefail

PROJECT_ROOT="/opt/data/projects/damai"
MEMORY_FILE="$PROJECT_ROOT/state/AGENT_MEMORY.md"

if [ ! -f "$MEMORY_FILE" ]; then
  echo "❌ $MEMORY_FILE 不存在"
  echo "   跑: bash scripts/daily-handoff.sh 重新生成"
  exit 1
fi

echo "================================================================"
echo "  大脉项目 — Agent 记忆 (调出时间: $(date '+%Y-%m-%d %H:%M:%S CST'))"
echo "================================================================"
echo ""

# 打印主记忆文件
cat "$MEMORY_FILE"

echo ""
echo "================================================================"
echo "  实时状态 (从 git + state.json 拉)"
echo "================================================================"

cd "$PROJECT_ROOT" 2>/dev/null || exit 1

echo ""
echo "--- Git HEAD (本地 + 远端) ---"
git log --oneline -3 2>/dev/null | head -3
echo ""
echo "--- 当前 daemon 进程 ---"
pgrep -af daily-handoff-daemon 2>/dev/null | head -2 || echo "(未跑)"
echo ""
echo "--- state.json phase ---"
python3 -c "
import json
d = json.load(open('state.json'))
print(f'version: {d.get(\"version\")}')
print(f'current_phase: {d.get(\"current_phase\")}')
print(f'phase_status: {d.get(\"phase_status\")}')
print(f'public_url: {d.get(\"deployment\", {}).get(\"public_url\")}')
print(f'next_priority: {d.get(\"next_priority\")}')
" 2>/dev/null || echo "(state.json 解析失败)"

echo ""
echo "--- working tree 状态 ---"
git status --short 2>/dev/null | head -10 || echo "(无 git 状态)"

echo ""
echo "================================================================"
echo "  调出结束。详细文件: $MEMORY_FILE"
echo "  完整状态: PROJECT.md / ROADMAP.md / DECISIONS.md / state.json"
echo "================================================================"
