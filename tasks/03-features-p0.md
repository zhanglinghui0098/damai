# Task 03 — 功能 P0（4 个模块）

**状态**：🟡 pending
**估时**：3 天
**是否要 Codex**：✅ 必需要
**依赖**：[#1 代码](01-code.md)
**最后更新**：2026-06-17 01:18

---

## 目标

在 Next.js 项目上**实现 4 个 P0 功能模块**，让"1 人顶 5 人"的核心工作流通起来。

---

## Codex 7 模块工作流（6/15 提案）

```
1. 素材中心  — /asset 已有雏形
2. 选题     — 没做 (P0)
3. 生成     — /generate 已有，只 1 家模型 (P0: 多模型路由)
4. 审核     — 没做 (P0: 飞书通知)
5. 发布     — 没做 (P1 推)
6. 数据回流 — 没做 (P1 推)
7. 复盘     — 没做 (P0: 复盘页)
```

**P0 做 4 个**：选题 / 多模型 / 审核 / 复盘
**P1 推 3 个**：素材中心升级 / 发布 / 数据回流（多租户时再做）

---

## 模块 A：选题模板（0.5 天）

### 目标

店主登录后看到 4 个 SOP 选题模板，每个含 5 段 prompt 提示词，点一下就能填。

### 4 个模板

1. **晨间家居**（早 9-12 用）
   - 5 段：开场（家居场景氛围）→ 产品展示 → 痛点共鸣 → 解决方案 → CTA
2. **软装搭配**（中午 12-15 用）
   - 5 段：场景引出 → 软装元素 → 搭配逻辑 → 客户场景 → 引导留资
3. **节日营销**（节日前 1 周用）
   - 5 段：节日氛围 → 礼物场景 → 产品推荐 → 限时优惠 → 引导下单
4. **季节上新**（换季时用）
   - 5 段：季节痛点 → 新品发布 → 设计理念 → 实景展示 → 预约到店

### 数据结构

```ts
type Template = {
  id: string;
  name: string;
  category: 'morning' | 'decor' | 'holiday' | 'seasonal';
  prompts: string[]; // 5 段
  sample_video_url?: string; // 样片
  best_time: string; // "9:00-12:00"
  estimated_lead_cost: number; // 历史平均留资成本
}
```

### UI

- `/templates` 页面：4 个卡片，每个点开看 5 段 prompt
- 卡片右上角："应用到生成"按钮 → 跳 `/generate?template=morning`

---

## 模块 B：多模型路由（1 天）

### 目标

`/generate` 页面让用户选模型（火山 vs 可灵），后台按"成本/速度/质量"分场景自动路由。

### 模型对比

| 模型 | 成本/视频 | 速度 | 质量 | 适用 |
|---|---|---|---|---|
| 火山方舟 Seedance 2.0 | ¥0.5 | 60s | 高 | 默认 |
| 可灵 | ¥1.2 | 90s | 中高 | 复杂场景 |

### 路由规则

```python
def route_model(prompt: str, user_tier: str):
    if user_tier == 'trial':  return 'volcengine'  # 试用用户只能用火山
    if '复杂' in prompt or '多人物' in prompt: return 'kling'  # 复杂用可灵
    if len(prompt) > 200: return 'kling'  # 长 prompt 用可灵
    return 'volcengine'  # 默认
```

### UI

- `/generate` 页面表单下加"模型选择"下拉框
- 默认"自动（推荐）"
- 显示预计成本 + 预计时长

### 后端

- `lib/video_client.py` 加可灵适配
- `lib/video_client.ts` 加可选参数
- `/api/generate` 加 `model` 参数

---

## 模块 C：飞书通知审核（1 天）

### 目标

视频生成完 → 自动推飞书卡片 → 老板手机点"通过/打回" → 状态回写到 Bitable

### 复用 tianxipai-bot

**已有基础**：
- 飞书 App: `cli_aa9768a568b8dcb6`
- Webhook 加密/解密代码（见 skill `webhook-receiver-gotchas`）
- Bitable 12 张表（不修改）

### 流程

```
[damai] /api/generate 完 → 调 tianxipai-bot webhook
[tianxipai-bot] 推飞书卡片:
  - 标题: 新视频待审核
  - 内容: 缩略图 + 视频 URL + 模板名 + 生成时间
  - 按钮: [通过] [打回] [改 prompt 重生成]
[老板手机] 点按钮 → 飞书回调到 tianxipai-bot
[tianxipai-bot] 写回 Bitable 的"视频审核表" → 状态 = 通过/打回
[damai] 拉 Bitable → /asset 页面显示"已通过"标签
```

### 新增代码

- `app/api/feishu-review/route.ts` — 接收飞书回调
- `app/review/page.tsx` — H5 审批镜像页（手机端浏览器打开）
- `lib/feishu_bot.py` — 推卡片函数（可放 worker）

### 复用 tianxipai-bot 时的隔离

> **硬规则**：不共享 Hermes 的飞书 App 给别的服务。
> 独立前缀 `TIANXIPAI_*` / `DAMAI_*` 区分。

---

## 模块 D：复盘页（0.5 天）

### 目标

店主登录后看到自己过去 7/30/90 天的数据：
- 视频数 / 留资数 / 留资成本 / 转化率
- 按选题模板分组看哪个最有效
- 按发布时段分组看哪个时段最好

### 数据源

调 Bitable 12 张表里的"直播复盘表" + "视频素材表"

### UI

- `/dashboard` 页面：4 个核心数字 + 2 个图表
- 图表用 Recharts（最简单）
- 数字实时拉（不用缓存）

---

## 给 Codex 的任务单（直接复制）

```
你好 Codex，我是张凌辉。请按以下 spec 给 damai 项目加 4 个 P0 功能：

【项目位置】
/opt/data/projects/damai/

【前置条件】
Task 01 已完成 (NextAuth 鉴权 / .env.local / 客户版 README)

【4 个模块】

模块 A: 选题模板 (0.5 天)
  - 4 个 SOP 模板: 晨间家居 / 软装搭配 / 节日营销 / 季节上新
  - 每个 5 段 prompt
  - /templates 页面: 4 卡片展示
  - "应用到生成" 按钮 → 跳 /generate?template=xxx
  - 数据结构见 tasks/03-features-p0.md

模块 B: 多模型路由 (1 天)
  - lib/video_client.py 加可灵适配
  - lib/video_client.ts 加 model 参数
  - /api/generate 接受 model 参数
  - 路由规则: 试用用户只能用火山 / 复杂 prompt 用可灵 / 默认火山
  - /generate 页面加模型选择下拉框
  - 显示预计成本 + 时长

模块 C: 飞书通知审核 (1 天)
  - 复用 tianxipai-bot webhook
  - /api/feishu-review/route.ts 接收飞书回调
  - 推飞书卡片: 缩略图 + 视频 URL + 模板名 + 生成时间
  - 按钮: [通过] [打回] [改 prompt 重生成]
  - 状态写回 Bitable "视频审核表"
  - 飞书 App ID: cli_aa9768a568b8dcb6
  - 用独立前缀 DAMAI_* (不跟 tianxipai 共享)

模块 D: 复盘页 (0.5 天)
  - /dashboard 页面: 4 核心数字 + 2 图表
  - 数字: 视频数 / 留资数 / 留资成本 / 转化率
  - 时间范围: 7/30/90 天切换
  - 图表: 按模板分组 + 按发布时段分组
  - 用 Recharts
  - 数据源: Bitable 12 张表的 "直播复盘表" + "视频素材表"

【输出】
完成后, 把:
1. 4 个模块的代码 diff
2. 路由列表 (新增/修改/删除)
3. 测试结果 (模板能点 / 模型能切 / 飞书卡片能推 / 复盘数字能拉)
4. 已知问题 / TODO

写到一份 markdown 报告, 贴回给我。
```

---

## 完成标准（DoD）

- [ ] 4 个模块都能用
- [ ] /templates 4 卡片展示
- [ ] /generate 切模型真的能跑（火山 + 可灵各 1 个）
- [ ] 飞书卡片能推 + 按钮能回调 + Bitable 状态写回
- [ ] /dashboard 数字能拉（空数据时显示 0 不报错）
- [ ] 至少 1 个客户走完"选题 → 生成 → 审核 → 看复盘"全流程

---

## 风险

| 风险 | 概率 | 应对 |
|---|---|---|
| 可灵 API 接入难 | 中 | 早期可只接火山，多模型推 P1 |
| 飞书 App 域名限制 | 高 | Vercel 子域名要先在飞书 App 加回调 |
| 复盘页性能 | 中 | 早期不缓存，调 Bitable API 即可 |
| Bitable 字段不全 | 中 | 跟 12 张表 schema 对一遍，缺的字段先标 TODO |
