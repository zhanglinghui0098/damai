// =====================================================================
// sandbox/canvas-v3 路由 — 大脉画布 v3 (完全自研, SVG + React state 自管)
// 07-08: user 决定推倒 React Flow + tldraw, 完全自研
// ⚠️ 高风险决策, 5 天踩坑就是因为自研画布底座不稳. 严守 CLAUDE.md.
// - 范围 C: 不接 production API, localStorage 持久化 (key 跟 brief 3.4 一致)
// - 5 个验收项: brief Part 5
// - 不动: /canvas/[id], /sandbox/canvas (React Flow), /sandbox/tldraw
// =====================================================================

'use client';

import dynamic from 'next/dynamic';

const CanvasFlowV3 = dynamic(() => import('./CanvasFlowV3'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
      }}
    >
      Loading canvas v3 (自研)…
    </div>
  ),
});

export default function SandboxCanvasV3Page() {
  return <CanvasFlowV3 />;
}
