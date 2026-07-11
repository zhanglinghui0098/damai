// =====================================================================
// 火山方舟 (ARK) 视频生成 — Doubao-Seedance 2.0
// 07-11: 新加, 跟 lib/ark-image.ts 同模式
// ARK API: POST https://ark.cn-beijing.volces.com/api/v3/video/generations
// 文档: https://www.volcengine.com/docs/6791/1397048
// =====================================================================

const ARK_BASE = process.env.ARK_VIDEO_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
const ARK_KEY = process.env.ARK_VIDEO_API_KEY || process.env.VOLC_API_KEY || "";
const ARK_MODEL = process.env.ARK_VIDEO_MODEL || "doubao-seedance-2.0";

// =====================================================================
// 生成视频
// =====================================================================

export interface GenerateVideoOptions {
  prompt: string;
  /** 参考图 (i2v) */
  imageUrl?: string;
  /** 时长 (秒) */
  duration?: number;
  /** 比例 */
  aspect?: string;
}

export interface GenerateVideoResult {
  ok: boolean;
  /** Ark 返回的视频 URL (临时, 需下载到 OSS) */
  videoUrl?: string;
  taskId?: string;
  error?: string;
}

/**
 * 调 ARK Seedance 生成视频
 * 返回临时视频 URL (需下载到 OSS)
 */
export async function generateVideo(
  opts: GenerateVideoOptions,
): Promise<GenerateVideoResult> {
  if (!ARK_KEY) {
    return { ok: false, error: "ARK_VIDEO_API_KEY 未配置" };
  }

  const body: any = {
    model: ARK_MODEL,
    prompt: opts.prompt,
    size: opts.aspect || "1280x720",
    duration: opts.duration || 5,
  };

  if (opts.imageUrl) {
    body.image_url = opts.imageUrl;
  }

  try {
    const resp = await fetch(`${ARK_BASE}/video/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ARK_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return {
        ok: false,
        error: data.error?.message || `ARK ${resp.status}`,
      };
    }

    return {
      ok: true,
      videoUrl: data.data?.[0]?.url || data.url,
      taskId: data.task_id || data.id,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || "网络错误" };
  }
}
