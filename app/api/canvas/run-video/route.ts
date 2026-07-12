import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/ark-video";
import { downloadImageToOss } from "@/lib/ark-image";  // 复用 OSS 下载

export const runtime = "nodejs";

const PROMPT_MAX = 2000;
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000;

const rlMap = new Map<string, number[]>();
function checkIpRate(ip: string): boolean {
  const now = Date.now();
  const arr = (rlMap.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= RATE_LIMIT) return false;
  arr.push(now);
  rlMap.set(ip, arr);
  return true;
}

/**
 * POST /api/canvas/run-video
 * Body: { prompt, imageUrl?, duration?, aspect? }
 * Returns: { ok, videoUrl, taskId }
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  if (!checkIpRate(ip)) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "missing_tenant_id" }, { status: 401 });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const rawPrompt = body.prompt;
  if (typeof rawPrompt !== "string" || !rawPrompt.trim()) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }
  const prompt = rawPrompt.trim().slice(0, PROMPT_MAX);

  let imageUrl: string | undefined;
  if (typeof body.imageUrl === "string" && /^https?:\/\//i.test(body.imageUrl)) {
    imageUrl = body.imageUrl;
  }

  console.log(`[run-video] ip=${ip} prompt=${prompt.slice(0,40)}... img=${!!imageUrl}`);

  try {
    const result = await generateVideo({
      prompt,
      imageUrl,
      duration: body.duration,
      aspect: body.aspect,
    });

    if (!result.ok || !result.videoUrl) {
      return NextResponse.json(
        { error: result.error || "生成失败" },
        { status: 502 },
      );
    }

    // 下载到 OSS
    const idBase = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const ossUrl = await downloadImageToOss(tenantId, result.videoUrl, `${idBase}_0.mp4`);

    return NextResponse.json({
      ok: true,
      videoUrl: ossUrl,
      taskId: result.taskId,
    });
  } catch (e: any) {
    console.error("[run-video] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "生成失败" },
      { status: 500 },
    );
  }
}
