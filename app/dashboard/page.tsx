// Server component — 读 cookie 验真,拿用户手机号,渲染外壳
// 内部 Tab 内容是 client component (保持原逻辑)

import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  // dashboard 页是 server component,不能直接 await (cookie() 同步)
  // 用动态 import + 异步获取
  // 实际: Next.js 14 RSC 支持顶层 await
  const token = cookies().get("damai.session")?.value;
  const session = await verifySession(token);

  // middleware 已拦截,这里有 session 才进 — 但双保险
  const phone = session?.phone ?? "未登录";
  const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");

  return <DashboardClient phone={masked} tenantId={session?.tenantId ?? "default"} />;
}
