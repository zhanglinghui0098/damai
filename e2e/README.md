# E2E (Playwright) — 大脉 Hermes 画布核心

> 07-08 P1: 改任何画布代码前必须跑这个 e2e, 失败不允许 commit.
> 教训: 5 天 30+ commit 改画布没跑过 e2e, 拖线 bug 持续 5 天没发现.

## 安装 (一次性)

```bash
npm install                                    # 装 @playwright/test
npx playwright install chromium                # 装 chromium browser (~200MB)
```

## 跑 e2e

```bash
# 选项 A: 自动起 dev server (推荐, 干净环境)
npm run e2e

# 选项 B: UI 模式 (看每步, debug 用)
npm run e2e:ui

# 选项 C: 你已经 npm run dev 跑着 3000, Playwright reuseExistingServer
#         直接跑 npm run e2e
```

## 4 个 test 覆盖

| # | 测什么 | 失败 = 什么坏了 |
|---|--------|-----------------|
| 1 | 加载 `/sandbox/canvas` 关键 UI 在 | 路由 / chrome 1:1 坏了 |
| 2 | 加载 demo 6 节点 + 5 边 + i1 自动 i2i 角标 | NodeScaffold / useUpstreamUrls 坏了 |
| 3 | 拖线 image → video 创建 1 个 edge | onConnect / Handle 坏了 (核心 bug) |
| 4 | 加节点 + F5 刷新节点还在 | saveToApi / loadFromApi / localStorage 坏了 |

## 写新 test

在 `e2e/` 下加 `.spec.ts`. 跑 `npm run e2e` 自动发现.

## 跟部署 / CI 集成 (P2)

- 公测前: GitHub Actions 跑 `npm run e2e` (跟 `npm run build` 一起)
- 失败 = PR 不能 merge
- 详细配置: `.github/workflows/ci.yml` (待写)

## 已知限制

- e2e 跑在 dev server (3000), 不是 production build. build-only 问题 (比如 webpack 优化错) 抓不到
- 跑完记得 `npx playwright install-deps` (Linux 需要)
- 多个 test 共享 localStorage — 用 `beforeEach` clear (spec.ts 已有)
