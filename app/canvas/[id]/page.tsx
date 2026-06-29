import { redirect } from "next/navigation";

// Phase 3 (06-30 06:25) — 老路由 /canvas/[id] → /canvas-v2/[id] 跳转
// 保留 query string (template=xxx, 等)
// 用户打开老 URL 自动看到新 React Flow 画布
// 老 CanvasEditor.tsx 暂保留, Phase 4 A/B 测试后决定是否删

export default function CanvasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  const qs = searchParams?.template
    ? `?template=${encodeURIComponent(searchParams.template)}`
    : "";
  redirect(`/canvas-v2/${params.id}${qs}`);
}
