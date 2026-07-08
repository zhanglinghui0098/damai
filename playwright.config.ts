// =====================================================================
// Playwright E2E 配置 — 大脉 Hermes 画布核心
// 07-08 P1: 改任何画布代码前必须跑 `npm run e2e`, 失败不允许 commit
// 教训: 5 天 30+ commit 改画布没跑过 e2e, 拖线 bug 持续不知道
//
// 用法:
//   npm install                                    # 装 @playwright/test
//   npx playwright install chromium                # 装 chromium browser (~200MB)
//   npm run dev                                    # 起 dev server (端口 3000)
//   npm run e2e                                    # 跑 e2e (自动 reuse 已起的 3000)
//   npm run e2e:ui                                 # UI 模式 (看每步)
// =====================================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // 单测超时 30s, 启动 dev + npm install 等可能要 2-3 min
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  // 失败时截屏 + 录像 (UI mode 也保留)
  fullyParallel: false,  // 画布测试不能并行 (会互相影响 localStorage)
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 如果 3000 已经起 (user 自己 npm run dev), reuse, 不再起
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});
