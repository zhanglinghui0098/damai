// =====================================================================
// /api/health — 公测必备 health check endpoint
// 07-08 P2 (轻量版):
//   - 返回 200 + JSON { status, version, timestamp }
//   - 集成到 deploy script smoke test (deploy 后 1 秒判断 prod 是否 OK)
//   - 集成到 e2e (画布测试前置)
//   - 不依赖 DB / 不读 env (永远快速返回)
// 用法:
//   curl https://damai.net.cn/api/health
//   → {"status":"ok","version":"...","timestamp":"...","node":"ok"}
// =====================================================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';  // 不缓存, 永远实时返回

// 版本: 跟 package.json 同步, build 时 inline
const VERSION = process.env.npm_package_version || '0.1.0';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
    node: process.version,
    uptime: Math.floor(process.uptime()),
  });
}
