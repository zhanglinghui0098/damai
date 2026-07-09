// =====================================================================
// /canvas/v2 路由 — 大脉画布 v2 (07-09 全新干净版)
// React Flow v12.11.0 锁版本, 严守 CLAUDE.md 画布核心锁
// 5 天踩坑教训: 不自研 Handle / ConnectionPath / SelfDrawnEdge
// 跟 prototype 1:1 (你 1 周前验过, /sandbox/canvas 用的)
// 不引用任何老代码: 独立路由 / 独立 state / 独立 CSS
// =====================================================================

'use client';

import dynamic from 'next/dynamic';

const CanvasFlowV2 = dynamic(() => import('./CanvasFlowV2'), {
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
      Loading canvas v2 (干净版)…
    </div>
  ),
});

export default function CanvasV2Page() {
  return <CanvasFlowV2 />;
}