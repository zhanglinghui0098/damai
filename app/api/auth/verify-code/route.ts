// POST /api/auth/verify-code
// body: { phone, code, from? }
// 读 verify cookie + 验真 → 写 session cookie → 跳回 from 或 /dashboard

import { NextResponse } from "next/server";
import { consumeVerify } from "@/lib/verify-store";
import { createSession, deriveTenantId, SESSION_COOKIE } from "@/lib/auth";

const PHONE_RE = /^1[3-9]\d{9}$/;

export async function POST(req: Request) {
  let body: { phone?: string; code?: string; from?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  const code = (body.code ?? "").trim();

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  const v = await consumeVerify(phone, code, req.headers);
  if (!v.ok) {
    const res = NextResponse.json({ error: v.reason }, { status: 400 });
    // 失败也清 cookie
    res.headers.append("Set-Cookie", v.clearCookie);
    return res;
  }

  const tenantId = deriveTenantId(phone);
  const token = await createSession(phone, tenantId);

  // 跳转目标 — 防 open redirect
  const from = (body.from ?? "").trim();
  const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";

  const res = NextResponse.json({
    ok: true,
    phone,
    tenantId,
    redirect: safeFrom,
  });
  // 清 verify cookie + 写 session cookie
  res.headers.append("Set-Cookie", v.clearCookie);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
  return res;
}
