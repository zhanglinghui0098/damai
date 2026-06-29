import CanvasFlowEditor from "@/app/canvas/[id]/CanvasFlowEditor";

// A/B 测试路由 — 老路由 /canvas/[id] 仍用 CanvasEditor, 新路由 /canvas-v2/[id] 用 CanvasFlowEditor
// Phase 4 完成后会合并

export default function CanvasV2Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  return <CanvasFlowEditor projectId={params.id} />;
}
