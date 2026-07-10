import { redirect } from "next/navigation";

// 07-10: /canvas → /canvas-v2 (codex 自研静态 SPA, 生产主画布)
// 老 /sandbox/canvas (React Flow) 留作 fallback
export default function CanvasIndex() {
  redirect("/canvas-v2");
}
