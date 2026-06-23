# 大脉 v3 画布 - TapNow 风格重做 (2026-06-23)

> 状态: 新交付, 等用户拍板同步到 Hermes `/opt/data/projects/damai/`
> 作者: Codex (MiniMax 驱动)
> 配套: 5 张 TapNow 画布截图 (整体 + Text/Image/Video/Audio 4 节点生成)

---

## 1. 这次改了什么

按 TapNow 画布风格重写 `CanvasEditor.tsx` (1755 行, 完全替代原 717 行版本), 4 个核心节点 (Text/Image/Video/Audio) 按你给的规格补齐所有设置项。

### 整体 UI
- 深色主题 (`#0a0a0a` 背景 + 点阵网格)
- 顶部状态条: 左 Untitled + 已保存时间, 右 3532 积分 + 社区 + 分享
- 左侧浮动工具栏 (深色胶囊): `+` 加节点 / 文件 / 列表 / 对话 / N 主题切换
- 左下角缩放控件: 缩放滑块 25%-200% + 实时百分比 + 网格切换
- 右下角 脉 logo
- 节点卡: 圆角 16px, 深灰 `#18181b` 填充, 居中大图标占位, 端口在卡片边缘外

### Text 节点 (3 模型 + 翻译优化 + 语音 + 数量)
| 选项 | 值 | 积分 |
|---|---|---|
| 模型 | DeepSeek V4 Pro / Minimax / Gemini | 1 / 1 / 4 (单份) |
| 提示词 | textarea (带 @ 引用素材, / 呼出指令) | - |
| 数量 | 1× / 2× / 4× | 模型单价 × 数量 |
| 语音输入 | 麦克风按钮 | - |

选中 Text 节点时, 节点**上方**浮动文本格式工具条 (H1/H2/H3/¶/B/I/对齐/复制/选择/展开)。

### Image 节点 (2 模型 + 翻译优化 + 11 比例 + 3 清晰度 + 语音 + 数量)
| 选项 | 值 |
|---|---|
| 模型 | 即梦 (8 积分) / Nano Banana Pro (12 积分) |
| 提示词 | textarea + ✨ 翻译/优化按钮 (mock: 自动追加高端家居场景描述) |
| 比例 | 自适应, 1:1, 9:16, 16:9, 3:4, 4:3, 3:2, 2:3, 5:4, 4:5, 21:9 |
| 清晰度 | 1K / 2K / 4K |
| 数量 | 1× / 2× / 4× |
| 语音输入 | 麦克风按钮 |

### Video 节点 (2 模型 + 2 模式 + 比例 + 2 清晰度 + 时长 + 音频开关 + 语音 + 数量)
| 选项 | 值 |
|---|---|
| 模型 | Seedance 2.0 (8 积分) / Clean (12 积分) |
| 模式 | **首尾帧** / **参考图片** (切换后比例/时长 UI 自动变) |
| 比例 | 首尾帧=自适应; 参考=自适应 / 16:9 / 9:16 / 1:1 |
| 清晰度 | 720P / 1080P |
| 时长 | 首尾帧=5s / 10s / 15s 按钮组; 参考=4-15 秒滑动条 |
| 音频 | 开启 / 静音 |
| 语音输入 | 麦克风按钮 |
| 数量 | 1× / 2× / 4× |

### Audio 节点 (1 模型 + 4 类型 + 语音)
| 选项 | 值 |
|---|---|
| 模型 | MiniMax Music 2.6 (25 积分) |
| 类型 | 音乐 / 歌词 / 自适应 / 纯音乐 |
| 提示词 | textarea + ✨ 翻译/优化按钮 |
| 语音输入 | 麦克风按钮 |

### 后期 (merge) + 成片 (output) 节点
保留, 但无配置项 (合并节点 / 输出节点 - 无配置)。

### 运行按钮
**改掉了**画布右边的全局运行, 改成每个 AI 节点 (Text/Image/Video/Audio) 右下角小圆形 `▶` 按钮。点击触发 mock 运行 (setTimeout 1500ms 后 status 变 done)。

### 持久化
保留原 `localStorage` 自动保存 (500ms debounce, key `damai.canvas.{projectId}` + 项目索引 `damai.canvas.index`)。

---

## 2. 怎么同步到 Hermes

### 涉及文件 (2 个)

```
app/canvas/[id]/CanvasEditor.tsx     (1755 行, 完全重写)
app/canvas/[id]/page.tsx             (24 行, 简化 - 去掉原 header)
```

### 同步步骤 (在 NAS Hermes 端执行)

```bash
# 1. 备份当前
cd /opt/data/projects/damai
cp app/canvas/\[id\]/CanvasEditor.tsx app/canvas/\[id\]/CanvasEditor.tsx.bak-0619
cp app/canvas/\[id\]/page.tsx app/canvas/\[id\]/page.tsx.bak-0619

# 2. 把本包文件复制过来 (路径以用户本地为准)
# Windows: C:\Users\Administrator\Documents\大脉\2026-06-23-v3-canvas-tapnow-redesign\
# Linux:   /opt/data/projects/damai/codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign/
cp /opt/data/projects/damai/codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign/app/canvas/\[id\]/CanvasEditor.tsx \
   app/canvas/\[id\]/CanvasEditor.tsx
cp /opt/data/projects/damai/codex-deliveries/2026-06-23-v3-canvas-tapnow-redesign/app/canvas/\[id\]/page.tsx \
   app/canvas/\[id\]/page.tsx

# 3. 触发 HMR / 重启 dev server
# 已有 dev server: 等 HMR 自动刷新 (3-5 秒)
# 没有: rm -rf .next && npm run dev
```

