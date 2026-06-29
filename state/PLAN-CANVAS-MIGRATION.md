# 大脉画布迁移到 @xyflow/react — 执行计划

> **For 新 session 启动必读** (06-29 19:30 user 决定, 走方案 A)
>
> 目标: 把 `app/canvas/[id]/CanvasEditor.tsx` (3.3k 行自研 SVG) 迁到 `@xyflow/react` (React Flow v12)
>
> 保留 (UI 壳子不动): TopBar / FloatingTools / ZoomControls / PropertiesPanel / TextToolbar / Logo
>
> 改 (画布内核): 节点 + 边 + pan/zoom + 拖线 + 缩放
>
> 预计: 8-10 小时连续工作, 4 个 phase, ~10 个 commit

---

## 0. 启动 (新 session 第一件事, 5min)

读这 5 个文件 (按顺序, 必读):

1. `state/README.md` (入口, 120 行)
2. `state/STATUS.md` (主状态, 33KB)
3. `state/HANDOFF-LATEST.md` (跨 session 交接)
4. **本文件** `state/PLAN-CANVAS-MIGRATION.md` (执行计划)
5. `git log --oneline -15` (看历史)

确认关键事实:
- 部署路径: **阿里云轻量 SWAS 47.96.128.172 (不是 ECS)**
- 部署脚本: `bash scripts/deploy-to-ecs.sh` (保 .env.local, 自动清 bak)
- SSH: `ssh -i /opt/data/home/.ssh/damai-ecs admin@47.96.128.172` (NOPASSWD sudo, 无 root)
- 域名: `https://damai.net.cn`
- 本地路径: `/opt/data/projects/damai`, 生产路径: `/opt/damai`
- 画布 6 节点类型: `text` / `image` / `video-gen` / `audio-gen` / `merge` / `output`
- React 18 + Next.js 14.2.35 ✓ (满足 @xyflow/react v12 要求)

---

## Phase 1: 安装 + 脚手架 (1 小时)

### 任务

1. `cd /opt/data/projects/damai && npm install @xyflow/react` (v12+, 要求 React 18+)
2. 创建新文件 `app/canvas/[id]/CanvasFlowEditor.tsx` (空脚手架)
3. 创建 `app/canvas-v2/[id]/page.tsx` 临时路由用 CanvasFlowEditor (A/B 测试, 不影响老路由)
4. `npm run build` 必须通过 (用 `NEXT_BUILD_WORKERS=1 NODE_OPTIONS=--max-old-space-size=1024`)
5. 部署到 SWAS 走 `bash scripts/deploy-to-ecs.sh`
6. 验证 `damai.net.cn/canvas-v2/test` 显示空 ReactFlow 画布 (200 OK)
7. **Commit**: `scaffold(canvas-v2): install @xyflow/react + new route`

### 成功标志
- npm install 成功, package.json 有 `@xyflow/react`
- build 通过, 部署 OK
- `/canvas-v2/test` 200, 显示空 ReactFlow 画布
- `/canvas/[id]` 老路由 仍正常 (没动 CanvasEditor.tsx)

### 风险
- @xyflow/react SSR 报错: 用 `'use client'` 包裹, 用 `dynamic(() => import('reactflow'), { ssr: false })`
- build OOM: 已用 `NEXT_BUILD_WORKERS=1 + 1024MB`, 跟当前一致

---

## Phase 2: 核心迁移 (4-5 小时)

### 2.1 节点类型 (1.5 小时)

在 `CanvasFlowEditor.tsx` 定义 6 个 custom node:

```typescript
// 1. TextNode: 文字节点
// 2. ImageNode: 图片节点 (含 upload + OSS)
// 3. VideoGenNode: 视频生成节点 (video-gen, 调 Ark API)
// 4. AudioGenNode: 音频生成节点 (audio-gen)
// 5. MergeNode: 合并节点
// 6. OutputNode: 输出节点 (成片)

const nodeTypes = {
  text: TextNode,
  image: ImageNode,
  'video-gen': VideoGenNode,
  'audio-gen': AudioGenNode,
  merge: MergeNode,
  output: OutputNode,
};
```

每个 node:
- 用 React Flow 的 `NodeProps<{type}>`
- 视觉跟老 CanvasEditor 一致: header (高度) + body + port
- 端口: 1 input (左, Handle type="target") + 1 output (右, Handle type="source")
- 内部逻辑从老 CanvasEditor 复制 (text 编辑, image upload, video gen 等)

### 2.2 边类型 (30 min)
- 用 React Flow 内置 `bezier` 边 (跟老 SVG bezier 一致)
- 颜色 `stroke: '#6e8cd6'`, `strokeWidth: 2`
- **不要**写自定义 edge type, 浪费

