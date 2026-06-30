// =====================================================================
// canvas-v2/[id] 路由 — Phase 1 脚手架测试
// 老路由 /canvas/[id] 暂时不动, 等 Phase 4 收口再替换
// 06-29 Hermes: 用 dynamic import + ssr:false 避免 @xyflow/react SSR 报错
// =====================================================================

import CanvasFlowEditor from "./CanvasFlowEditor";

export default function CanvasV2Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  return <CanvasFlowEditor projectId={params.id} />;
}
