// =====================================================================
// canvas/[id] 路由 — Phase 4 收口
// 06-30: 直接用 React Flow 画布 (Phase 3.5 完整版, 含 TopBar/FloatingTools/4 件套)
// 替代老自研 SVG CanvasEditor (已改名 .old.tsx 备份)
// =====================================================================

import CanvasFlowEditor from "./CanvasFlowEditor";

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
