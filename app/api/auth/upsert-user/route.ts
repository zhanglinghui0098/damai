// POST /api/auth/upsert-user
// body: { phone, nickname?, company? }
// 限流 → 调 upsertUser (飞书 Bitable 00_用户档案)
//
// 流程: verify-code (SMS 验证成功) → 调这个 API 创建/更新 user record
// 安全: S2 简化 (无 session 校验, 仅 IP+phone 限流); S3 加 session 校验

import { NextResponse } from "next/server";
import { upsertUser, updateLastLogin } from "@/lib/feishu-bitable";

const PHONE_RE = /^1[3-9]\d{9}$/;

// 简单限流: 每 phone 5/min
const rateMap = new Map<string, number[]>();
function checkRate(phone: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const arr = (rateMap.get(phone) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 5) {
    return { ok: false, retryAfter: 60 - Math.floor((now - arr[0]) / 1000) };
  }
  arr.push(now);
  rateMap.set(phone, arr);
  return { ok: true };
}

export async function POST(req: Request) {
  let body: { phone?: string; nickname?: string; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").trim();
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const rl = checkRate(phone);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  try {
    const result = await upsertUser(phone, {
      昵称: body.nickname?.trim() || undefined,
      公司: body.company?.trim() || undefined,
      最后登录时间: Date.now(),
    });
    // 不论 create/update, 都更新最后登录 + 登录次数
    await updateLastLogin(phone);

    return NextResponse.json({
      ok: true,
      phone,
      tenantId: result.tenantId,
      record_id: result.record_id,
      created: result.created,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upsert-user] failed:", msg);
    return NextResponse.json({ error: "upsert_failed", detail: msg }, { status: 500 });
  }
}