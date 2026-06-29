// /api/projects/[id]
// GET   — 取单个项目 (跨租户拒绝 403)
// PATCH — 更新项目 (跨租户拒绝 403; 自动 bump 最后修改时间)
// 06-29 14:30 S3
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { getProjectById, updateProject } from "@/lib/feishu-bitable";

export const runtime = "nodejs";

async function getSession() {
  const token = cookies().get("damai.session")?.value;
  return await verifySession(token);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const recordId = params.id;
  try {
    const project = await getProjectById(recordId);
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (project.租户ID !== session.tenantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ ok: true, project });
  } catch (e: any) {
    return NextResponse.json({ error: "get_failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const recordId = params.id;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    // 先确认 ownership
    const project = await getProjectById(recordId);
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (project.租户ID !== session.tenantId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // 只接受允许的字段, 防任意写入
    const updates: Record<string, any> = {};
    if (body.项目名 ?? body.name) updates.项目名 = (body.项目名 ?? body.name).toString().trim();
    if (body.描述 !== undefined || body.description !== undefined) {
      updates.描述 = (body.描述 ?? body.description ?? "").toString();
    }
    if (body.状态 ?? body.status) updates.状态 = (body.状态 ?? body.status).toString();
    if (body.类型 ?? body.type) updates.类型 = (body.类型 ?? body.type).toString();
    if (body.缩略图URL !== undefined || body.thumbnail !== undefined) {
      updates.缩略图URL = (body.缩略图URL ?? body.thumbnail ?? "").toString();
    }
    if (body.标签 !== undefined || body.tags !== undefined) {
      updates.标签 = (body.标签 ?? body.tags ?? "").toString();
    }
    if (body.备注 !== undefined || body.notes !== undefined) {
      updates.备注 = (body.备注 ?? body.notes ?? "").toString();
    }
    if (typeof body.AI提示词次数 === "number" || typeof body.aiPrompts === "number") {
      updates.AI提示词次数 = body.AI提示词次数 ?? body.aiPrompts;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no_fields_to_update" }, { status: 400 });
    }

    await updateProject(recordId, updates);
    return NextResponse.json({ ok: true, updated: Object.keys(updates) });
  } catch (e: any) {
    return NextResponse.json({ error: "update_failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
