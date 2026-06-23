// 鉴权 + 多租户中间件
//
// 公域路由 (不需登录): /, /workbench, /case, /data/viral, /templates, /generate, /login
//   前缀公域: /_next, /api/agent (MiniMax), /favicon, /case, /create, /canvas, /codex-mockups,
//            /api/auth (登录流程本身)
//   静态资源: 见 config.matcher
//
// 私域 (要登录): /dashboard, /dashboard/*, /data/review, /data/analytics
//
// 登录态: cookie "damai.session" (HMAC 签名)
// 注入 header: x-tenant-id, x-user-phone  (给下游 API / RSC 读)

import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

// 精确路径 (不前缀匹配) — 公域
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/workbench",
  "/data/viral",
  "/templates",
  "/generate",
];

// 前缀匹配 — 公域
const PUBLIC_PREFIXES = [
  "/_next",
  "/api/agent",
  "/api/auth", // 登录流程自己不放行怎么登录
  "/favicon",
  "/case",
  "/create",
  "/canvas",
  "/codex-mockups",
  "/workbench",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) 公域直接放行
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2) 私域: 验真 session (Edge runtime 用 Web Crypto,支持 async)
  const token = req.cookies.get("damai.session")?.value;
  const session = await verifySession(token);

  if (!session) {
    // 未登录 → 跳 /login?from=...
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // 3) 注入 tenant + phone 给下游
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-id", session.tenantId);
  requestHeaders.set("x-user-phone", session.phone);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
