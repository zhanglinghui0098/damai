/**
 * POST /api/generate
 * 创建视频生成任务
 * Body: { model, text, image_urls?, audio_urls?, ratio?, duration? }
 * Returns: { task_id }
 */

import { NextRequest, NextResponse } from "next/server";
import { VolcengineClient } from "@/lib/video_client";

export const runtime = "nodejs";
export const maxDuration = 60; // 火山方舟创建任务 < 30s

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model, text, image_urls, audio_urls, ratio, duration } = body || {};

    if (!model) return NextResponse.json({ error: "缺少 model" }, { status: 400 });
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "缺少 text（文案不能为空）" }, { status: 400 });
    }

    if (!process.env.VOLC_API_KEY) {
      return NextResponse.json(
        { error: "服务端未配置 VOLC_API_KEY（Vercel 环境变量缺失）" },
        { status: 500 }
      );
    }

    const client = new VolcengineClient();

    const taskId = await client.createTask({
      model,
      text: text.trim(),
      imageUrls: image_urls || [],
      audioUrls: audio_urls || [],
      ratio: ratio || "16:9",
      duration: duration || 11,
      generateAudio: true,
    });

    return NextResponse.json({ task_id: taskId, model });
  } catch (e: any) {
    console.error("[/api/generate]", e);
    return NextResponse.json(
      { error: e.message || String(e) },
      { status: 500 }
    );
  }
}
