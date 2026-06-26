# 画布 API 接入 — 进度 (2026-06-25 02:50)

## ✅ P0 image + 火山方舟即梦 5.0 — 已跑通

### 环境配置
- `.env.local`:
  - `VOLC_API_KEY=ark-cbdb1f20-9cd5-4754-8a64-bca762c60f8f-f1209` (用户给的 ark key)
  - `ARK_IMAGE_MODEL=doubao-seedream-5-0-260128`
  - `ARK_IMAGE_BASE_URL=https://ark.cn-beijing.volces.com/api/v3`
- `.gitignore` 已 ignore `.env.local` ✅

### 代码改动
- ✅ `lib/ark-image.ts` (新) — 封装火山方舟 image API + aspect/quality → size 映射
- ✅ `app/api/canvas/run-image/route.ts` (新) — POST 端点
- ✅ `middleware.ts` — PUBLIC_PREFIXES 加 `/api/canvas`
- ✅ `app/canvas/[id]/CanvasEditor.tsx`:
  - NODE_SPECS image.models: `doubao-seedream-5-0-260128` (替代原"即梦"+Nano Banana Pro)
  - defaultData: model/quality/quantity 改默认值
  - runOneNode: image 类型走真 API，其他仍 mock
  - NodeView 中间区域: data.outputUrl 存在时显示缩略图

### 关键坑 (踩过!)
1. **Ark API size 必须 ≥ 3,686,400 像素** (约 1920x1920)
   - ❌ 错误: `{"code":"InvalidParameter","message":"image size must be at least 3686400 pixels"}`
   - ✅ 修法: `QUALITY_LONG_EDGE = { 1K: 1920, 2K: 2560, 4K: 3840 }`
2. **middleware PUBLIC_PREFIXES 没加 `/api/canvas`** → 307 redirect /login
   - ✅ 修法: middleware.ts PUBLIC_PREFIXES 数组加 `"/api/canvas"`
3. **ChipDropdown 只接 string[]** → NODE_SPECS model.id 直接用 API id（技术派显示）

### 端到端验证 ✅
```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://127.0.0.1:3000/api/canvas/run-image \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"电影感的奶油风客厅, 米白色沙发","aspect":"16:9","quality":"2K"}' \
  --max-time 60
```
返回:
```json
{"ok":true,"outputUrl":"/canvas-output/mqsfcza8l9as.jpeg","size":"2560x1440","usage":{"generated_images":1,"output_tokens":14400}}
```
HTTP 200, 22.6 秒, 文件 312KB

### 浏览器端测试
- ✅ PropertiesPanel 模型下拉显示 `doubao-seedream-5-0-260128`
- ✅ aspect/quality/quantity 控件全显示
- ⚠️ 首次浏览器跑失败 (size 太小), 修后再跑 curl 通 — **浏览器端用户还没刷新验证**

## 待办 P1+
- 用户浏览器刷新 `/canvas/new` → 加 image 节点 → 点 ▶ → 期望 22s 出图 + 节点显示
- P1: 接 video-gen (Seedance 2.0) - 异步任务 + 轮询
- P1: 接 text (DeepSeek) - prompt 优化
- P1: 接 audio (Minimax Music)
- P2: 多模型路由 + 失败 fallback
- P2: 状态持久化 (Bitable)

## 教训 (2026-06-25)
**连续 2 个空回复原因**: terminal 长输出 + patch lint warning + 长 thinking block 撑爆单次 token 预算, response 被截断。
**改进**: 分段汇报 + 缩短 tool 输出 + 任务级持久化。
## 2026-06-25 04:xx — Image 节点 UI 重构 (TopNow 风格)

**用户反馈**：单图节点要去掉外围深色圆角卡片；成倍时右上角"× N"chip；点 chip 弹 2×2 选图；**先改 image 节点，其他节点暂不动**。

**改动**（`app/canvas/[id]/CanvasEditor.tsx` `NodeView`）：
1. `isImage = node.type === "image"` 时：
   - 外框 background → transparent, border → none, borderRadius → 0, boxShadow → none
   - 顶部 header label 不渲染
   - 中间区换新内容：单图（maxHeight 220, objectFit contain, 圆角 4）+ 右上角 "× N" 浮 chip（quantity>1 时）
   - 点 chip 弹全屏 overlay（inset -4, 背景 rgba(0,0,0,0.92), 2×2 grid, z-index 20）
   - 点 overlay 中某图 → 写 `data.selectedIdx` → 关闭 overlay → 主图切换
2. 新 props `onPickImage?: (idx) => void`
3. 调用处 onPickImage: setNodes 把 data.selectedIdx 写回

**未改**：
- 其他节点（text/video-gen/audio-gen/merge/output）保持原深色卡片样式
- prompt 编辑入口（PropertiesPanel）暂未变
- `★ 收藏` 按钮和 prompt 预览缩略图未加（用户截图里有，但本轮只动 NodeView 内的图区）

**待用户验证**：
- 刷新后 image 节点应是裸图（无外框）
- quantity 4 时右上角"× 4"chip 出现
- 点 chip 弹 2×2 overlay
- 选图后主图切换 + 刷新页面保持（selectedIdx 已写 data）
