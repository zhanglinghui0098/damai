# Task #00 · 大脉框架 Codex 任务单

> 这是给 Codex 的任务单，用户复制粘贴给 Codex 后，Codex 写完贴回 NAS `/opt/data/projects/damai/codex-deliveries/`。

---

## 📋 任务背景

**项目**：大脉（Damai）= AI 武装的家居内容营销 SaaS，ToB 模式（顾家 10 经销商 + 天禧派门店）

**当前状态**（2026-06-18）：
- Next.js 14.2.35 项目框架已搭起来（11 页面占位版，Hermes 写的）
- 临时公网 URL：`https://offer-brilliant-civilian-grams.trycloudflare.com`
- Vercel demo 国内需翻墙 → 已用 NAS + Cloudflare Tunnel 过渡
- 备案在审（10-20 工作日）

**你的任务**：把占位版升级成生产版。**核心是鉴权、Model router、Canvas 真实交互**。

---

## 🎯 任务清单（按优先级）

### A. NextAuth.js 飞书 OAuth（最高优先）

**目标**：用户能用飞书账号登录，分多租户

**要求**：
1. 安装 `next-auth@4` + 飞书 OAuth provider
2. `.env.local` 加：
   ```
   FEISHU_APP_ID=cli_xxxxxx
   FEISHU_APP_SECRET=xxxxxx
   NEXTAUTH_SECRET=xxxxxx
   NEXTAUTH_URL=https://damai-gold.vercel.app
   ```
3. `/app/api/auth/[...nextauth]/route.ts` 配 provider
4. `/login` 改成真实接入（去掉 alert mock）
5. middleware.ts 加 tenant_id 检查（每个 request 自动注入 `tenant_id`）
6. 飞书 App 已经有 `cli_aa9768a568b8dcb6`（用户已有），但需要确认有没有 OAuth 权限，没有的话告诉用户去开

**DoD**：
- [ ] `/login` 点"使用飞书登录" → 跳飞书 OAuth → 登录成功回 dashboard
- [ ] 飞书用户信息写入 session（含 open_id / union_id / tenant_id）
- [ ] 未登录访问 `/dashboard` → 跳 `/login`

---

### B. Model Router（统一多模型客户端）

**目标**：写一个 `lib/models/router.ts`，统一 4 个模型调用

**支持的模型**：
1. **即梦**（火山方舟）— `doubao-seedance-1-0-lite-i2v-250428`
2. **Seedance 2.0**（火山方舟）— `doubao-seedance-2-0-260128`
3. **可灵**（快手开放平台）— 待用户提供 API key
4. **Vidu**（生数科技）— 待用户提供 API key

**接口设计**：
```typescript
interface ModelRouter {
  generateVideo(params: {
    model: ModelId;
    text: string;
    imageUrls?: string[];
    audioUrls?: string[];
    ratio: "9:16" | "16:9" | "1:1";
    duration: 5 | 10 | 11 | 15;
  }): Promise<{ taskId: string }>;

  pollTask(taskId: string): Promise<{
    status: "queued" | "running" | "succeeded" | "failed";
    videoUrl?: string;
    error?: string;
  }>;

  // 智能路由：按场景自动选最佳模型
  routeByScenario(scenario: "fast" | "quality" | "low-cost"): ModelId;
}
```

**路由策略**：
- `fast`（30 秒内出片）→ Seedance 2.0（11s）
- `quality`（高质量）→ 可灵（待 API key）
- `low-cost`（最便宜）→ Seedance 1.0 Lite

**失败 fallback**：
- 主模型失败 → 自动切备用
- 3 次都失败 → 返回错误 + 写 Bitable

**DoD**：
- [ ] `lib/models/router.ts` 文件存在
- [ ] 火山方舟客户端实现（即梦 + Seedance 2.0，参考现有 `lib/volcengine.ts`）
- [ ] 可灵 / Vidu 客户端有 mock 实现（用户给 API key 后只改配置就能用）
- [ ] `/generate` 页面调用 router
- [ ] 失败时自动重试 + fallback

---

### C. Canvas 真实交互（节点拖拽）

**目标**：把 `/canvas` 从占位升级成 TapNow 模式（Node / Wire / Group）

**技术选型**：
- 用 `react-flow` 或 `reactflow`（轻量 + Next.js 兼容）
- 不用 Konva（太重）

