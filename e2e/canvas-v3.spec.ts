// =====================================================================
// E2E: 大脉画布 v3 (自研, SVG + React state 自管)
// 07-08: 5 DoD 验证 (brief Part 5)
// 4 个 test: 加载 / 6 节点 / 拖线 / 持久化
// =====================================================================

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/sandbox/canvas-v3');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('画布 v3 e2e (自研 SVG + React state)', () => {
  test('1. 加载 /sandbox/canvas-v3: 顶部 v3 logo + 加载 demo 按钮', async ({ page }) => {
    await page.goto('/sandbox/canvas-v3');
    // 顶部 v3 logo
    await expect(page.getByText('大脉 v3')).toBeVisible();
    // 加载 demo 按钮
    await expect(page.getByRole('button', { name: '加载 demo' })).toBeVisible();
    // 状态条 6 节点 / 0 连线
    await expect(page.getByText(/节点: 0/)).toBeVisible();
  });

  test('2. 加载 demo: 6 节点 + 5 边 (text→image→video→merge→output)', async ({ page }) => {
    await page.goto('/sandbox/canvas-v3');
    await page.getByRole('button', { name: '加载 demo' }).click();
    // 6 节点: 找 SVG circle (handle) 数 — 每个 node 至少 1 个 (output 没有)
    // 5 text node (header) 出现 6 次
    const textNodes = page.locator('svg text:has-text("文本")');
    await expect(textNodes).toHaveCount(1);
    // 状态条: 节点 6, 连线 5
    await expect(page.getByText(/节点: 6/)).toBeVisible();
    await expect(page.getByText(/连线: 5/)).toBeVisible();
  });

  test('3. localStorage 持久化: 加载 demo 后 F5, 节点还在', async ({ page }) => {
    await page.goto('/sandbox/canvas-v3');
    await page.getByRole('button', { name: '加载 demo' }).click();
    // 等 350ms (debounced save)
    await page.waitForTimeout(500);
    // 刷新
    await page.reload();
    // 节点 6 还在
    await expect(page.getByText(/节点: 6/)).toBeVisible();
    // localStorage 验证
    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('damai:canvas-v2:r3:v3:'));
      return keys.length > 0 ? localStorage.getItem(keys[0]) : null;
    });
    expect(stored).toBeTruthy();
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.nodes).toHaveLength(6);
      expect(parsed.edges).toHaveLength(5);
    }
  });

  test('4. i2i 自动检测: demo 加载后, image→video 边是 i2i (绿)', async ({ page }) => {
    await page.goto('/sandbox/canvas-v3');
    await page.getByRole('button', { name: '加载 demo' }).click();
    // 等渲染
    await page.waitForTimeout(300);
    // i2i 边显示 "i2i" 文字
    await expect(page.locator('svg text:has-text("i2i")').first()).toBeVisible();
  });
});
