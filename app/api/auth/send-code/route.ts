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

  const res = NextResponse.json({
    ok: true,
    provider: result.provider,
    // stub 模式返验证码给前端 (生产不返)
    devCode: real ? undefined : result.code,
  });
  res.headers.append("Set-Cookie", setCookie);
  return res;
}
