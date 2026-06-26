// =====================================================================
// 火山方舟图像生成 (Seedream 5.0 / 即梦 5.0) - 同步 API
// POST /api/v3/images/generations 立即返回图片 URL
// =====================================================================

const ARK_BASE = process.env.ARK_IMAGE_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
const ARK_KEY = process.env.VOLC_API_KEY || "";
const ARK_DEFAULT_MODEL = process.env.ARK_IMAGE_MODEL || "doubao-seedream-5-0-260128";

// aspect 比例 → WIDTHxHEIGHT (Ark API 接受 WIDTHxHEIGHT 字符串)
const ASPECT_SIZE: Record<string, string> = {
  "1:1": "2048x2048",
  "9:16": "1152x2048",
  "16:9": "2048x1152",
  "3:4": "1536x2048",
  "4:3": "2048x1536",
  "3:2": "2048x1365",
  "2:3": "1365x2048",
  "5:4": "2048x1638",
  "4:5": "1638x2048",
  "21:9": "2560x1097",
  "自适应": "2048x2048",
};

// quality → 长边像素 (Ark API 要求 size 总像素 ≥ 3686400 ≈ 1920x1920)
const QUALITY_LONG_EDGE: Record<string, number> = {
  "1K": 1920,  // 1920×1920 = 3686400 刚好达标
  "2K": 2560,  // 16:9 = 2560×1440 = 3.69Mpx 达标
  "4K": 3840,  // 16:9 = 3840×2160 = 8.29Mpx
};

/**
 * 按 aspect + quality 计算 Ark 接受的 size 字符串
 * - 自适应 + quality → "1k"/"2k"/"4k"
 * - 指定比例 → WIDTHxHEIGHT (长边按 quality 决定, 8 倍数)
 */
export function computeArkSize(aspect: string, quality: string): string {
  if (aspect === "自适应" || !ASPECT_SIZE[aspect]) {
    const q = quality.toUpperCase();
    if (q === "1K") return "1k";
    if (q === "4K") return "4k";
    return "2k";
  }
  // aspect 已给定
  const [w, h] = aspect.split(":").map(Number);
  const longEdge = QUALITY_LONG_EDGE[quality] || 2048;
  let width: number;
  let height: number;
  if (w >= h) {
    width = longEdge;
    height = Math.round((longEdge * h) / w);
  } else {
    height = longEdge;
    width = Math.round((longEdge * w) / h);
  }
  // 8 的倍数 (Ark 要求)
  width = Math.round(width / 8) * 8;
  height = Math.round(height / 8) * 8;
  // 06-26: Ark 硬底线 3,686,400 px (≈ 1920×1920), 1K + 16:9 = 1920×1080 = 2.07M 不达标
  // 自动按比例放大到刚好达标, 保证任意 aspect × quality 都不会被 Ark 400
  const MIN_PIXELS = 3_686_400;
  if (width * height < MIN_PIXELS) {
    const scale = Math.sqrt(MIN_PIXELS / (width * height));
    width = Math.round((width * scale) / 8) * 8;
    height = Math.round((height * scale) / 8) * 8;
  }
  return `${width}x${height}`;
}

export interface GenerateImageOptions {
  prompt: string;
  model?: string;
  aspect?: string;
  quality?: string;
  watermark?: boolean;
  quantity?: number;  // 后端并发 N 次 API 调用, 每张独立生成
  referenceUrls?: string[];  // 上游 image 节点的 outputUrl (i2i 参考)
  signal?: AbortSignal;
}

export interface GenerateImageResult {
  images: Array<{ url: string; size: string }>;
  usage: { generated_images: number; total_tokens: number };
  raw: any;
}

/**
 * 参考图 → base64 data URL
 *
 * 支持两种来源:
 * 1. 本地路径 (/canvas-output/xxx.jpg) — 直接读磁盘 (上游节点生成的图已保存在 public/canvas-output/)
 * 2. 远程 URL (https://...) — fetch 下载 (外部参考图)
 *
 * Ark 接受 inline data URL, 不依赖外网可访问性
 */
