// =====================================================================
// sandbox/canvas 路由 — 大脉画布 v2 sandbox
// 07-02: 新加路由, 完全不动 /canvas/[id]
// - 用 prototype (C:\Users\Administrator\Desktop\canvas-prototype\index.html) 的设计
// - 范围 C: 不接 production API, localStorage 存数据 (key: damai:canvas-v2:r2:sandbox)
// - 保留 07-01 修复: next/dynamic + ssr:false + 蓝紫 edge (0.85 + 2.5px)
// - 目的: production 用户能切到 /sandbox/canvas 试新设计, 旧版不破坏
// =====================================================================

'use client';

import dynamic from 'next/dynamic';

const CanvasFlowSandbox = dynamic(() => import('./CanvasFlowSandbox'), {
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
      Loading sandbox canvas…
    </div>
  ),
});

export default function SandboxCanvasPage() {
  return <CanvasFlowSandbox />;
}
