// =====================================================================
// E2E: 大脉 Hermes 画布核心
// 07-08 P1: 改任何画布代码前必须跑这个 spec, 失败不允许 commit
// 5 个 test 覆盖核心: health / 加载 / 加节点 / 拖线 / 持久化
// =====================================================================

import { test, expect, Page } from '@playwright/test';

// 每个 test 前清 localStorage (避免上次跑残留)
test.beforeEach(async ({ page }) => {
  await page.goto('/sandbox/canvas');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('画布核心 e2e', () => {
  test('0. /api/health 返 200 + status=ok (公测前必备, 1 秒判断 prod 是否 OK)', async ({ request }) => {
    // 07-08 P2 加: deploy script smoke test 也用这个 endpoint
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBeTruthy();
    expect(body.timestamp).toBeTruthy();
  });


  test('1. 加载 /sandbox/canvas: 关键 UI 元素都在', async ({ page }) => {
    await page.goto('/sandbox/canvas');
    // 顶部 logo
    await expect(page.getByText('大脉').first()).toBeVisible();
    // 左侧 6 个浮动工具按钮
    const floatingTools = page.locator('[class*="floatingTools"]');
    await expect(floatingTools).toBeVisible();
    // 状态条 (节点 / 连线)
    await expect(page.getByText(/节点:/)).toBeVisible();
    // React Flow 已挂
    await expect(page.locator('.react-flow__renderer')).toBeVisible();
  });

  test('2. 加载 demo: 6 节点 + 5 边, i1 自动 i2i 角标', async ({ page }) => {
    await page.goto('/sandbox/canvas');
    // 点 "加载 demo" 按钮 (信息面板里)
    await page.getByRole('button', { name: '加载 demo' }).click();
    // 等 6 节点都渲染
    await expect(page.locator('.react-flow__node')).toHaveCount(6, { timeout: 5_000 });
    // 等 5 边
    await expect(page.locator('.react-flow__edge')).toHaveCount(5, { timeout: 5_000 });
    // i1 有 i2i 角标 (t1 → i1 连线让 i1 自动 i2i)
    // i2i 角标 class 含 "i2iBadge"
    await expect(page.locator('[class*="i2iBadge"]').first()).toBeVisible();
  });

  test('3. 拖线 image → video: 创建 edge', async ({ page }) => {
    await page.goto('/sandbox/canvas');
    // 先加 2 个节点 (双击空白弹菜单, 点图片 + 视频)
    // 用 addNode 走左浮动按钮更稳
    await page.getByTitle('图片').click();
    await page.getByTitle('视频生成').click();
    // 等 2 节点
    await expect(page.locator('.react-flow__node')).toHaveCount(2, { timeout: 5_000 });
    // 找 image 节点的 right handle
    const imageNode = page.locator('.react-flow__node').first();
    const imageRightHandle = imageNode.locator('.react-flow__handle.source').last();
    // 找 video 节点的 left handle
    const videoNode = page.locator('.react-flow__node').nth(1);
    const videoLeftHandle = videoNode.locator('.react-flow__handle.source').first();

    // 模拟拖线: mousedown source → mousemove → mouseup target
    const sourceBox = await imageRightHandle.boundingBox();
    const targetBox = await videoLeftHandle.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('handle boundingBox 找不到');

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    // 移动到中间 (让 React Flow 知道在拖)
    await page.mouse.move(
      (sourceBox.x + targetBox.x) / 2,
      (sourceBox.y + targetBox.y) / 2,
      { steps: 10 },
    );
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.mouse.up();

    // 等 1 个 edge
    await expect(page.locator('.react-flow__edge')).toHaveCount(1, { timeout: 5_000 });
  });

  test('4. 持久化: 加 1 节点后 F5 刷新, 节点还在', async ({ page }) => {
    await page.goto('/sandbox/canvas');
    // 加 1 个节点
    await page.getByTitle('文字').click();
    await expect(page.locator('.react-flow__node')).toHaveCount(1, { timeout: 5_000 });
    // 等 localStorage save (debounced 300ms)
    await page.waitForTimeout(500);
    // F5 刷新
    await page.reload();
    // 节点还在
    await expect(page.locator('.react-flow__node')).toHaveCount(1, { timeout: 5_000 });
  });
});
