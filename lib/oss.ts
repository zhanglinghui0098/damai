// =====================================================================
// 阿里云 OSS 客户端封装 (杭州, damai-zlh-prod Bucket)
// - 单例 client (lazy init, 启动时不连)
// - ENV 缺失 → 抛明确错误, 早暴露问题
// - 路径按月分目录: canvas-output/{yyyy}/{mm}/{filename}
//   → 方便按月归档 + 备份 + 删除过期数据
// - 返回完整 https URL, Ark / 前端 / 下载 都能直接用
// =====================================================================

// @ts-nocheck  // ali-oss 6.23 没顶层 .d.ts, 已在 next.config 加 ignoreBuildErrors 兜底
import OSS from "ali-oss";

const REGION = process.env.ALIYUN_OSS_REGION || "oss-cn-hangzhou";
const BUCKET = process.env.ALIYUN_OSS_BUCKET || "damai-zlh-prod";
const ENDPOINT = process.env.ALIYUN_OSS_ENDPOINT || `https://${REGION}.aliyuncs.com`;
const ACCESS_KEY_ID = process.env.ALIYUN_OSS_ACCESS_KEY_ID || "";
const ACCESS_KEY_SECRET = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || "";

// 标准公共读 URL 模板: https://{bucket}.{region}.aliyuncs.com/{key}
// (Bucket 必须在 OSS 控制台设 ACL=公共读, 或 CDN 走签名 URL)
function publicUrlFor(key: string): string {
  // 不带签名, 任何浏览器直接 GET (Bucket 公共读)
  return `https://${BUCKET}.${REGION}.aliyuncs.com/${key}`;
}

let _client: OSS | null = null;

function client(): OSS {
  if (_client) return _client;
  if (!ACCESS_KEY_ID || !ACCESS_KEY_SECRET) {
    throw new Error(
      "[oss] ALIYUN_OSS_ACCESS_KEY_ID / ALIYUN_OSS_ACCESS_KEY_SECRET 未配置. " +
        "请在 .env.local 写入后重启 PM2."
    );
  }
  _client = new OSS({
    region: REGION,
    endpoint: ENDPOINT,
    bucket: BUCKET,
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: ACCESS_KEY_SECRET,
    // cname: false (默认), 不接自定义域名
    // secure: true (默认 https)
  });
  return _client;
}

/**
 * 上传 Buffer / Stream / string 到 OSS
 * @param key 例如 "canvas-output/2026/06/abc.jpg"
 * @param body Buffer | string | ReadableStream
 * @param contentType 例如 "image/jpeg"
 * @returns 完整 https 公共读 URL
 */
export async function uploadBuffer(
  key: string,
  body: Buffer | string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const c = client();
  const result = await c.put(key, body, {
    headers: {
      "Content-Type": contentType,
      // Cache-Control: 1 年 (生成的图不会改)
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  console.log(`[oss] uploaded ${key} (${(Buffer.isBuffer(body) ? body.length : 0) / 1024 | 0}KB) → ${result.url}`);
  return publicUrlFor(key);
}

/**
 * 拼出对象 key (按月分目录)
 * @param prefix 例如 "canvas-output" 或 "uploads"
 * @param filename 例如 "abc.jpg"
 * @returns 例如 "canvas-output/2026/06/abc.jpg"
 */
export function buildKey(tenantId: string, prefix: string, filename: string): string {
  // S3+1 (P0 #4): tenant 隔离 — OSS key 前缀 tenantId, 防止跨用户访问
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${tenantId}/${prefix}/${yyyy}/${mm}/${filename}`;
}

/**
 * 删除对象 (失败不抛错, 仅 log)
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    await client().delete(key);
    console.log(`[oss] deleted ${key}`);
  } catch (e: any) {
    console.error(`[oss] delete failed ${key}:`, e?.message || e);
  }
}

/**
 * 同步本地文件路径到 OSS (Stream, 不占内存)
 */
export async function uploadFile(
  key: string,
  filepath: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const c = client();
  const result = await c.put(key, filepath, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
  console.log(`[oss] uploaded file ${filepath} → ${result.url}`);
  return publicUrlFor(key);
}

/**
 * 检查 ENV 是否配置 (启动期诊断)
 */
export function ossEnvCheck(): { ok: boolean; missing: string[]; bucket: string; region: string } {
  const missing: string[] = [];
  if (!ACCESS_KEY_ID) missing.push("ALIYUN_OSS_ACCESS_KEY_ID");
  if (!ACCESS_KEY_SECRET) missing.push("ALIYUN_OSS_ACCESS_KEY_SECRET");
  if (!BUCKET) missing.push("ALIYUN_OSS_BUCKET");
  if (!REGION) missing.push("ALIYUN_OSS_REGION");
  return { ok: missing.length === 0, missing, bucket: BUCKET, region: REGION };
}