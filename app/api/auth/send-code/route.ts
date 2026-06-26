// POST /api/auth/send-code
// body: { phone }
// 限流 → 调 sms.send → 写 verify cookie (HMAC 签名) → stub 模式返验证码

import { NextResponse } from "next/server";
import { sendCode } from "@/lib/sms";
import { checkRate, createVerifyCookie } from "@/lib/verify-store";

const PHONE_RE = /^1[3-9]\d{9}$/;

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rl = checkRate(phone, ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.reason, retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const result = await sendCode(phone);
  if (!result.ok) {
    return NextResponse.json(
      { error: "send_failed", detail: result.error },
      { status: 502 },
    );
  }

  // 写 verify cookie
  const setCookie = await createVerifyCookie(phone, result.code);
  const real = process.env.DAMI_SMS_REAL === "true";

  // v5.11: 用 res.cookies.set 标准 API, 不再 res.headers.append("Set-Cookie", ...)
  // 原因: Next.js 14 dev mode 下 res.headers.append 写 Set-Cookie 在浏览器 fetch response 里失效
  //       → 浏览器 cookieStore 拿不到 cookie → 登录后 middleware 永远拿不到 session → 跳回 /login
  // 解析 createVerifyCookie 返回的 Set-Cookie 字符串成 (name, value, options)
  const m = setCookie.match(/^([^=]+)=([^;]*)(?:;\s*Path=([^;]+))?(?:;\s*HttpOnly)?(?:;\s*SameSite=([^;]+))?(?:;\s*Max-Age=(\d+))?/i);
  const cookieName = m?.[1] || "damai.verify";
  const cookieValue = m?.[2] || setCookie.split(';')[0].split('=').slice(1).join('=');
  const cookiePath = m?.[3] || "/";
  const cookieSameSite = (m?.[4]?.toLowerCase() || "lax") as "lax" | "strict" | "none";
  const cookieMaxAge = parseInt(m?.[5] || "300", 10);

  const res = NextResponse.json({
    ok: true,
    provider: result.provider,
    // stub 模式返验证码给前端 (生产不返)
    devCode: real ? undefined : result.code,
  });
  res.cookies.set(cookieName, cookieValue, {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: false, // dev mode: 不强制 Secure (http)
    path: cookiePath,
    maxAge: cookieMaxAge,
  });
  return res;
}