**要求**：
1. 左侧节点库（6 个节点类型，可拖到画布）
2. 中间画布（无限网格 + 节点 + 可连线）
3. 右侧属性面板（选中节点显示属性）
4. 上方工具栏（保存 / 加载 / 导出 JSON）
5. 节点类型：
   - `老板照` (image_url)
   - `老板声` (audio_url)
   - `文案` (text)
   - `模型` (model_select)
   - `分镜` (multi-shot)
   - `水印` (boolean)

**DoD**：
- [ ] 节点能从左侧拖到画布
- [ ] 节点之间能连线（Wire）
- [ ] 多节点能 Group
- [ ] 保存为 JSON（localStorage 或后端）
- [ ] 加载 JSON

---

### D. AI 内容强制标识组件

**目标**：所有生成视频自动加水印"AI 生成"

**要求**：
1. `components/AiWatermark.tsx` 组件
2. 视频播放时叠水印（左下角，半透明，"AI 生成" 文字）
3. 视频下载时也加水印（用 ffmpeg 后处理，API 路由实现）
4. `/review` 审核页强制显示水印

**DoD**：
- [ ] 组件可在 `/asset`、`/review`、`/dashboard` 复用
- [ ] 下载的视频文件带水印（可选 P1）

---

### E. 多租户 Day 1

**目标**：所有数据带 tenant_id

**要求**：
1. middleware.ts 注入 tenant_id 到所有 request headers
2. Bitable 写入带 tenant_id（用现有 12 张表）
3. localStorage key 加 tenant_id 前缀（避免冲突）

**DoD**：
- [ ] 2 个不同飞书账号登录 → 数据完全隔离

---

## 📁 项目结构

```
/opt/data/projects/damai/
├── app/
│   ├── (已有) page.tsx, generate/page.tsx, asset/page.tsx
│   ├── (新增) login/page.tsx ✅, dashboard/page.tsx ✅, templates/page.tsx ✅
│   ├── (新增) canvas/page.tsx ✅, review/page.tsx ✅
│   ├── (新增) showcase/page.tsx ✅, pricing/page.tsx ✅, about/page.tsx ✅, contact/page.tsx ✅
│   └── api/
│       ├── (已有) generate/route.ts, poll/[taskId]/route.ts
│       └── (新增) auth/[...nextauth]/route.ts
├── lib/
│   ├── (已有) volcengine.ts, kuaishou.ts, bitable.ts
│   └── (新增) models/router.ts, models/seedance.ts, models/jimeng.ts, models/kling.ts, models/vidu.ts
├── components/
│   ├── (新增) AiWatermark.tsx, Canvas/Canvas.tsx, Canvas/NodeLibrary.tsx
│   └── (新增) Nav.tsx (统一顶部导航)
├── middleware.ts
└── .env.local (新建)
```

---

## 🚫 不要做（明确边界）

- ❌ 不要重写首页（Hermes 已写好简化版）
- ❌ 不要做"用户视频公域上传"功能（合规限制）
- ❌ 不要做"公域支付"功能（ICP 经营许可证限制）
- ❌ 不要用 PostgreSQL（用飞书 Bitable）
- ❌ 不要 Docker 化（Vercel / NAS 直接跑）
- ❌ 不要碰 Hermes 已写好的代码（除非 API 兼容需要）

---

## 🎁 完成后交付

1. **diff 报告**：列出改了哪些文件、加了多少行
2. **本地验证步骤**：在 NAS 上跑通的命令（curl 几个 URL 截图）
3. **Codex 写完贴回 `/opt/data/projects/damai/codex-deliveries/2026-06-18-task00-framework.md`**
4. **Hermes 验证后写报告到 `/opt/data/projects/damai/hermes-reports/2026-06-18-task00-review.md`**

---

## 📞 联系方式

- 项目主入口：`/opt/data/projects/damai/PROJECT.md`
- 决策日志：`/opt/data/projects/damai/DECISIONS.md`
- 详细 spec：`/opt/data/projects/damai/ROADMAP.md`

---

**预计工作量**：2-3 天（Codex 一次写完所有 P0）

**优先级**：A (鉴权) > B (Model router) > C (Canvas) > D (水印) > E (多租户)