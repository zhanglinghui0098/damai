// 通用 HMAC 签名工具 — base64url(payload).base64url(hmac_sha256(secret, payload))
// JSON payload, Edge + Node 双 runtime 兼容
// 用 Web Crypto API (globalThis.crypto.subtle)

function getSecret(secret: string): string {
  return secret || "dev-stub-secret-rotate-in-prod";
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
const dec = new TextDecoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret(secret)),
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

export const globalSign = {
  async sign<T>(obj: T, secret: string): Promise<string> {
    const json = JSON.stringify(obj);
    const payloadB64 = b64urlEncode(json);
    const sig = await hmacSign(payloadB64, secret);
    return `${payloadB64}.${sig}`;
  },

  async verify<T>(token: string, secret: string): Promise<T | null> {
    if (!token || !token.includes(".")) return null;
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;

    const ok = await hmacVerify(payloadB64, sig, secret);
    if (!ok) return null;

    try {
      const json = dec.decode(b64urlDecode(payloadB64));
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  },
};
