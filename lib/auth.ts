// Session 工具 — HMAC 签名 cookie, Edge + Node 双 runtime 兼容
// 用 Web Crypto API (globalThis.crypto.subtle) 而非 node:crypto
// 格式: base64url(payload) + "." + base64url(hmac_sha256(secret, payload))

export const SESSION_COOKIE = "damai.session";
export const SESSION_TTL_DAYS = 30;

type Payload = {
  phone: string;
  tenantId: string;
  // Unix seconds
  exp: number;
};

function getSecret(): string {
  const s = process.env.DAMI_SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DAMI_SESSION_SECRET must be set in production");
    }
    return "dev-stub-secret-rotate-in-prod";
  }
  return s;
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array | string): string {
  let b: Uint8Array;
  if (typeof buf === "string") {
    b = new TextEncoder().encode(buf);
  } else if (buf instanceof Uint8Array) {
    b = buf;
  } else {
    b = new Uint8Array(buf);
  }
  // 转 base64 (browser 兼容)
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4;
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "=".repeat(4 - pad) : "");
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64urlEncode(sig);
}

async function hmacVerify(payload: string, sigB64: string, secret: string): Promise<boolean> {
  try {
    const key = await importKey(secret);
    const sig = b64urlDecode(sigB64);
    return await globalThis.crypto.subtle.verify("HMAC", key, sig, enc.encode(payload));
  } catch {
    return false;
  }
}

/**
 * 生成 session token
 */
export async function createSession(phone: string, tenantId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_DAYS * 24 * 3600;
  const payload: Payload = { phone, tenantId, exp };
  const json = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(json);
  const sig = await hmacSign(payloadB64, getSecret());
  return `${payloadB64}.${sig}`;
}

/**
 * 验真 + 解析
 * 返回 null = 无效/过期
 */
export async function verifySession(token: string | undefined | null): Promise<Payload | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const ok = await hmacVerify(payloadB64, sig, getSecret());
  if (!ok) return null;

  try {
    const json = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(json) as Payload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * 派生 tenant_id — 现在用 phone 直接当 (1 手机号 = 1 租户)
 * 上规模时改成查用户表
 */
export function deriveTenantId(phone: string): string {
  return `t_${phone}`;
}
