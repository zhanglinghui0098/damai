# HANDOFF — 07-01 节点 UI 同步

> **新 session 必读** (HANDOFF-2026-07-01-DESKTOP-BUG.md 之后, 这是**下一棒**)

## TL;DR
**6 节点 UI 同步**: 把 ImageNode 的 3 段式 UI 复制到 text/video/audio/merge/output 5 个节点, 保留各自功能。代码已写完, 部署完成, **5/6 节点尺寸正确, output 还卡 150x222 (localStorage 旧 measured)** + **viewport 锁 2x scale** — 需要清 localStorage + 修 fitView 重算。

## 1. 任务背景
**User 原话 (07-01 13:00)**: "好, 根据目前图片节点修改的全部内容, 同步到其他所有节点上。当然前提是不要修改其他节点本身各自的功能内容, 我们只是单一的修改 UI 设计跟布置等等一些细节, 就是刚才所修改的一些细节。而不改变这个节点本身的功能定位, 应该能理解我的意思吧?"

**核心**: 同步 UI, 不动功能。

## 2. 进度 (按 commit 时间序)

| Commit | 改动 |
|---|---|
| `058ed02` (前一棒) | ImageNode i2i 数据流 (useUpstreamUrls hook) |
| `2b570e2` | ImageNode 2 段式拆分 (图片区 / 操作台) + ↑ 上传按钮 |
| `d9a06cc` | 删 image area stopPropagation (修 React Flow 选中) |
| `f49fbb0` | deploy 脚本修 OOM (1024M → 512M heap) |
| `0bbac09` | Handle 20x20 + 蓝紫光晕 + ConnectionLine 视觉 |
| `b8c5e7b` | image 节点 port offset 调整 |
| `fa0aa4c` | image-snap handle `transform: none` + onConnect 挡 self-loop |
| `734b260` | image-snap handle `borderRadius: 0` 覆盖 React Flow 默认 100% 圆角 |
| `42b41bb` | image-snap handle `pointerEvents` 条件化 (平时 `none`, 拖线中 `all`) |
| `3530c26` | 主修 — 3 段式布局 + 居中 + 端口弹出 |
| **`1edc043`** | **同步 UI 到 text/video/audio/merge/output 5 节点 — 创建 NodeScaffold helper** |
| `c1c7ad3` | NodeScaffold 加 `minWidth + width: fit-content` 撑开 React Flow 节点 wrapper |
| `935a5b6` | NodeScaffold 加 `useUpdateNodeInternals` 强制 React Flow 重测 |
| `28a9e5a` | localStorage save 去掉 `measured` 字段 (修旧 150x222 缓存) |
| `78724b2` | ReactFlow 加 `fitViewOptions={{ maxZoom: 1, minZoom: 0.3, padding: 0.15 }}` + useEffect 强制 fitView 重算 |
| **`babe919`** | **当前 HEAD — 临时移除 fitView useEffect (触发 "Application error")** |

## 3. 当前 ECS 状态
- 部署 `babe919`, HTTP 200
- 5/6 节点尺寸正确 (300x...)
- **output 节点还卡 150x222** (旧 measured 在 localStorage `damai-canvas-v2:nodes`)
- **viewport 锁 scale(2)** (旧 fitView 算 600 宽节点, 现在 300 但 viewport 没更新)

## 4. 待解决 (新 session 接手)

### 4.1 output 节点 150x222
**原因**: user 浏览器 localStorage 里的 `damai-canvas-v2:nodes` 还有旧 `measured: { width: 150, height: 222 }`。
**新代码已修**: localStorage save 去掉 measured (`28a9e5a`), NodeScaffold 用 `useUpdateNodeInternals` 强制重测 (`935a5b6`)。
**还需要**: user 硬刷 + 清 localStorage 一次。
**新 session 验证步骤**:
1. `curl -s -o /dev/null -w "%{http_code}\n" https://damai.net.cn/canvas/test`  → 200
2. user 在 browser 硬刷 Ctrl+Shift+R, DevTools → Application → Local Storage → 删 `damai-canvas-v2:nodes` 键
3. 刷新, 加 6 节点
4. `Array.from(document.querySelectorAll('.react-flow__node')).map(n => ({id: n.dataset.id, rect: n.getBoundingClientRect()}))`
5. **期望**: 6 个都接近 300x(200~280)

### 4.2 viewport scale(2) 锁住
**原因**: React Flow `fitView` 在初次 render 用旧 measured (600 宽) 算的 viewport, 节点变 300 后 viewport 没自动重算。
**已加 (78724b2)**: `fitViewOptions={{ maxZoom: 1, minZoom: 0.3, padding: 0.15 }}` 限制 zoom。
**触发 "Application error" 的 useEffect 已临时移除 (babe919)**。需要新 session 排查:
```ts
// 触发的代码
useEffect(() => {
  const t = setTimeout(() => {
    try {
      reactFlow.fitView({ maxZoom: 1, minZoom: 0.3, padding: 0.15, duration: 200 });
    } catch (e) {}
  }, 100);
  return () => clearTimeout(t);
}, [reactFlow]);
```
**可能根因**:
- `reactFlow` 来自 `useReactFlow()`, 在初次 render 时可能为 undefined (hook 时序)
- useEffect 在 `CanvasFlowEditorInner` 里, 紧跟已有的 zoom sync useEffect — 顺序或闭包问题
- React Strict Mode 双调用导致 fitView 被禁用

