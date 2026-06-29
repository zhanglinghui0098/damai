// /api/projects
// GET  — 列出当前 session 租户的所有项目
// POST — 创建新项目 (auto-fill: 租户ID, 拥有者手机号, 状态=草稿, 时间戳, AI提示词次数=0)
// 06-29 14:30 S3
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { listProjects, createProject } from "@/lib/feishu-bitable";

export const runtime = "nodejs";

async function getSession() {
  const token = cookies().get("damai.session")?.value;
  return await verifySession(token);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const projects = await listProjects(session.tenantId);
    // 按最后修改时间倒序 (最新在前)
    projects.sort((a, b) => (b.最后修改时间 ?? 0) - (a.最后修改时间 ?? 0));
    return NextResponse.json({ ok: true, projects });
  } catch (e: any) {
    return NextResponse.json({ error: "list_failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // 兼容中英文 key (前端表单用 name, Bitable 用 项目名)
  const name = (body.项目名 ?? body.name ?? "").toString().trim() || "未命名项目";
  const type = (body.类型 ?? body.type ?? "画布").toString();
  const desc = (body.描述 ?? body.description ?? "").toString().trim() || undefined;
  const thumb = (body.缩略图URL ?? body.thumbnail ?? "").toString().trim() || undefined;
  const tags = (body.标签 ?? body.tags ?? "").toString().trim() || undefined;

  try {
    const result = await createProject(session.tenantId, session.phone, {
      项目名: name,
      类型: type as any,
      描述: desc,
      缩略图URL: thumb,
      标签: tags,
    });
    return NextResponse.json({ ok: true, record_id: result.record_id });
  } catch (e: any) {
    return NextResponse.json({ error: "create_failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