async function refUrlToDataUrl(url: string): Promise<string> {
  // 06-26: 检测本地 canvas-output 路径 — 支持相对路径和绝对 URL
  // 例如: /canvas-output/xxx.jpg 或 http://localhost:3000/canvas-output/xxx.jpg
  const localMatch = url.match(/\/canvas-output\/([^/?#]+)$/i);

  if (localMatch) {
    const fs = await import("fs/promises");
    const pathMod = await import("path");
    const filename = localMatch[1];
    const localPath = pathMod.join(process.cwd(), "public", "canvas-output", filename);
    try {
      const buf = await fs.readFile(localPath);
      const ext = pathMod.extname(filename).slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        webp: "image/webp", gif: "image/gif",
      };
      const contentType = mimeMap[ext] || "image/jpeg";
      console.log(`[ark-image] i2i: 从本地读取参考图 ${filename} (${(buf.length / 1024).toFixed(1)}KB)`);
      return `data:${contentType};base64,${buf.toString("base64")}`;
    } catch (e: any) {
      throw new Error(`本地参考图读取失败: ${e.message} (path=${localPath})`);
    }
  }

  // 远程 URL → fetch 下载
  const resp = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`下载远程参考图失败 ${resp.status}: ${url.slice(0, 80)}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  console.log(`[ark-image] i2i: 从远程下载参考图 (${(buf.length / 1024).toFixed(1)}KB)`);
  return `data:${contentType};base64,${buf.toString("base64")}`;
}

/**
 * 单次调火山方舟 image generations API (同步, 10-30s)
 * 接受可选 referenceUrls 作为 i2i 参考图
 */
async function generateOne(opts: GenerateImageOptions): Promise<{ url: string; size: string }> {
  if (!ARK_KEY) {
    throw new Error("VOLC_API_KEY 未配置 (检查 .env.local)");
  }
  const model = opts.model || ARK_DEFAULT_MODEL;
  const size = computeArkSize(opts.aspect || "16:9", opts.quality || "2K");

  // 构造 body: text + 可选 reference image(s)
  const body: any = {
    model,
    prompt: opts.prompt,
    sequential_image_generation: "disabled",  // Ark 5.0 sequential 不支持, 强制单张
    response_format: "url",
    size,
    stream: false,
    watermark: opts.watermark ?? true,
  };
  // 参考图: 下载/读取 → base64 data URL 或原始 URL → 塞入 body.image (Ark 图生图标准字段)
  // ⚠️ 火山方舟 images/generations API 的图生图参数名是 "image" (不是 image_urls!)
  //    支持: HTTP URL / base64 data URL / base64 纯字符串
  //    额外参数: image_strength (0-1, 默认0.5, 越大越像参考图)
  if (opts.referenceUrls && opts.referenceUrls.length > 0) {
    try {
      const resolvedUrls = await Promise.all(opts.referenceUrls.map(refUrlToDataUrl));
      // 单张参考图用字符串, 多张用数组
      body.image = resolvedUrls.length === 1 ? resolvedUrls[0] : resolvedUrls;
      body.image_strength = 0.65;  // 默认偏强参考, 让图生图效果明显可感知
      const totalKB = (resolvedUrls.reduce((s, d) => s + d.length, 0) / 1024).toFixed(1);
      console.log(`[ark-image] i2i: ✅ 注入 ${resolvedUrls.length} 张参考图到 body.image (${totalKB}KB), strength=0.65`);
    } catch (e: any) {
      console.warn(`[ark-image] i2i: ⚠️ 参考图解析失败 (${e.message}), 降级为纯文生图`);
      // 不设 body.image → 纯文生图模式 (不 fallback 到错误字段名)
    }
  }
  // 06-25: 调试日志 (data URL 太长不打印 body, 只打印关键字段)
  console.log(`[ark-image] request: model=${model} size=${size} prompt=${opts.prompt.length}chars refImages=${body.image ? (Array.isArray(body.image) ? body.image.length : 1) : 0}`);

  const resp = await fetch(`${ARK_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ARK_KEY}`,
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    // 06-25 17:xx: 调试: 打印 Ark 完整错误响应, 排查 i2i 字段名
    console.error("[ark-image] Ark response not ok:", resp.status, text.slice(0, 800));
    throw new Error(`Ark image API ${resp.status}: ${text.slice(0, 300)}`);
  }

  const data = await resp.json();
  const first = data.data?.[0];
  if (!first?.url) {
    throw new Error(`Ark 返回无 url: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return { url: first.url, size: first.size };
}

/**
 * 调火山方舟 image generations API (N 次并发, 每张独立)
 * @returns { images: [{url, size}], usage: {generated_images, total_tokens} }
 */
export async function generateImage(opts: GenerateImageOptions): Promise<GenerateImageResult> {
  const qty = Math.max(1, Math.min(opts.quantity ?? 1, 4));  // 限 1-4 防滥用
  if (qty === 1) {
    const one = await generateOne(opts);
    return {
      images: [one],
      usage: { generated_images: 1, total_tokens: 16384 },
      raw: null,
    };
  }
  // 并发 N 次 (每张 prompt 略加随机种子避免完全相同)
  const tasks = Array.from({ length: qty }, (_, i) =>
    generateOne({
      ...opts,
      prompt: opts.prompt + (i > 0 ? ` ,variation ${i + 1}` : ""),
    })
  );
  const results = await Promise.all(tasks);
  return {
    images: results,
    usage: {
      generated_images: results.length,
      total_tokens: results.length * 16384,
    },
    raw: null,
  };
}

/**
 * 下载 Ark 返回的图片 URL 到本地 /public/canvas-output/
 * @returns 本地可访问的 URL 路径 (e.g. "/canvas-output/abc.jpg")
 */
export async function downloadImageToPublic(
  remoteUrl: string,
  filename: string
): Promise<string> {
  const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`下载图片失败 ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const fs = await import("fs/promises");
  const path = await import("path");
  const outDir = path.join(process.cwd(), "public", "canvas-output");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  await fs.writeFile(outPath, buf);
  return `/canvas-output/${filename}`;
}