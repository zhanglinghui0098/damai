// 验证码存 HMAC 签名的 cookie (stateless, dev/prod 一致)
// 不用 in-memory Map 存验证码 — Next.js 14 dev mode 跨 API route 不共享
// 5 分钟过期, 1 个 cookie = 1 次发送, verify 后清掉
//
// 限流仍用 in-memory (同 route 内连续调用 OK, 跨 route 用 IP 兜底)

import { globalSign } from "./hmac";

const COOKIE = "damai.verify";
const TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type VerifyPayload = {
  phone: string;
  code: string;
  // Unix ms
  exp: number;
  attempts: number;
};

function secret(): string {
  return process.env.DAMI_SESSION_SECRET || "dev-stub-secret-rotate-in-prod";
}

function clearCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ============================================================
// 限流 — 进程内 Map (dev 跨 route 不一致也 OK: 限流失败只是多发一次)
// ============================================================

const RATE = {
  perPhonePerMin: 1,
  perPhonePerHour: 5,
  perIpPerMin: 30, // dev 调测需要宽松,生产可降到 5
};

const globalAny = globalThis as unknown as {
  __damai_ratelimit?: Map<string, number[]>;
};
const rateMap = (globalAny.__damai_ratelimit ??= new Map<string, number[]>());

function checkAndRecord(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (rateMap.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    rateMap.set(key, arr);
    return false;
  }
  arr.push(now);
  rateMap.set(key, arr);
  return true;
}

// ============================================================
// 公开 API
// ============================================================

export type RateCheck =
  | { ok: true }
  | { ok: false; reason: "phone_rate_1m" | "phone_rate_1h" | "ip_rate_1m"; retryAfter: number };

export function checkRate(phone: string, ip: string): RateCheck {
  if (!checkAndRecord(`phone:${phone}`, RATE.perPhonePerMin, 60_000)) {
    return { ok: false, reason: "phone_rate_1m", retryAfter: 60 };
  }
  if (!checkAndRecord(`phone:${phone}`, RATE.perPhonePerHour, 3600_000)) {
    return { ok: false, reason: "phone_rate_1h", retryAfter: 3600 };
  }
  if (!checkAndRecord(`ip:${ip}`, RATE.perIpPerMin, 60_000)) {
    return { ok: false, reason: "ip_rate_1m", retryAfter: 60 };
  }
  return { ok: true };
}

/**
 * 写 verify cookie (async 因为 HMAC 签名)
 * 返 Set-Cookie header 值
 */
export async function createVerifyCookie(phone: string, code: string): Promise<string> {
  const value = await globalSign.sign<VerifyPayload>(
    { phone, code, exp: Date.now() + TTL_MS, attempts: 0 },
    secret(),
  );
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`;
}

export type VerifyResult =
  | { ok: true; phone: string; clearCookie: string }
  | { ok: false; reason: "no_code" | "expired" | "wrong" | "too_many"; clearCookie: string };

/**
 * 读 cookie + 验真 + 返清 cookie header
 */
export async function consumeVerify(
  phone: string,
  code: string,
  headers: Headers,
): Promise<VerifyResult> {
  const raw = headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);

  const clear = clearCookie();

  if (!raw) return { ok: false, reason: "no_code", clearCookie: clear };

  const payload = await globalSign.verify<VerifyPayload>(raw, secret());
  if (!payload) return { ok: false, reason: "no_code", clearCookie: clear };
  if (payload.exp < Date.now()) return { ok: false, reason: "expired", clearCookie: clear };
  if (payload.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many", clearCookie: clear };
  if (payload.phone !== phone) return { ok: false, reason: "wrong", clearCookie: clear };
  if (payload.code !== code) return { ok: false, reason: "wrong", clearCookie: clear };

  return { ok: true, phone, clearCookie: clear };
}