### 2.3 State 管理 (1 小时)
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
```
- localStorage 持久化: 用 `onNodesChange` / `onEdgesChange` (库内置) 自动存
- localStorage key: `damai:canvas-v2:nodes:[id]` 和 `damai:canvas-v2:edges:[id]` (防跟老 key `damai:canvas:` 冲突)
- 加载: useEffect 读 localStorage, 调 setNodes/setEdges

### 2.4 案例模板 (1 小时)
- 老 `data/cases/` JSON 模板 → React Flow 的 initial nodes/edges
- 字段映射函数:
  ```typescript
  function oldToNew(oldNode) {
    return {
      id: oldNode.id,
      type: oldNode.type,
      position: { x: oldNode.x, y: oldNode.y },
      data: oldNode.data,
      width: oldNode.w,
      height: oldNode.h,
    };
  }
  ```
- 加载: `loadCaseTemplate(caseId)` → 返回 `{nodes, edges}`

### 2.5 核心交互 (1 小时)
**全部用 React Flow 内置 API, 不用手写数学**:

```typescript
// 双击空白创建节点 (替代老 lastMouseRef + e.clientX/Y 方案)
onPaneDoubleClick={(event) => {
  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });
  setNodes(n => [...n, createNode('text', position)]);
}}

// 拖线连接 (替代老手写 onPortMouseDown / onMouseMove / onPortMouseUp)
onConnect={(connection) => {
  setEdges(e => [...e, { ...connection, type: 'bezier' }]);
}}

// 节点拖动结束 (库内置, 不用手写)
onNodeDragStop={(event, node) => {
  // 保存到 localStorage
}}

