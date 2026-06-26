import { NextRequest, NextResponse } from "next/server";
import { generateImage, downloadImageToPublic } from "@/lib/ark-image";

/**
 * POST /api/canvas/run-image
 * Body: { prompt, model?, aspect?, quality?, watermark?, quantity?, referenceUrls?: string[] }
 * Returns: { ok, outputUrl, outputUrls: string[], size, usage, remoteUrls, refCount? }
 *
 * 安全加固 (2026-06-26):
 *  - prompt 长度上限 2000 字符 (Ark limit 是 1024 token, 2000 字符够用 + 防 DoS)
 *  - quantity 强制 1-4 (Ark 单次最多 4 张)
 *  - referenceUrls 数量上限 4 张参考图 (超出截断, 防 DoS)
 *  - referenceUrls URL 必须是 http(s) (防 SSRF file:// 等)
 *  - 简单 IP 限流: 30 次/分钟 (防脚本刷量扣 API 费)
 */

const PROMPT_MAX = 2000;
const QUANTITY_MIN = 1;
const QUANTITY_MAX = 4;
const REF_MAX = 4;
const RATE_LIMIT = 30; // 次
const RATE_WINDOW = 60 * 1000; // ms

// 内存限流 (重启清零, MVP 够用; 生产应换 Redis)
const rlMap = new Map<string, number[]>();
function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const arr = (rlMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  rlMap.set(ip, arr);
  // 顺手清理过期 key (避免内存泄漏)
  if (rlMap.size > 1000) {
    rlMap.forEach((v, k) => {
      if (!v.some((t) => now - t < RATE_WINDOW)) rlMap.delete(k);
    });
  }
  return true;
}

export async function POST(req: NextRequest) {
  // IP 限流
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  if (!checkIpRate(ip)) {
    return NextResponse.json(
      { error: "rate_limited", detail: `每分钟最多 ${RATE_LIMIT} 次` },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch { body = {} }

  // prompt: 必填 + 长度限制 + 类型保护
  const rawPrompt = body.prompt;
  if (typeof rawPrompt !== "string") {
    return NextResponse.json({ error: "prompt 必须是字符串" }, { status: 400 });
  }
  const prompt = rawPrompt.trim().slice(0, PROMPT_MAX);
  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }

  // quantity: 强制 1-4
  let quantity = Number(body.quantity);
  if (!Number.isFinite(quantity)) quantity = 1;
  quantity = Math.min(Math.max(Math.floor(quantity), QUANTITY_MIN), QUANTITY_MAX);

  // referenceUrls: 数组 + 最多 4 + URL 白名单 (http/https)
  let referenceUrls: string[] | undefined;
  if (Array.isArray(body.referenceUrls)) {
    const filtered = body.referenceUrls
      .filter((u: unknown): u is string => typeof u === "string")
      .filter((u: string) => /^https?:\/\//i.test(u))
      .slice(0, REF_MAX);
    if (filtered.length > 0) referenceUrls = filtered;
  }

  console.log(`[run-image] ip=${ip} prompt=${prompt.slice(0,40)}... qty=${quantity} ref=${referenceUrls?.length || 0}`);

  try {
    const result = await generateImage({
      prompt,
      model: body.model || undefined,
      aspect: body.aspect || undefined,
      quality: body.quality || undefined,
      watermark: body.watermark !== false,
      quantity,
      referenceUrls,
    });

    if (!result.images.length) {
      return NextResponse.json({ error: "Ark 未返回图片" }, { status: 502 });
    }

    // 下载到 /public/canvas-output/
    const idBase = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const downloaded: string[] = [];
    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i];
      const ext = img.url.match(/\.(jpeg|jpg|png|webp)/i)?.[1] || "jpg";
      const filename = `${idBase}_${i}.${ext}`;
      const localUrl = await downloadImageToPublic(img.url, filename);
      downloaded.push(localUrl);
    }

    return NextResponse.json({
      ok: true,
      outputUrl: downloaded[0],
      outputUrls: downloaded,
      size: result.images[0].size,
      usage: result.usage,
      remoteUrls: result.images.map((i) => i.url),
      refUsed: referenceUrls?.length || 0,
    });
  } catch (e: any) {
    console.error("[run-image] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "生成失败" },
      { status: 500 }
    );
  }
}