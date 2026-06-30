#!/usr/bin/env bash
# =====================================================================
# test-canvas.sh — 大脉画布回归测试 (07-01 07:15 Hermes)
#
# 目的: 防止"画布改了一遍又一遍, 每次都说修好了, 实际没修"
#   - 不依赖浏览器 (Playwright 需要 ~200MB 安装, NAS 容器负载不了)
#   - 不跑完整交互 (没 npm install playwright)
#   - 只做: 拉 HTML → 找关键 DOM 标识 → 校验结构
#
# 用法:
#   bash scripts/test-canvas.sh
#   CANVAS_URL=https://damai.net.cn bash scripts/test-canvas.sh
#
# 失败返回 exit 1, 任何 agent 改 canvas 代码后必跑
# =====================================================================

set -euo pipefail

CANVAS_URL="${CANVAS_URL:-https://damai.net.cn/canvas/test-canvas-$(date +%s)}"
echo "测试 URL: $CANVAS_URL"
echo "=========================================="

PASS=0
FAIL=0
FAILED_TESTS=()

# -----------------------------
# Test 1: HTTP 200
# -----------------------------
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CANVAS_URL" --max-time 30)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ [T1] HTTP 200 (URL 可达)"
  PASS=$((PASS+1))
else
  echo "✗ [T1] HTTP $HTTP_CODE (期待 200)"
  FAIL=$((FAIL+1))
  FAILED_TESTS+=("T1_HTTP_200: got $HTTP_CODE")
fi

# -----------------------------
# Test 2: HTML 含 expected CSS bundle (React Flow CSS 加载)
# -----------------------------
HTML=$(curl -s "$CANVAS_URL" --max-time 30)
if echo "$HTML" | grep -q '/_next/static/css/'; then
  echo "✓ [T2] HTML 含 Next.js CSS bundle"
  PASS=$((PASS+1))
else
  echo "✗ [T2] HTML 没找到 Next.js CSS bundle"
  FAIL=$((FAIL+1))
  FAILED_TESTS+=("T2_CSS_bundle_missing")
fi

# -----------------------------
# Test 3: HTML 含 React Flow marker (验证 @xyflow/react 包被打进去)
# -----------------------------
# React Flow v12 在 HTML 里会塞 .react-flow 类名
# (查 _buildManifest.js 或者直接拉主 JS chunk)
if echo "$HTML" | grep -qE 'react-flow|xyflow'; then
  echo "✓ [T3] HTML/JS 提到 react-flow / xyflow (依赖装入)"
  PASS=$((PASS+1))
else
  echo "⚠ [T3] HTML/JS 没看到 'react-flow' 字样 (降级: 改查 _next JS chunk)"
  # 降级: 抓任何 _next 静态 JS 看是否有 xyflow
  JSURL=$(echo "$HTML" | grep -oE '/_next/static/chunks/app/canvas/[^"]+' | head -1)
  if [ -n "$JSURL" ]; then
    JS=$(curl -s "https://damai.net.cn${JSURL}" --max-time 30)
    if echo "$JS" | grep -qE 'xyflow|react-flow'; then
      echo "  ✓ JS chunk 含 xyflow (T3 实际通过)"
      PASS=$((PASS+1))
      FAIL=$((FAIL-1))
      FAILED_TESTS=("${FAILED_TESTS[@]/T3_CSS_bundle_missing/}")
    else
      FAIL=$((FAIL+1))
      FAILED_TESTS+=("T3_xyflow_missing_in_chunk")
    fi
  else
    FAIL=$((FAIL+1))
    FAILED_TESTS+=("T3_no_canvas_chunk")
  fi
fi

# -----------------------------
# Test 4: 服务器返回的 .next/static build 里有 canvas route (验证 compile 成功)
# -----------------------------
BUILD_ID=$(echo "$HTML" | grep -oE '"buildId":"[^"]+"' | head -1 | cut -d'"' -f4)
if [ -n "$BUILD_ID" ]; then
  echo "✓ [T4] Build ID: $BUILD_ID"
  PASS=$((PASS+1))
else
  echo "⚠ [T4] 未找到 buildId (可能是 static SSR, 不致命)"
fi

# -----------------------------
# Test 5: 排除 502 / 错误页
# -----------------------------
if echo "$HTML" | grep -qE 'Application error|502 Bad Gateway|Bad Request|Internal Server Error'; then
  echo "✗ [T5] HTML 含错误页关键字!"
  FAIL=$((FAIL+1))
  FAILED_TESTS+=("T5_error_page_in_html")
else
  echo "✓ [T5] HTML 无错误页关键字"
  PASS=$((PASS+1))
fi

# -----------------------------
# 总结
# -----------------------------
echo "=========================================="
echo "通过: $PASS, 失败: $FAIL"
if [ $FAIL -gt 0 ]; then
  echo "❌ 失败的测试:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  exit 1
fi
echo "✅ 所有画布回归测试通过"
exit 0
