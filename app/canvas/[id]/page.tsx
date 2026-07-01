// =====================================================================
// canvas/[id] 路由 — Phase 4 收口
// 06-30: 直接用 React Flow 画布 (Phase 3.5 完整版, 含 TopBar/FloatingTools/4 件套)
// 替代老自研 SVG CanvasEditor (已改名 .old.tsx 备份)
// 07-01: 改 next/dynamic + ssr:false 修 ECS production 上 desktop Chrome 连接线消失
//        (React Flow v12 不原生支持 SSR, hydration mismatch 让 Next.js 卸载 server DOM
//         重新挂载 client DOM, 期间 edges store 被清空 → 拖完线消失)
// =====================================================================

'use client';

import dynamic from 'next/dynamic';

const CanvasFlowEditor = dynamic(() => import('./CanvasFlowEditor'), {
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
      Loading canvas…
    </div>
  ),
});

export default function CanvasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  // 保留 template=xxx query 透传给新画布 (template starter 用)
  return <CanvasFlowEditor projectId={params.id} template={searchParams?.template} />;
}