// 07-03 Sentry 浏览器端 SDK init (Next.js 14 App Router)
// 触发条件: 用户在浏览器里访问页面 → 这个文件被 Next.js 自动加载
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,  // 100% 采样, 免费层够用 (5000 events/月)

  // Session Replay (可选, 给前端 bug 看视频回放)
  replaysSessionSampleRate: 0.1,    // 10% 用户录
  replaysOnErrorSampleRate: 1.0,    // 出错必录

  // 调试 (dev 看 console.error, prod 关)
  debug: false,

  // 忽略一些不重要的错误
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",  // Chrome 已知 quirk
    "Network request failed",              // 用户断网
  ],
});
