import { NextRequest, NextResponse } from "next/server";
import { generateImage, downloadImageToPublic } from "@/lib/ark-image";

/**
 * POST /api/canvas/run-image
 * Body: { prompt, model?, aspect?, quality?, watermark?, quantity?, referenceUrls?: string[] }
 * Returns: { ok, outputUrl, outputUrls: string[], size, usage, remoteUrls, refCount? }
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch { body = {} }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt 不能为空" }, { status: 400 });
  }

  const referenceUrls = Array.isArray(body.referenceUrls) ? body.referenceUrls : undefined;

  console.log(`[run-image] 收到请求: prompt=${prompt.slice(0,40)}... refImages=${referenceUrls?.length || 0} urls=${JSON.stringify((referenceUrls || []).map((u: string) => u.slice(0, 60)))}`);

  try {
    const result = await generateImage({
      prompt,
      model: body.model || undefined,
      aspect: body.aspect || undefined,
      quality: body.quality || undefined,
      watermark: body.watermark !== false,
      quantity: body.quantity ?? 1,
      referenceUrls,
    });

    if (!result.images.length) {
      return NextResponse.json({ error: "Ark 未返回图片" }, { status: 502 });
    }

    // 下载 N 张到 /public/canvas-output/
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
      // 06-26: 告知前端实际用了几个参考图 (用于 UI 反馈确认)
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