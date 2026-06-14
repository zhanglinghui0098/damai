/**
 * GET /api/poll/[taskId]
 * 轮询任务状态
 * Returns: { status, video_url?, error? }
 *
 * 火山方舟状态值：queued / running / succeeded / failed / cancelled
 */

import { NextRequest, NextResponse } from "next/server";
import { VolcengineClient } from "@/lib/video_client";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;

  if (!taskId) {
    return NextResponse.json({ error: "缺少 taskId" }, { status: 400 });
  }

  if (!process.env.VOLC_API_KEY) {
    return NextResponse.json(
      { error: "服务端未配置 VOLC_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const client = new VolcengineClient();
    // 用 poll 一次（不下载）
    const result = await client.pollTaskOnce(taskId);
    return NextResponse.json({
      task_id: taskId,
      status: result.status,
      video_url: result.video_url,
      error: result.error,
    });
  } catch (e: any) {
    console.error("[/api/poll]", e);
    return NextResponse.json(
      { status: "failed", error: e.message || String(e) },
      { status: 500 }
    );
  }
}
