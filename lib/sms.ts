// 阿里云短信服务 (2017 API)
// dev_stub 模式: 不真发短信,验证码返回到调用方,console.log
// 真实模式: HMAC-SHA1 签名 + 阿里云 HTTPS API
//
// 启用真实模式: .env.local 设 DAMI_SMS_REAL=true + 填 4 个 key
//   ALIYUN_SMS_ACCESS_KEY_ID
//   ALIYUN_SMS_ACCESS_KEY_SECRET
//   ALIYUN_SMS_SIGN_NAME
//   ALIYUN_SMS_TEMPLATE_CODE

// Edge + Node 双 runtime 兼容: 不 import node:crypto
// randomUUID 来自 globalThis.crypto (Node 20+ / 浏览器都支持)

type SendResult = {
  ok: boolean;
  provider: "stub" | "aliyun";
  code?: string; // stub 模式返回验证码 (开发用)
  error?: string;
  requestId?: string;
};

function genCode(): string {
  // 6 位数字,首位不能 0
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getEnv() {
  return {
    real: process.env.DAMI_SMS_REAL === "true",
    accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || "",
    accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || "",
    signName: process.env.ALIYUN_SMS_SIGN_NAME || "",
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || "",
  };
}

/**
 * 阿里云短信 2017 API
 * 文档: https://help.aliyun.com/document_detail/101414.html
 * 签名: HMAC-SHA1(AccessKeySecret + "&", 排序后的参数) base64
 */
async function sendAliyun(
  phone: string,
  code: string,
  env: ReturnType<typeof getEnv>,
): Promise<SendResult> {
  const params: Record<string, string> = {
    AccessKeyId: env.accessKeyId,
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Format: "JSON",
    RegionId: "cn-hangzhou",
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    SignatureNonce: globalThis.crypto.randomUUID(),
    Action: "SendSms",
    Version: "2017-05-25",
    PhoneNumbers: phone,
    SignName: env.signName,
    TemplateCode: env.templateCode,
    TemplateParam: JSON.stringify({ code }),
  };

  // 排序 + URL encode (RFC 3986: 保留 ~ * 不编码, 空格用 %20)
  const sortedKeys = Object.keys(params).sort();
  const canonicalized = sortedKeys
    .map((k) => {
      const v = encodeURIComponent(params[k])
        .replace(/\+/g, "%20")
        .replace(/\*/g, "%2A")
        .replace(/%7E/g, "~");
      return `${encodeURIComponent(k)}=${v}`;
    })
    .join("&");

  const stringToSign = `POST&${encodeURIComponent("/")}&${encodeURIComponent(canonicalized)}`;
  const signature = await hmacSha1Base64(
    stringToSign,
    `${env.accessKeySecret}&`,
  );

  const formBody = new URLSearchParams({ ...params, Signature: signature }).toString();

  try {
    const resp = await fetch("https://dysmsapi.aliyuncs.com/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const data = (await resp.json()) as {
      Code: string;
      Message: string;
      RequestId: string;
    };
    if (data.Code === "OK") {
      return { ok: true, provider: "aliyun", requestId: data.RequestId };
    }
    return { ok: false, provider: "aliyun", error: `${data.Code}: ${data.Message}` };
  } catch (e) {
    return {
      ok: false,
      provider: "aliyun",
      error: e instanceof Error ? e.message : "network error",
    };
  }
}

/**
 * 阿里云短信 2017 API 专用: HMAC-SHA1 → base64 (不用 base64url, 阿里云要标准 base64)
 */
async function hmacSha1Base64(message: string, secret: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  // 转标准 base64 (btoa 路线)
  const bytes = new Uint8Array(sig);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

/**
 * 发送验证码
 * stub 模式: 返回验证码 (开发用,console.log 也能看到)
 * 真实模式: 调阿里云,验证码不返回
 */
export async function sendCode(phone: string): Promise<SendResult & { code: string }> {
  const code = genCode();
  const env = getEnv();

  if (!env.real) {
    // dev_stub 模式 — 验证码直接返,控制台打,方便测试
    console.log(`[SMS stub] phone=${phone} code=${code} (设 DAMI_SMS_REAL=true 切真实)`);
    return { ok: true, provider: "stub", code };
  }

  // 真实模式 — 阿里云. code 必须返回 (cookie 存的就是这个 code)
  const result = await sendAliyun(phone, code, env);
  return { ...result, code };
}
