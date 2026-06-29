# Phase 3.5 — 画布 chrome 1:1 恢复方案

最后更新: 2026-06-30 06:55 CST

## 背景

User 反馈: "为什么 UI 全改了?我说保留之前的设计,只改底层架构"

**根因**: Phase 1+2 切换 React Flow 时,把 chrome (TopBar / 脉 logo / FloatingTools) 全丢了,也加了 React Flow 默认 chrome (MiniMap / Controls,user 不要)。

## 颜色对比 (实测 grep)

| 部分 | 老画布 | 我做的新画布 | 状态 |
|---|---|---|---|
| 背景 | `#0a0a0a` + radial-gradient | `#0a0a0a` + dot | OK 一致 |
| 节点 | `#1A1A1A` + 边框 `#6e8cd6` | `#1a1a1a` + `rgba(110,140,214,0.5)` | OK 一致 |
| 文字 | `#fff` | `#fff` | OK 一致 |

**色板基本一致,差异在 chrome + 操作方式**。

## 恢复清单 (按优先级)

### Chrome (4 个 data-attr 区块)
1. **TopBar** (`data-top-bar`, line 1021-1118)
   - 顶部状态条: savedAt 时间 / credits / nodeCount / edgeCount
   - 标题点击 (`onTitleClick`)
   - 多个 `data-top-bar` 子区域

2. **"脉" 圆形 logo 浮按钮** (`data-logo`, line 990-1012)
   - 右下角 36x36 圆形
   - `background: linear-gradient(135deg, #6e8cd6, #5a7fbf)`
   - `onClick: goAgent` (打开大脉 AI 助手)
   - 文字: "脉"

3. **FloatingTools** (`data-floating-tools`, line 1120-)
   - 浮工具栏 (可展开)
   - 提供 `onAdd(type)` 添加 6 种节点 (text/image/video-gen/audio-gen/merge/output)
   - `zoom` prop — 在 zoom 缩放时维持大小

4. **data-canvas 主画布** (line 763)
   - `position: fixed` 全屏
   - 黑色背景 + `radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)`
   - 旧 SVG 10400x9600 → **替换为 React Flow viewport,保留背景**

### 操作方式 (4 类 handler)
1. **`onContextMenu={e => e.preventDefault()}`** (line 825)
   - 阻止右键菜单
   - 挂在新画布最外层 div
2. **空白处 `onClick` / `onMouseDown`** (line 790-845)
   - 绕过 chrome 4 个区,在 canvas 空白处触发逻辑
3. **节点拖拽** `onMouseDown={(e) => startDrag(e, n)}` (line 918)
   - React Flow 内置拖拽,不需自己写
4. **FloatingTools 节点创建** `onAdd(type, x?, y?)` (line 1120+)
   - 用 React Flow 的 `useReactFlow().setNodes / addNode`

### 移除 (React Flow 默认 chrome)
- ❌ `<MiniMap />`
- ❌ `<Controls />`
- ❌ `<Background variant={BackgroundVariant.Dots} />` (换成老画布 radial-gradient circle)

## 执行计划 (5 步)

### Step 1: 提取老 chrome 组件代码
读取并保留以下代码片段 (作为 paste 模板):
- TopBar (line 1018-1118) — 完整函数
- FloatingTools (line 1120-1218) — 完整函数
- "脉" logo (line 985-1014) — 完整 JSX
- 主画布 layout (line 750-870) — `data-canvas` 外层 + 事件 handler

### Step 2: 在新画布外层包 chrome
```tsx
return (
  <div data-canvas style={{position:"fixed", inset:0, background:"#0a0a0a", ...}}>
    <div onContextMenu={e=>e.preventDefault()} ...>
      <ReactFlow ... />  {/* 不要 MiniMap / Controls */}
      <TopBar ... />     {/* absolute 顶部 */}
      <FloatingTools ... />  {/* absolute 左侧 */}
      <PulseLogo onClick={goAgent} />  {/* absolute 右下 */}
    </div>
  </div>
)
```

### Step 3: 1:1 移植操作方式
- `onContextMenu preventDefault` (挂外层 div)
- 空白处点击 → `useReactFlow().screenToFlowPosition(e.clientPos)` → `setNodes(add)`
- 节点拖拽: React Flow 内置,移除 `startDrag`
- FloatingTools.onAdd → `useReactFlow().addNode({type, position})`

### Step 4: 背景对齐
- React Flow `<Background>` 移除
- 外层 div 加 `backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px)"`

### Step 5: 部署验证
- `npm run build` (ECS) — 用 deploy 链路 (tar 15M + scp + ssh build + reload)
- `curl https://damai.net.cn/canvas-v2/test` 验证 HTML 含:
  - "TopBar" / savedAt / credits
  - "脉" logo
  - FloatingTools (data-floating-tools)
  - 没有 MiniMap / Controls DOM

## 预估
- 写代码: **30-60min** (CanvasFlowEditor.tsx 从 493 行 → 800-900 行)
- 部署: 5-10min
- 验证: 5min
- **总计: 中段任务**

## 验收 checklist
- [ ] TopBar 出现 (顶部状态条 savedAt / credits / 计数)
- [ ] "脉" logo 出现 (右下角蓝紫渐变)
- [ ] FloatingTools 出现 (点击展开 6 种节点)
- [ ] 双击空白创建节点 (老画布操作)
- [ ] 拖拽节点 (React Flow 内置)
- [ ] 右键菜单被阻止
- [ ] MiniMap / Controls 消失
- [ ] 颜色保持 `#0a0a0a / #1a1a1a / #6e8cd6 / #fff`

## session 边界 (重要)

**当前 session call > 32,已超 user 教的 >15 stop signal。**

下次新 session 第一件事:
1. `cat state/PLAN-CHROME-RESTORE-06-30.md` (本文件)
2. `cat state/BACKLOG-PENDING-06-30.md`
3. 按 Step 1-5 执行

**绝不** 在当前 session 硬撑 — context 会爆 + 容易引入新 bug。