### 不要动
- `app/login/page.tsx` - 等 Task 00 鉴权收尾
- `next.config.*` / `tailwind.config.*` / `package.json`
- `lib/MiniMax.ts` / `lib/templates.ts`
- `middleware.ts` (公域白名单已经包含 `/canvas`)

---

## 3. 验证方法

打开 `https://<你的域名>/canvas/new?template=case` 看 case 模板预置:

1. 整体深色主题, 没有白色干扰
2. 5 个节点 (text / image / video-gen / audio-gen / merge / output) 圆角卡片
3. 端口在卡片边缘外, 圆形带 `+` 图标
4. 连线白色贝塞尔
5. 点 text 节点 → 节点**下方**出现 720px 宽属性面板 (深色玻璃感), 节点**上方**出现文本格式工具条
6. 属性面板: 顶部 tab (💡 / ≡ / +) → 描述输入 → ✨ 翻译/优化按钮 → 模型 chips → 数量 1×/2×/4× → ◆ 4 积分 → ↑ 运行
7. 点 video 节点 → 属性面板出现模式切换 (首尾帧 / 参考图片), 切换到参考后时长变成滑动条 (4-15s)
8. 点节点右下角 ▶ → status 变 "运行中" → 1.5s 后变 "完成"
9. 点左侧 + → 弹出 6 类节点菜单, 选一个加进画布
10. 拖动节点 / 拖端口连线 / Esc 取消选中 / Delete 删节点
11. 刷新页面 → 画布从 localStorage 恢复

---

## 4. 已知问题 / 后续

1. **提示词优化 / 模型路由 / 单节点运行** 全部是 mock, 没真接模型。等 `lib/MiniMax.ts` 完善 + 用户提供火山/可灵 API key 后, 替换 `runOneNode` / `optimizePrompt` 函数。
2. **语音输入** 按钮是占位, 没真接 Web Speech API。
3. **积分余额** 顶部写死 3532, 没接用户系统。
4. **缩放** 25%-200%, 滑块 OK 但没加 1:1 重置按钮 + Ctrl+/- 快捷键。
5. **5 模板预置** 保留了原 5 套 (boss / case / promo / holiday / product), 但默认尺寸适配了新节点卡 (280×约 270), 节点位置 y 坐标往下挪了一点。
6. **右上角分享按钮** 是占位, 没真导出 / 复制链接。
7. **画布 minimap** 没做 (TapNow 也没明显做), 先不做。

---

## 5. 跟之前版本的关键差异

| 维度 | 之前 (v2 / 6-19) | 现在 (v3 / 6-23) |
|---|---|---|
| 主题 | 浅色 (Apple 白) | 深色 (`#0a0a0a` 黑) |
| 节点卡 | 200×120 浅色圆角 | 280×270 深色圆角 + 居中大图标 |
| 端口 | 卡片内嵌小圆点 | 卡片边缘外 + 圆形 + `+` 图标 |
| 属性面板 | 右侧 320px aside | 节点正下方 720px 全宽浮动 |
| 模型选择 | 仅 select 下拉 | chip 按钮组 + dropdown |
| 翻译优化 | 无 | 节点下方 ✨ 按钮 (mock) |
| 语音输入 | 无 | 麦克风按钮 (占位) |
| 数量选择 | 1/2/4 数字按钮 | 1×/2×/4× chip |
| 视频时长 | 1-60 数字输入 | 首尾帧=按钮组; 参考=滑动条 |
| 运行 | 全局画布运行 | 节点右下角 ▶ 单跑 |
| Text 工具条 | 无 | 选中 Text 节点上方浮动 |
| 顶部状态条 | page.tsx 里的 header | CanvasEditor 内 TopBar |

---

## 6. 数据模型摘要 (供后续接 API 时查)

```ts
// 每个 AI 节点的 data 字段:
type NodeData = {
  model: string;          // 当前选的模型 id
  quantity: number;       // 1 / 2 / 4
  prompt: string;         // 提示词
  voiceInput: boolean;    // 语音输入开关 (占位)
  // 视频专属
  mode?: "首尾帧" | "参考图片";
  aspect?: string;        // "16:9" / "自适应" / ...
  quality?: string;       // "720P" / "4K" / ...
  duration?: number;      // 秒
  audio?: "开启" | "静音";
  // 音频专属
  audioType?: "音乐" | "歌词" | "自适应" | "纯音乐";
};
```

模型 + 单价配置在 `NODE_SPECS[*].models: { id, cost }[]`, 加新模型就改这里, UI 自动出。

---

## 7. 验收清单

- [ ] 整体深色, 没白色干扰
- [ ] 4 类节点 (Text/Image/Video/Audio) 完整 settings 面板
- [ ] Video 两种模式 (首尾帧 / 参考图片) 切换正常, UI 自动变
- [ ] 每个节点右下角 ▶ 运行按钮
- [ ] Text 节点上方浮动文本格式工具条
- [ ] 左侧 + 弹出 6 节点菜单
- [ ] localStorage 自动保存 + 刷新恢复
- [ ] 5 模板预置在新 UI 下排版合理
- [ ] 删除 Esc / Delete / 拖动 / 端口连线 基础操作没坏
