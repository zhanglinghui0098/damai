# Phase 4 + 节点功能按键 部署 Handoff

> **给部署 agent 必读** — 06-30 由 Hermes 写
> 关联: state/PLAN-CANVAS-MIGRATION.md, state/README.md

---

## 1. 这次改了什么 (累计 2 个 commit)

### Commit 1: Phase 4 收口
```
app/canvas/[id]/page.tsx       ← 重写 (不再 redirect, 直接渲染 CanvasFlowEditor)
app/canvas/[id]/CanvasEditor.tsx          → CanvasEditor.old.tsx  (改名备份)
app/canvas-v2/                  ← 整目录删除
package.json + package-lock.json ← 加 @xyflow/react v12
```

### Commit 2: 节点功能按键重设计
```
app/canvas/[id]/CanvasFlowEditor.tsx   ← +334/-11 (59.3 kB)
state/STATUS.md                         ← 加 06-30 08:30 段落
state/PHASE4-DEPLOY-HANDOFF.md (本文件) ← 合并两次部署说明
```

### 节点功能
- **prompt textarea** (inline 编辑, 立即同步到 node.data)
- **ModelChip** (✦ 模型下拉 + 积分显示)
- **ChipRow** (比例/画质/时长/音频/数量 chip)
- **RunButton** (底部圆形运行按钮 + ◆ 积分徽章 + status 动效)
- **NodeShell** 统一外壳
- **NodeUpdateContext** 解决 NodeProps 不支持自定义参数

### 架构变化

```
之前: /canvas/[id] → redirect → /canvas-v2/[id] → 空脚手架
现在: /canvas/[id] → 直接 render ReactFlow v12 完整版 (CanvasFlowEditor.tsx)
      ↑ 含 TopBar / FloatingTools / "脉" logo / ZoomControls / 6 custom nodes / 全部功能按键
```

---

## 2. 部署步骤

```bash
cd Z:\damai\hermes-project

# 1. 检查 git status 干净
git status --short

# 2. 应该等 add 的文件:
#    app/canvas/[id]/page.tsx (Phase 4 重写)
#    app/canvas/[id]/CanvasFlowEditor.tsx (Phase 3.5 + 06-30 节点功能按键)
#    app/canvas/[id]/CanvasEditor.old.tsx (新增, 来自 CanvasEditor.tsx 改名)
#    app/canvas-v2/ (整目录删除)
#    package.json + package-lock.json (新 @xyflow/react)
#    state/STATUS.md + state/PHASE4-DEPLOY-HANDOFF.md + state/HANDOFF-LATEST.md + state/README.md

# 3. Stage + commit (拆 2 commit 方便回滚)
git add app/canvas/[id]/page.tsx \
        app/canvas/[id]/CanvasFlowEditor.tsx \
        app/canvas/[id]/CanvasEditor.old.tsx \
        app/canvas-v2/ \
        package.json package-lock.json
git commit -m "feat(canvas): Phase 4 收口 + 节点功能按键 (prompt/ModelChip/ChipRow/RunButton)"

# 4. 部署
bash scripts/deploy-to-ecs.sh

# 5. 部署完后强制 reload .env.local (老 OOM/stub mode 教训)
#    部署脚本里已经有 pm2 delete + start, env 应该 fresh 了
```

---

## 3. 验证清单 (部署后)

- [ ] `https://damai.net.cn/canvas/123` → 200 OK, 直接显示新画布 (不是 redirect)
- [ ] 画布显示 TopBar + FloatingTools + "脉" logo + ZoomControls
- [ ] 6 个 node 类型 (text/image/video-gen/audio-gen/merge/output) 可在 FloatingTools 添加
- [ ] 拖线连接 → bezier 边自动连
- [ ] 缩放平滑 (滚轮)
- [ ] 浏览器 console 无 React Flow warning
- [ ] `/canvas-v2/123` → 404 (旧路由彻底没了)

---

## 4. 风险

| 风险 | 缓解 |
|---|---|
| 老 localStorage `damai.canvas.{projectId}` 数据读不到 | Phase 3.5 已处理兼容, 启动时迁移到 `damai.canvas-v2.{projectId}` |
| 用户从其他页面打到 /canvas-v2/ 报错 404 | 用户看到 404 → 改 URL /canvas/{id} (或加一个 redirect) |
| React Flow 包太大 +200KB | 已经用 dynamic import, 路由 code split OK |

---

## 5. 不要动

- ❌ CanvasEditor.old.tsx (这是 backup, 注释里说明了)
- ❌ 老路由 page.tsx redirect (已删, 不要重建)
- ❌ canvas-v2 路由 (整目录已删, 不要重建)
- ❌ /opt/damai 直接改 (用 deploy 脚本)

---

## 6. 完成后

让 Hermes 写文档收口:

```bash
# 给 Hermes 看
echo "Phase 4 部署完成, 请更新 state/STATUS.md + HANDOFF-LATEST.md"
```
