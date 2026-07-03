// 07-03 Next.js 14 instrumentation hook (官方推荐, 启动时注册 Sentry)
// 触发条件: Next.js 启动时自动调用 register()
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
