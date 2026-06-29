// 飞书 Bitable wrapper — 大脉
// 创建: 2026-06-29 (S1)
// Table: 00_用户档案 (tblrKxhy83Jk4M9E)
// S1 完成: 11 fields + shared with user
// S2 待做: upsertUser / getUserByPhone / listUsers 等具体函数

const BASE = "https://open.feishu.cn/open-apis";
const APP_TOKEN = "RPvQbE65Ga4pN6sFop1cZfI1nWg";
const USER_TABLE_ID = "tblrKxhy83Jk4M9E";

/**
 * 拿 tenant_access_token (2h 过期, S2 调用方每次取新的或缓存)
 */
export async function getTenantAccessToken(): Promise<string> {
  const appId = process.env.FEISHU_APP_ID;
  const secret = process.env.FEISHU_APP_SECRET;
  if (!appId || !secret) {
    throw new Error("FEISHU_APP_ID / FEISHU_APP_SECRET not set in env");
  }
  const res = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: secret }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Token fetch failed: code=${data.code} ${data.msg}`);
  return data.tenant_access_token;
}

/**
 * 通用飞书 API 调用
 */
export async function feishuApi(method: string, path: string, body?: unknown) {
  const token = await getTenantAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ====== S2 待加函数 (TODO) ======
// - upsertUser(phone: string, fields: Record<string, any>)
// - getUserByPhone(phone: string)
// - listUsers(filter?: { tenantId?: string; role?: string })
// - updateUserLastLogin(phone: string)

export { BASE, APP_TOKEN, USER_TABLE_ID };