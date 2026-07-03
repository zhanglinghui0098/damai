// 07-03 Sentry Edge runtime SDK init (Next.js middleware)
// 触发条件: instrumentation.ts register() 在 NEXT_RUNTIME==="edge" 时 import 这个文件
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
