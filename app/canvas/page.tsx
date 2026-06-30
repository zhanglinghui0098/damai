import { redirect } from "next/navigation";

// Phase 4 收口: canvas-v2/ 整目录已删, 老路由 /canvas/[id] 直接 render React Flow
// 所以 /canvas (列表入口) 也 redirect 到 /canvas/new (用老路由)
export default function CanvasIndex() {
  redirect("/canvas/new");
}