// 缩放 (库内置)
<Controls /> // 或自定义 ZoomControls 用 useReactFlow().zoomTo
```

### Commit 节点
1. `feat(canvas-v2): 6 custom node types (text/image/video-gen/audio-gen/merge/output)`
2. `feat(canvas-v2): built-in bezier edge (replace custom SVG path)`
3. `feat(canvas-v2): useNodesState + useEdgesState + localStorage persist`
4. `feat(canvas-v2): case template loader + oldToNew transform`
5. `feat(canvas-v2): 5 core interactions (双击创建/拖线/拖动/缩放/选中)`

### 成功标志
- 6 节点类型渲染正确 (跟老视觉一致)
- 双击空白 → 节点出现在 click 位置 (100% 准, 不再跑画外)
- 拖 port → 自动连 bezier (箭头方向对)
- 节点拖动 → 平滑
- 滚轮缩放 → 平滑
- 缩放时节点缩小 UI 不变 (React Flow 默认)
- localStorage 保存/恢复

---

## Phase 3: UI 壳子集成 (2-3 小时)

**所有 UI 元素视觉不动, 只改 data binding**

### 3.1 TopBar (10 min)
- 通过 React Context 注入 `useReactFlow()` API
- TopBar 按钮 onClick 调 API (不直接调 setNodes)

### 3.2 FloatingTools (+ 按钮) (30 min)
- **关键修复点**: 不再用 lastMouseRef / e.clientX/Y 算 world 坐标
- 双击空白处: React Flow `onPaneDoubleClick` → `reactFlowInstance.screenToFlowPosition()` 算 (100% 准)
- 浮动菜单按钮: 调 `addNode(type)`, 默认位置 `reactFlowInstance.getViewport()` 中心

### 3.3 ZoomControls (10 min)
- 用 `useReactFlow().zoomTo(level)` API
- 视觉不动

### 3.4 PropertiesPanel (1 小时)
- 用 `useNodes()` 拿 `selected` 节点 (库内置)
- 字段绑定: onChange 调 `setNodes(nodes => nodes.map(n => n.id === selectedId ? {...n, data: {...n.data, ...changes}} : n))`
- 视觉不动

### 3.5 TextToolbar (30 min)
- 同 PropertiesPanel, 用 `useNodes` 拿 selected text node
- 视觉不动

### 3.6 Logo + 整体布局 (10 min)
- Logo 保持
- 布局: React Flow 组件放 main area, 其他 UI 兄弟节点 (跟当前架构一样)

### Commit 节点
1. `feat(canvas-v2): TopBar use ReactFlow context`
2. `feat(canvas-v2): FloatingTools use onPaneDoubleClick + screenToFlowPosition`
3. `feat(canvas-v2): ZoomControls use useReactFlow().zoomTo`
4. `feat(canvas-v2): PropertiesPanel use useNodes binding`
5. `feat(canvas-v2): TextToolbar integrate`

### 成功标志
- 视觉跟 `/canvas/[id]` 一模一样
- 所有交互正常, 无"节点跑画外" / "连接线错位"
- 数学问题归零 (库处理)

---

## Phase 4: 测试 + 部署 (1-2 小时)

### 4.1 浏览器测试 (30 min)
用 `vision_analyze` / `browser_vision` / `browser_console` 测:
- [ ] 6 节点类型渲染
- [ ] 双击空白 → 菜单 → 选类型 → 节点出现在 click 位置
- [ ] 拖 port → 拖到目标 port → 自动连 bezier (箭头方向对)
- [ ] 节点拖动: 平滑, 跨 margin 不出错
- [ ] 滚轮缩放: 50% / 100% / 150% 切换, 节点缩小 UI 不变
- [ ] 选中: 单选 / 多选
- [ ] Properties 打开/编辑 (双向 binding)
- [ ] TextToolbar 出现
- [ ] localStorage 持久化: 刷新页面状态恢复
- [ ] 案例模板加载: `/canvas-v2/case-test` 加载 5 节点模板

### 4.2 视觉对照 (30 min)
- 并列打开 `/canvas/[id]` (老) 和 `/canvas-v2/[id]` (新)
- 对比: 节点位置 / 边样式 / 颜色 / 字体 / 间距
- 不一致处: 微调 CSS (主要是 React Flow 默认 vs 当前自定义)
- 重点: 端口大小/颜色, 节点 header 高度, 边粗细

### 4.3 替换老路由 (10 min)
- 修改 `app/canvas/[id]/page.tsx`: import `CanvasFlowEditor` 替换 `CanvasEditor`
- 老 `CanvasEditor.tsx` → `CanvasEditor.old.tsx` (留作 backup, 不删, 注释说明)
- 测试 `/canvas/[id]` 用新代码
- 删除 `/canvas-v2/[id]/` 临时路由 (或保留作 fallback, 看 user 决定)

### 4.4 部署 (20 min)
```bash
git add -A
git commit -m "feat(canvas): migrate to @xyflow/react v12 (3.3k → 1.5k 行, 数学 0)"
bash scripts/deploy-to-ecs.sh
# 部署完: pkill -9 next-server 强制 reload .env.local (防 stub mode)
```

### 4.5 收口 (10 min)
- 更新 `state/STATUS.md`: "✅ 画布迁移到 React Flow 完成"
- 更新 `state/BACKLOG.md`: 加新条目
- 更新 `state/HANDOFF-LATEST.md`
- commit: `docs(state): canvas-v2 migration done`
- push: `git push origin master`

### 成功标志
- `damai.net.cn/canvas/[id]` 正常
- 视觉跟老版本一致 (user 无感升级)
- localStorage 数据兼容 (老的 key `damai:canvas:` 还在, 不影响, 新 key `damai:canvas-v2:` 用一段时间后 user 觉得 OK 再清老的)
- pm2 online, damai.net.cn 速度 OK

---

## 风险 + 缓解

| 风险 | 缓解 |
|---|---|
| @xyflow/react 跟 Next.js 14 SSR 冲突 | `'use client'` 包裹 + `dynamic(() => import('reactflow'), { ssr: false })` |
| 包大 ~200KB gzipped | `dynamic` 懒加载, 路由层 code split |
| localStorage key 冲突 | 新 key 前缀 `damai:canvas-v2:` |
| 视觉差异 | custom nodeTypes + CSS 变量主题化 |
| 老的 localStorage 数据丢 | 兼容一次: 启动时读老 key `damai:canvas:nodes:[id]`, 写入新 key, 之后只用新 key |
| 部署 build OOM | `NEXT_BUILD_WORKERS=1 + NODE_OPTIONS=--max-old-space-size=1024` (跟当前一样) |
| pm2 stub mode (老问题) | 部署完 `pkill -9 -f next-server` 强制 reload .env.local |
| 跑不到 8-10 小时 context 撑爆 | 每 phase 必 commit, 必 push, 失败时下次 session 从 state 续 |

---

## 验证清单 (Phase 4 部署后, 给 user 看的)

- [ ] `https://damai.net.cn` HTTP 200
- [ ] `/canvas/[id]` 进入正常, 不报错
- [ ] 双击空白 → 弹 6 节点菜单
- [ ] 选类型 → 节点出现在 click 位置 (100% 准, 不再跑画外)
- [ ] 拖 port → 拖到目标 port → 自动连 bezier (箭头方向对)
- [ ] 滚轮缩放 → 节点缩小, UI 不变
- [ ] 选中节点 → PropertiesPanel 出现, 编辑生效
- [ ] 选中文字节点 → TextToolbar 出现
- [ ] 编辑节点 → 数据更新, 刷新页面状态恢复
- [ ] 案例模板加载正常
- [ ] pm2 online, 速度 OK
- [ ] `git log` 看完整 10+ commit 链清晰

---

## 不在本次范围 (不要动)

- 视频生成 API (Ark 模型) — 不动
- OSS 上传 — 不动
- Bitable 项目表 — 不动
- 飞书 OpenAPI — 不动
- 多租户 cookie — 不动
- P0 #5 verify-code — 等 user 贴验证码
- 任何业务逻辑 — 不动
- TopBar / FloatingTools / PropertiesPanel / TextToolbar 视觉 — 不动 (只改 binding)

---

## 给新 session 的一句话总结

**任务**: 3.3k 行自研 SVG 画布 → 1.5k 行 React Flow. 视觉不动, 行为一致, 数学问题 0.

**原则**: 4 phase, 每 phase 必 commit + 必能 build + 必能部署. 不要让任何中间态卡住.

**检查点**: 每 phase 结束 `git log --oneline -10` 看 commit 顺序对不对, 不对就 revert 上一个 phase 重做.

**用户上下文**: 06-29 19:30 user 睡了, 期望明早醒来看到完成, 不要再被"context 撑爆" 打断.
