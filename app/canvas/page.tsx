import { redirect } from "next/navigation";

// 07-08: /canvas (列表入口) 回滚到 /sandbox/canvas (React Flow, 稳)
// v3 自研画布留作 fallback (/sandbox/canvas-v3 仍可访问, 不删)
export default function CanvasIndex() {
  redirect("/sandbox/canvas");
}
