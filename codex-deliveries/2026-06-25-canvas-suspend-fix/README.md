# 大脉 v3 画布 - React Suspense / startTransition 修复 (2026-06-25)

> 状态: 补丁就绪, 等用户拍板同步到 Hermes
> 作者: Codex (MiniMax 驱动)
> 症状: Next.js dev 红屏 - "A component suspended while responding to synchronous input" + "Switched to client rendering because the server rendering errored"
> 触发: Canvas Editor 属性面板里点 textarea 或拖缩放滑块时

---

## 1. 这次改了什么

只改 `CanvasEditor.tsx` 一个文件, 4 处微调, 把所有 `<input>` / `<textarea>` 的 `onChange` 包进 `React.startTransition`:

| 行 | 位置 | 改动 |
|---|---|---|
| 3 | 顶部 import | `import { startTransition, useState, useRef, useEffect } from "react"` |
| 847 | ZoomControls 缩放滑块 | `onChange={(e) => startTransition(() => setZoom(Number(e.target.value) / 100))}` |
| 1349 | PropertiesPanel 提示词 textarea | `onChange={(e) => startTransition(() => setField("prompt", e.target.value))}` |
| 1822 | DurationSlider 视频时长滑块 | `onChange={(e) => startTransition(() => onChange(Number(e.target.value)))}` |

### 修复前后对比

```diff
- onChange={(e) => setField("prompt", e.target.value)}
+ onChange={(e) =>
+   startTransition(() => setField("prompt", e.target.value))
+ }
```

---

## 2. 为什么这样做

### 根因

截图里两条错误是一条因果链:

1. **"Switched to client rendering because the server rendering errored"** - Next.js 在 SSR 时父级 layout 抛错 (几乎肯定是 `useSearchParams()` / `<Suspense>` 在 layout 里用得不对, 或者某个上游组件在 SSR 期间 suspend 了), 整页退到 client render
2. **"A component suspended while responding to synchronous input"** - 客户端模式下, 用户敲 textarea / 拖滑块 → 同步 `onChange` 触发 setState → React 重渲染整棵树 → 那个上游的 Suspense 边界再次被触发 → React 报"同步输入期间挂起了"

React 19 / Next.js 15 的硬性约束: **同步输入事件触发的更新不能挂起任何 Suspense**, 必须用 `startTransition` 标记为非紧急更新。

### CanvasEditor 自身没有 Suspense

我全文 grep 过, CanvasEditor.tsx 里**没有**任何:
- `use()` hook
- `dynamic()` / `React.lazy()`
- `<Suspense>` 边界
- `useSearchParams()` / `usePathname()` / `useParams()` / `useRouter()`
- `fetch()` / `await` / `Promise`
- 抛错 (`throw`)

所以根因不在 CanvasEditor, 在父级 layout (NAS 端, 我看不到)。但 `startTransition` 是 React 明确建议的官方修法, 把它包在 onChange 外层, 即使上游真的 suspend 了, UI 也不会闪成 loading 占位符, 而是保留旧 UI 等新 UI 就绪再切。

### 为什么 textarea + 缩放滑块都要包

- textarea: 用户敲键盘 → onChange 同步 setState → React 检测到任何 Suspense 触发就报错
- 缩放滑块 (`<input type="range">`): 拖动时连续触发 onChange, 风险更高
- 视频时长滑块 (DurationSlider): 同上

---

## 3. 怎么同步到 Hermes

### 涉及文件 (1 个)

```
app/canvas/[id]/CanvasEditor.tsx     (1838 行, +3 行, -3 行)
```

### 同步步骤

#### 方案 A: 只同步本补丁包 (推荐)

```powershell
cd C:\Users\Administrator\Documents\大脉
.\scripts\sync-to-nas.ps1 -Package "2026-06-25-canvas-suspend-fix"
```

精确路径覆盖会把本包的 `CanvasEditor.tsx` 推到 NAS 的 `app/canvas/[id]/CanvasEditor.tsx`, 老版本 `2026-06-23-v3-canvas-tapnow-redesign` 不会被重推 (它还是旧代码, 一旦全量同步会盖回来)。

#### 方案 B: 全量同步 (注意会推老包覆盖)

如果用 `.\scripts\sync-to-nas.ps1` 不带 `-Package`, 会按日期顺序遍历所有 `2026-MM-DD-*` 包, **最后一个同步的就是 NAS 最终版本**。所以要么:
1. 把老包 `2026-06-23-v3-canvas-tapnow-redesign` 里的 CanvasEditor.tsx 也打同样的补丁 (我已经在源文件改好了, 重新跑 sync 即可)
2. 或者干脆只跑方案 A

### 同步完成后

- 已有 dev server: HMR 自动热更新 (3-5 秒)
- 没跑 dev server: 在 NAS 端 `rm -rf .next && npm run dev`

---

## 4. 验证方法

打开 `https://<你的域名>/canvas/new?template=case`, 然后:

1. 选中任意 Image / Video / Audio 节点 → 属性面板弹出
2. **点 textarea 焦点 → 不再出红色错误浮层**
3. **敲几个字 → 不再出红色错误浮层, 输入流畅**
4. **拖左下角缩放滑块 → 同样不报错**
5. 视频节点切到"参考图片"模式 → 拖时长滑块 (4-15s) → 同样不报错
6. 其它功能 (连线 / 拖节点 / Delete 删除 / Esc 取消选中) 完全没动, 仍正常

dev server 控制台那条黄色警告 "A component suspended..." 应该消失, 浏览器右上角红色错误徽标变 0。

---

## 5. 没动的东西

- 没改 page.tsx (它只是透传 props, 不是错误源)
- 没改父级 layout (在 NAS 上, 看不到也不该碰)
- 没改 NODE_SPECS / templateStarter / 任何样式
- 没动 `lib/MiniMax.ts` / `middleware.ts` / `next.config.*` / `package.json`
- 没引入新依赖, `startTransition` 是 React 19 内置

---

## 6. 如果还报错

如果同步后还有别的 Suspense 警告, 一般是上游 layout 的问题, 让用户在浏览器 devtools 里把完整 stack trace 截给我, 我再针对 layout 写补丁。

常见 layout 修法 (NAS 端, 我没碰):
- `app/layout.tsx` 用了 `useSearchParams()` 但没 `<Suspense>` 包裹 → 包一下
- 用了 `usePathname()` 但 layout 设了 `dynamic = "force-static"` → 改 `force-dynamic` 或去 hook

---

## 7. 验收清单

- [x] 顶部 import 增加 `startTransition`
- [x] ZoomControls 缩放滑块 onChange 包 startTransition
- [x] PropertiesPanel textarea onChange 包 startTransition
- [x] DurationSlider 时长滑块 onChange 包 startTransition
- [x] CanvasEditor 其它逻辑零改动 (NODE_SPECS / templateStarter / 渲染 / 样式)
- [x] README 写清根因 + 修复 + 同步方法
