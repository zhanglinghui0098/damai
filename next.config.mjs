/** @type {import('next').NextConfig} */
// v5.10 fix: 让 secret 在 build time inline 到所有 bundle（包括 Edge middleware）
// 原因: Edge runtime 不读 .env.local, middleware 里 process.env.DAMI_SESSION_SECRET 是 undefined
//       → fallback 到 "dev-stub-secret-rotate-in-prod", 但 Node API routes 用真实 secret
//       → 两边不一致 → sign/verify 永远不匹配 → 登录后被 middleware 跳回 /login
// ⚠️ NEXT_PUBLIC_* 才会被 inline 到 client, 普通 env 字段只注入 server bundles
const nextConfig = {
  env: {
    DAMI_SESSION_SECRET: process.env.DAMI_SESSION_SECRET,
    DAMI_SMS_REAL: process.env.DAMI_SMS_REAL,
  },
};

export default nextConfig;
