import { redirect } from "next/navigation";

// 07-08: /canvas (列表入口) 改 redirect 到 /sandbox/canvas-v3 (v3 自研画布)
// 老 /sandbox/canvas (React Flow) 保留作 fallback, 不删
export default function CanvasIndex() {
  redirect("/sandbox/canvas-v3");
}
