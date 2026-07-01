# 大脉画布 Self-Drawn Edge 实施 (方案 2 混合架构)

> **开始时间**: 2026-07-02 05:30 CST
> **基线**: HEAD `579f219` (fix Bug 2 终极版 — onEdgesChange 不过滤)
> **触发**: BUG-REPORT-2026-07-01-DRAG-EDGE.md 持续 3 天 30+ commit 未修 → 走 P2 #8 降级方案
> **方案**: 砍 React Flow port/drag/edge, 自研老画布 (CanvasEditor.old.tsx) 移植

## 决策记录

### 1. 选 A (老画布 div PortDot) 而不是 B (React Flow Handle 拦截)

理由: A 不依赖 React Flow store, 自研 findNearest 跟 React Flow 内置 hit detection 完全独立, debug 简单. B 有 React Flow store 跟 mousemove state 打架风险.

### 2. 混合架构 = 保留 React Flow 主框架, 只替换连接线

- ✅ 保留: 坐标系 / 缩放 / pan / fitView / MiniMap / Chrome 4 件套 / 节点 UI
- ❌ 砍: onConnect / onConnectStart / onConnectEnd / connectionLineComponent / connectionRadius / connectionMode / React Flow Handle
- ✅ 加: 边缘渲染走 edgeTypes={{ selfDrawn: SelfDrawnEdge }}, 拖线走自研 pending state + window mousemove

### 3. Edge 格式 = 保留 React Flow 标准

- 用 `{id, source, target, sourceHandle, targetHandle, type: 'selfDrawn'}` 而不是老画布 `{id, fromNode, fromPort, toNode, toPort}`
- 理由: useUpstreamUrls hook (ImageNode i2i 数据流) 仍用 React Flow useStore, 字段要一致

### 4. 坐标方案

- `pending.mouseX/Y` = **React Flow 世界坐标** (用 `useReactFlow().screenToFlowPosition({x: e.clientX, y: e.clientY})` 转换)
- `SelfDrawnEdge` = React Flow 内部, 世界坐标 (React Flow 给 sourceX/Y/targetX/Y 已经是世界坐标)
- 候选线 SVG overlay = **React Flow 外, 屏幕坐标** (起点用 `flowToScreenPosition` 转屏幕, 终点是 mouseX/Y 屏幕坐标)

### 5. PortDot 显示策略

跟随老画布 (.old.tsx line 2018-2083):
- 默认 subtle (opacity 0.32, scale 0.65) — 永远可见
- selected 时 full (opacity 1, scale 1, 蓝紫发光)
- isBeingDraggedTo 时 highlighted (scale 1.4, 绿光)

不再用 React Flow "selected || isBeingDraggedTo 才显示" 策略, 跟随老画布"默认可见"。

## 改动清单

| # | 位置 | 操作 | 备注 |
|---|------|------|------|
| 1 | Line 7 | 删 `Handle,` import | 不再用 |
| 2 | Line 106-153 | 删 LeftHandle/RightHandle 函数 | 已死代码 |
| 3 | Line 428-457 | 删 NodeShell 函数 | 已死代码 |
| 4 | Line 464-602 | 改 NodeScaffold: 删 3 Handle, 加 2 PortDot | PortDot div + data-role="port" |
| 5 | Line 957-1035 | 改 ImageNode: 删 3 Handle, 加 2 PortDot | 同上 |
| 6 | Line 7-30 | 删 `OnConnect, OnConnectStart, OnConnectEnd, ConnectionLineComponent, Position` imports | 部分不用 |
| 7 | NEW | 加 `PortDot` 组件 (老画布 div + data-role port) | line 2018-2083 移植 |
| 8 | NEW | 加 `ConnectionPath` 组件 (bezier + arrow) | line 2186-2219 移植 |
| 9 | NEW | 加 `SelfDrawnEdge` 组件 (React Flow 自定义 edge) | 用 ConnectionPath + markerEnd |
| 10 | CanvasFlowEditorInner | 删 onConnect/onConnectStart/onConnectEnd/handleEdgesChange + 3 个 ref | |
| 11 | CanvasFlowEditorInner | 加 `edgeTypes={{ selfDrawn: SelfDrawnEdge }}` + `pending` state | |
| 12 | CanvasFlowEditorInner | 加全局 window mousemove/up 监听 + findNearest + tryConnect | |
| 13 | CanvasFlowEditorInner | 加 SVG overlay 候选线 (ReactFlow 外, 屏幕坐标) | |
| 14 | ReactFlow props | 删 connectionLineComponent/connectionMode/connectionRadius | |

## 风险与回滚

- 风险 1: React Flow useStore (useUpstreamUrls) 不识别 selfDrawn edge → 监控 i2i badge
- 风险 2: 自研 mousemove 跟 React Flow 节点拖动冲突 → 监听只 mousedown on PortDot 触发
- 风险 3: 桌面 Chrome desktop 仍有问题 → 同 BUG REPORT P0 诊断先做

回滚: `cp CanvasFlowEditor.tsx.bak-20260702-before-self-drawn CanvasFlowEditor.tsx`

## 不动的事

- ❌ 不部署 ECS (公网走 cloudflared tunnel)
- ❌ 不重写节点 UI (NodeScaffold / 6 个节点组件保留)
- ❌ 不改其他 chrome (TopBar/FloatingTools/ZoomControls/Logo)
- ❌ 不动 Bitable / API / 其他模块