**新 session 排查路径**:
1. 看 `/opt/data/projects/damai/app/canvas/[id]/CanvasFlowEditor.tsx` line ~1700+ 的 CanvasFlowEditorInner
2. 找到被移除的 useEffect, 用 `console.log` 标位置重加
3. 或换更稳的方式: `<ReactFlow ... defaultViewport={{ x: 0, y: 0, zoom: 1 }} />` 不靠 fitView
4. 或用 `<ReactFlow ... fitView fitViewOptions={{...}} onInit={(instance) => instance.setViewport({x:0,y:0,zoom:1}, {duration:0})}>`

## 5. 关键文件 + 行号
- `/opt/data/projects/damai/app/canvas/[id]/CanvasFlowEditor.tsx` (主文件, 改前 ~2080 行, 改后 ~2390 行)
  - line ~457: `NodeScaffold` helper (新)
  - line ~478: `TextNode` (refactored 用 NodeScaffold)
  - line ~553: `ImageNode` (未 refactor, 保留自定义 upload panel + i2i badge)
  - line ~1001: `VideoGenNode` (refactored)
  - line ~1108: `AudioGenNode` (refactored)
  - line ~1180: `MergeNode` (refactored)
  - line ~1240: `OutputNode` (refactored, `showPorts={false}`)
  - line ~1700+: `CanvasFlowEditorInner` (有 useReactFlow + localStorage save + zoom sync)
- `/opt/data/projects/damai/scripts/deploy-to-ecs.sh` (deploy 脚本, 896Mi ECS 优化)
- `/opt/data/projects/damai/state/STATUS.md` (顶上有 "当前在做" 段)

## 6. NodeScaffold helper 结构 (核心模式)
```tsx
function NodeScaffold({ id, selected, mainContent, bottomSection, mainWidth, mainHeight, showPorts = true }) {
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, updateNodeInternals]);
  return (
    <div data-node-scaffold="1" style={{
      position: 'relative', background: 'transparent', padding: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minWidth: mainWidth, width: 'fit-content',
    }}>
      <div data-main-bare="1" style={{
        position: 'relative', width: mainWidth, height: mainHeight,
        border: selected ? '1.5px solid rgba(110,140,214,0.7)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, background: NODE_BG, overflow: 'visible',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {mainContent}
        <Handle type="source" id={`snap-${id}`} position={Position.Left}
          isConnectableStart={false} isConnectableEnd={true}
          style={{
            position: 'absolute', width: '100%', height: '100%',
            top: 0, left: 0, background: 'transparent', border: 'none',
            opacity: 0, zIndex: 1, transform: 'none', borderRadius: 0,
            pointerEvents: isBeingDraggedTo ? 'all' : 'none',
          }}
        />
        {showPorts && selected && (
          <>
            <Handle type="target" id="in" position={Position.Left} style={...} />
            <Handle type="source" id="out" position={Position.Right} style={...} />
          </>
        )}
      </div>
      {bottomSection}
    </div>
  );
}
```

## 7. 5 节点 mainWidth / mainHeight 配置
| 节点 | mainWidth | mainHeight | bottomSection | showPorts |
|---|---|---|---|---|
| text | 300 | 120 | op-panel (工具 + textarea + chips + run) | true |
| video | 300 | 200 | op-panel (工具 + textarea + chips + run) | true |
| audio | 300 | 90 | op-panel (工具 + textarea + chips + run) | true |
| merge | 300 | 120 | op-panel (input count chip) | true |
| output | 300 | 200 | 无 (终节点) | false |

## 8. 部署命令
```bash
cd /opt/data/projects/damai
git add <file>  # 注意: 不要 -A, 按 memory "commit 范围纪律"
git commit -m "..."
git push
bash scripts/deploy-to-ecs.sh
```

## 9. 已决策的不重问
- NodeScaffold 模式不再改 (user 已认可)
- 各节点功能字段不改 (TextNodeData / VideoGenData / etc. 保持)
- Bug 1/2 防护保留 (handleEdgesChange filter + self-loop 防护)
- i2i 数据流保留
- ImageNode 保留自定义 (不并入 NodeScaffold, 因为有 unique upload panel + i2i badge)

## 10. 关键 memory
- 完事了不可信: deploy 后**必须自己** curl 验证 + browser_console 验节点
- 沟通硬约束: 已决定的不重问, 问问题给清单
- session 纪律: 1 session 1 task, "继续" = 读 STATUS.md
- commit 范围: `git add <specific>` 不要 `-A`
