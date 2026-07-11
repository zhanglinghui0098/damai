import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

/**
 * GET /api/auth/me — 前端拿当前登录用户身份
 * 07-11: 供 canvas-v2 SPA 读 cookie 获取 tenantId + phone
 * 返回: { phone, tenantId } 或 401
 * 用法: fetch('/api/auth/me') → { phone, tenantId }
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('damai.session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'not_logged_in' }, { status: 401 });
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: 'session_invalid' }, { status: 401 });
  }
  return NextResponse.json({
    phone: session.phone,
    tenantId: session.tenantId,
  });
}
