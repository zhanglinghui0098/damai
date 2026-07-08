// =====================================================================
// sandbox/tldraw 路由 — 大脉画布 v3 (tldraw 底座) 阶段 1 验证
// 07-08: 选 X 之后开做
// - 目的: 验证 tldraw 能撑住 Hermes 节点编辑器
// - 范围: 1 个 demo, 不接 production API, 跟 sandbox/canvas (React Flow) 平行
// - 5 天踩坑教训: 严守 CLAUDE.md, 画布核心不乱改, 自研只在外围
// - 不动: /canvas/[id] (老 React Flow 混合架构), /sandbox/canvas (React Flow 原生)
// =====================================================================

'use client';

import dynamic from 'next/dynamic';

const CanvasFlowTldraw = dynamic(() => import('./CanvasFlowTldraw'), {
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
      Loading tldraw sandbox…
    </div>
  ),
});

export default function SandboxTldrawPage() {
  return <CanvasFlowTldraw />;
}
