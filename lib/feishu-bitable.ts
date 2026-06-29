// 飞书 Bitable wrapper — 大脉
// 创建: 2026-06-29 (S1 = 建表)
// S2 = wrapper 函数 + API route
//
// Table: 00_用户档案 (tblrKxhy83Jk4M9E)
// 11 fields: 手机号/昵称/公司/角色/头像URL/租户ID/状态/创建时间/最后登录时间/登录次数/标签
//
// 环境注意 (S1 踩坑):
// - FEISHU_APP_ID / FEISHU_APP_SECRET 必须有值, .env.local = *** placeholder 失效
// - 建议 source /opt/data/.env line 432 (32 字符真值) 或在 .env.local 写真值
// - 飞书 DateTime 字段值用毫秒时间戳 (number), 不是 ISO string

const BASE = "https://open.feishu.cn/open-apis";
const APP_TOKEN = "RPvQbE65Ga4pN6sFop1cZfI1nWg";
const USER_TABLE_ID = "tblrKxhy83Jk4M9E";

// ====== Types ======

export type UserRole = "管理员" | "编辑" | "查看";
export type UserStatus = "活跃" | "禁用";

export interface UserRecord {
  record_id?: string;
  手机号: string;
  昵称?: string;
  公司?: string;
  角色?: UserRole;
  头像URL?: string;
  租户ID: string;
  状态?: UserStatus;
  创建时间?: number;
  最后登录时间?: number;
  登录次数?: number;
  标签?: string;
}

// ====== HTTP ======

export async function getTenantAccessToken(): Promise<string> {
  const appId = process.env.FEISHU_APP_ID;
  const secret = process.env.FEISHU_APP_SECRET;
  if (!appId || !secret) {
    throw new Error("FEISHU_APP_ID / FEISHU_APP_SECRET not set (env.local /opt/data/.env 都没值)");
  }
  const res = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: secret }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Token fetch failed: code=${data.code} ${data.msg}`);
  }
  return data.tenant_access_token;
}

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

// ====== CRUD ======

/**
 * 按手机号查找用户 (用 GET list 简化, S2 单租户 OK; 100+ 用户再换 filter)
 */
export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  const resp = await feishuApi(
    "GET",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${USER_TABLE_ID}/records?page_size=100`,
  );
  if (resp.code !== 0) throw new Error(`findUserByPhone failed: ${resp.msg}`);
  const items: any[] = resp.data?.items ?? [];
  const hit = items.find((r) => r.fields?.手机号 === phone);
  if (!hit) return null;
  return { record_id: hit.record_id, ...hit.fields };
}

/**
 * 创建用户
 */
export async function createUser(fields: UserRecord): Promise<string> {
  const resp = await feishuApi(
    "POST",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${USER_TABLE_ID}/records`,
    { fields },
  );
  if (resp.code !== 0) throw new Error(`createUser failed: ${resp.msg}`);
  return resp.data?.record?.record_id ?? "";
}

/**
 * 更新用户 by record_id
 */
export async function updateUser(recordId: string, fields: Partial<UserRecord>): Promise<void> {
  const resp = await feishuApi(
    "PUT",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${USER_TABLE_ID}/records/${recordId}`,
    { fields },
  );
  if (resp.code !== 0) throw new Error(`updateUser failed: ${resp.msg}`);
}

/**
 * upsert: 找到 update, 没找到 create
 * 默认填: 租户ID=t_<phone>, 角色=查看, 状态=活跃, 登录次数=1, 时间戳=now
 */
export async function upsertUser(
  phone: string,
  extra: Partial<UserRecord> = {},
): Promise<{ record_id: string; created: boolean; tenantId: string }> {
  const tenantId = `t_${phone}`;
  const existing = await findUserByPhone(phone);
  if (existing) {
    const updateFields: Partial<UserRecord> = { ...extra };
    // 只在 user 没设置时填默认 (避免覆盖)
    if (extra.角色 && !existing.角色) updateFields.角色 = extra.角色;
    if (extra.昵称 && !existing.昵称) updateFields.昵称 = extra.昵称;
    await updateUser(existing.record_id!, updateFields);
    return { record_id: existing.record_id!, created: false, tenantId };
  }
  const newRecord: UserRecord = {
    手机号: phone,
    租户ID: tenantId,
    状态: "活跃",
    角色: "查看",
    登录次数: 1,
    创建时间: Date.now(),
    最后登录时间: Date.now(),
    ...extra,
  };
  const record_id = await createUser(newRecord);
  return { record_id, created: true, tenantId };
}

/**
 * 更新最后登录时间 + 登录次数 (login flow 调用)
 */
export async function updateLastLogin(phone: string): Promise<void> {
  const existing = await findUserByPhone(phone);
  if (!existing) return;
  await updateUser(existing.record_id!, {
    最后登录时间: Date.now(),
    登录次数: (existing.登录次数 ?? 0) + 1,
  });
}

/**
 * 列出所有用户 (S2 简单 GET, 分页等 S3 加)
 */
export async function listUsers(): Promise<UserRecord[]> {
  const resp = await feishuApi(
    "GET",
    `/bitable/v1/apps/${APP_TOKEN}/tables/${USER_TABLE_ID}/records?page_size=100`,
  );
  if (resp.code !== 0) throw new Error(`listUsers failed: ${resp.msg}`);
  const items: any[] = resp.data?.items ?? [];
  return items.map((r) => ({ record_id: r.record_id, ...r.fields }));
}

export { BASE, APP_TOKEN, USER_TABLE_ID };