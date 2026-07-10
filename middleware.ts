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
  "/api/health", // 07-08 P2: 公测健康检查 (deploy smoke + 监控 + CDN 健康检查, 公开无害)
  // "/api/canvas" 移除 (06-29 P0 #4): canvas API 必须 session 验证, 防止未登录上传/生成 (S3 bug 修复)
  "/favicon",
  "/case",
  "/create",
  "/canvas",
  "/sandbox",  // 07-02: 大脉画布 v2 sandbox, 公域 (本地 localStorage, 不接生产 API)
  "/codex-mockups",
  "/workbench",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 07-10: /canvas-v2/ 静态 SPA rewrite (比 next.config.mjs 的 rewrites 更早生效)
  if (pathname === "/canvas-v2" || pathname === "/canvas-v2/") {
    const url = req.nextUrl.clone();
    url.pathname = "/canvas-v2/index.html";
    return NextResponse.rewrite(url);
  }

  // 1) 公域直接放行
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2) 私域: 验真 session (Edge runtime 用 Web Crypto,支持 async)
  const token = req.cookies.get("damai.session")?.value;
  console.log(`[MIDDLEWARE] pathname=${pathname} token=${token ? token.slice(0,30)+'...' : 'NONE'}`);
  const session = await verifySession(token);
  console.log(`[MIDDLEWARE] verifySession result=${session ? JSON.stringify(session) : 'null (FAILED)'}`);
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
