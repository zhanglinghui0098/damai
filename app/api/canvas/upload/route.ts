import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Next.js body size limit for this route (默认 1MB 不够, 图片可能 10MB+)
export const runtime = "nodejs";

/**
 * POST /api/canvas/upload
 * Body: FormData { file: File }
 * Returns: { ok, url, filename }
 *
 * 06-27: 优先上传 OSS (杭州 damai-zlh-prod), 失败 fallback 本地 /public/canvas-output/
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "没有文件" }, { status: 400 });
    }

    // 校验类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `不支持的图片格式: ${file.type}` }, { status: 400 });
    }

    // 校验大小 (15MB)
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "图片不能超过 15MB" }, { status: 400 });
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const idBase = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const filename = `${idBase}_upload.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // S3+1 (P0 #4): tenant 隔离 — 没 session 拒绝
    const tenantId = req.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "missing_tenant_id", detail: "未登录或 session 失效" }, { status: 401 });
    }

    // 优先 OSS
    try {
      const { uploadBuffer, buildKey } = await import("@/lib/oss");
      const key = buildKey(tenantId, "uploads", filename);
      const url = await uploadBuffer(key, buffer, file.type);
      console.log(`[upload] ${tenantId} 上传图片到 OSS: ${key} (${(file.size / 1024).toFixed(1)}KB)`);
      return NextResponse.json({ ok: true, url, filename, storage: "oss", tenantId });
    } catch (e: any) {
      console.warn(`[upload] OSS 上传失败 (${e?.message || e}), fallback 到本地`);

      // 本地 fallback (避免一处故障全瘫, 也加 tenantId 隔离)
      const publicDir = path.join(process.cwd(), "public", "canvas-output", tenantId);
      await mkdir(publicDir, { recursive: true });
      const filePath = path.join(publicDir, filename);
      await writeFile(filePath, buffer);
      const url = `/canvas-output/${tenantId}/${filename}`;
      console.log(`[upload] ${tenantId} 保存上传图片 (本地 fallback): ${filename} (${(file.size / 1024).toFixed(1)}KB)`);
      return NextResponse.json({ ok: true, url, filename, storage: "local", tenantId });
    }
  } catch (e: any) {
    console.error("[upload] error:", e?.message || e);
    return NextResponse.json(
      { error: e?.message || "上传失败" },
      { status: 500 }
    );
  }
}