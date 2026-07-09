# 大脉画布底座调研报告 (2026-07-09)

> **生成**: Ultracode 5 阶段调研 (场景 → 6 底座对比 → 自研评估 → 迁移风险 → 综合)
> **结论**: 保留 React Flow (A/B), v3 (D) 补完 UI/后端, 5 天内可公测
> **承接 1 周前**: user 选 React Flow (cp backup 8569554) → tldraw POC (0e4bee5) → 完全自研 v3 (26c46b2) → 回滚到 React Flow (8cd1904)

---

## 1. 场景定义 (用户已确认)

**核心 = 垂直 AI 工作流的 DAG 节点编辑器** (非通用白板)

| 维度 | 定位 |
|------|------|
| 形态 | 节点编辑器 (Node Editor / Graph Editor) |
| 拓扑 | DAG, 主流向 `prompt → image → i2i → video → output` |
| 节点 | 每个节点 = 1 个 AI 操作步骤, 内嵌 op-panel (model/参数/RunButton) |
| 边 | **类型化数据流边** (typed data flow edge), 不是装饰 |
| 视域 | B 端家居经销商工作流纵深, **不**是 Miro/Excalidraw 自由画 |

### 性能边界 (B 端真实)

| 规模 | 节点 | 边 | 策略 |
|------|------|------|------|
| **典型** | 5-15 | 4-14 | 默认流畅 |
| **舒适上限** | 50 | ~60 | 全量渲染 |
| **硬上限** | 200 | ~250 | viewport culling |
| **极端** | 500+ | — | 不优化 (改成多画布) |

### 边的数据流语义

- ✅ **方向性**: 上游 output → 下游 input, 单向
- ✅ **类型校验**: port 声明类型 (`text`/`image_url`/`video_url`/`referenceImages[]`), 拖线时按类型过滤
- ✅ **数据传递**: RunButton 执行时, 上游 output 作为 payload 注入下游 input
- ✅ **i2i 关键场景**: image 节点 output 自动作为 `referenceUrls` 传给 image 下游

---

## 2. 底座对比矩阵 (6 候选)

| 候选 | License | 类型 | 节点编辑器契合 | 公测风险 | 工程量 |
|------|---------|------|-------------|---------|--------|
| **A. 混合架构 (React Flow + 自研 PortDot)** | MIT | 节点编辑器 | ✅ 生产跑 7 天 | 中 (desktop 拖线仍偶发) | 0 |
| **B. 老 React Flow sandbox (`/sandbox/canvas`)** | MIT | 节点编辑器 | ✅ 生产 | 中 | 0 |
| **C. tldraw POC** | tldraw license (商业) | **whiteboard** ❌ | ❌ 节点编辑器要自己搭 | 高 | ≥2000 行 |
| **D. 完全自研 v3 (SVG + React state)** | - | 节点编辑器 | ✅ 已写 1233 行 | 中 (未实测) | 0 (补完) |
| **E. React Flow v13 升级** | MIT | 节点编辑器 | ✅ | 高 (重写 4000 行) | ≥2 周 |
| **F. Rete.js / Baklava / Drawflow / Litegraph** | MIT | 节点编辑器 | 未知 | 极高 | ≥5000 行 + 学习 5-10 天 |

### 行业证据 (2026)

- **Langflow / Flowise / Dify** = React Flow (n8n = Vue Flow, 同作者)
- **ComfyUI** = LiteGraph.js (Canvas 自绘)
- **结论**: AI 工作流画布, React Flow 是事实标准 (跟 ComfyUI 极端密集图不是同一场景)

---

## 3. 推荐路径: **D 主线 + A 兜底** (分阶段)

### 为什么 D

1. **已投入工程量不浪费**: 1233 行 写完 (commit 26c46b2), 5 DoD 验 4 项 ✅
2. **结构上回避 5 天踩坑**: v3 是完全自研 SVG + React state, **不存在 React Flow v12 controlled mode 时序坑** (这是 `ead8294` + `e71f315` + `8d86e80` 反复翻车的真因)
3. **工作量最省**: 补完 UI + 后端 = 1-2 天, vs 自研其他 / 换库 = 1-2 周

### 为什么 A 兜底

- 已生产 7 天 (07-02 至今), `damai.net.cn/sandbox/canvas` 稳定
- 万一 v3 desktop 翻车, 主页入口改 1 行 commit + deploy 即可, **5 分钟恢复**

### 不推荐

- ❌ **C (tldraw)**: whiteboard 范式, 节点编辑器要 ≥2000 行, 引入商业 license 风险
- ❌ **E (React Flow v13)**: API 变更未充分验证, 重写 2 画布 = ≥2 周
- ❌ **F (第三方节点编辑器)**: 学习曲线 + 生态不全, 公测时间表来不及

---

## 4. 迁移计划 (5 个工作日)

| 日 | agent (1 人) | user (0.5 天) | 产出 |
|----|-------------|-------------|------|
| **D1 (07-10)** | 上午: 空 deploy-to-ecs.sh dry-run + 故意 fail 验证回滚 30s 恢复. 下午: 5 commit (清死代码 / feature flag / 埋点 / 公测角标 / ARMS 告警) | 上午 review + push 1 次. 下午 deploy 全套 | deploy 脚本 dry-run 通过, 5 commit 待拍板 |
| **D2 (07-11)** | 上午: ARMS 阈值告警. 下午: 跑全 e2e (5 test 绿) + 写 `state/HANDOFF-2026-07-11-PUBLIC-BETA-DAY-0.md` | 上午 push 1 次 (commit + 4 ARMS commit 一起). 下午 deploy, 验证 ARMS 收到 1 事件 | 5 commit + 4 ARMS commit 全在 master |
| **D3 (07-12)** | **公测内测 day 0**: 4 人 (user + 2 朋友) soak test 1h, 报 bug | user 全程在, 24h 响应 P0 bug | 暴露并发 / 移动端问题 |
| **D4 (07-13)** | 修 D3 暴露的 P0/P1 (每 bug 1 commit, 不混). 写公测 FAQ | user 拍板是否开公测 | bug 修完, e2e 仍绿 |
| **D5 (07-14)** | **公测开闸**: 50 人邀请 + ARMS 7x24 监控 + 写 `state/HANDOFF-2026-07-14-PUBLIC-BETA-LAUNCH.md` | user 拍板开闸, 24h on-call 第 1 班 | 公测正式开始 |

### SLA

| 优先级 | 响应时间 | 修复时间 |
|--------|----------|----------|
| **P0** | 30min | 2h |
| **P1** | 4h | 当天 |
| **P2** | 24h | 排下周 |
| **P3** | 收集, 不承诺 | - |

---

## 5. 公测风险 (15 项 + 防御)

| # | 风险 | 概率 | 影响 | 防御 |
|---|------|------|------|------|
| R1 | production 5 天没 deploy 的隐性问题 | 中 | 公测一开就 500 | D1 dry-run + 故意 fail 回滚验证 |
| R2 | ARMS 没真部署 (5 天教训再演) | 高 | 盲改 | D2 user 推 4 个 ARMS commit, 验证收 1 事件 |
| R3 | v3 自研路由误访问触发 SSR+React state 冲突 | 中 | 拖线 bug 重现 | D1 删 `app/sandbox/canvas-v3/` 整个目录 |
| R4 | tldraw 路由 14MB 拖累 build + OOM | 中 | build 超时 | D1 删 `app/sandbox/tldraw/` |
| R5 | 没 staging, 公测 = 生产 | 高 | 出问题直接影响公测 | 接受 (1 周不够搭), 用 e2e + on-call + feature flag |
| R6 | desktop Chrome 拖线复现 | 低 | 老用户流失 | D3 重点验, e2e 有 1 拖线 test |
| R7 | mobile Safari / Android Chrome 回归 | 低 | 经销商 mobile 流程废 | D3 重点验 |
| R8 | localStorage 数据迁移 | 中 | 老用户丢数据 | D1 加 migration 脚本 (老 r1 → 新 r2:sandbox) |
| R9 | public/case 视频丢失 | 低 | 案例库空 | 已有 backup (82efc25) |
| R10 | 公测期 user 不在 | 高 | P0 拍板不了 | 24h on-call, P0 拍板权下放 agent |
| R11 | 公开 URL 被刷 | 中 | 算力爆 | IP 限流 10 req/min |
| R12 | 飞书 webhook 漏接告警 | 中 | 5xx 没人看 | D1 验证飞书群收到测试告警 |
| R13 | CLAUDE.md 锁没扩展公测期 | 中 | agent 忍不住自研 | D1 加 "公测期锁" 一句 |
| R14 | e2e 不覆盖 mobile viewport | 中 | 移动端 bug 漏 | D2 加 iPhone 13 viewport test |
| R15 | .env.local 缺 ARMS_LICENSE_KEY | 中 | ARMS 静默不启 | D1 加 `env.example` + 文档 |

---

## 6. 不推荐的选项 (避免下次讨论)

| 方案 | 不推荐原因 |
|------|----------|
| C (tldraw) | whiteboard 范式 ≠ 节点编辑器, ≥2000 行, 商业 license |
| E (React Flow v13) | API 变更未充分验证, ≥2 周重写 |
| F (Rete / Baklava / Drawflow / Litegraph) | 学习曲线 + 生态不成熟, 公测来不及 |
| "用 v3 不补完" | 6 节点全支持是 P0, 内测需完整功能 |

---

## 7. 待 user 拍板 (阻塞 v3 完整化)

| # | 决策项 | 默认假设 |
|---|--------|----------|
| 1 | 主页 `/canvas` redirect: 改 D 还是保留 A | D 验稳后改 |
| 2 | 内测日: A 7-08 已过, 走 B 7-15 还是 C 跳过 | B 7-15 |
| 3 | ECS 升 2C/4G (¥80/月, 07-10 截止) | 是 (避免 OOM) |
| 4 | 视频/音频模型 (Seedance / 可灵 / Vidu / Suno) | Seedance + Suno (Ark 同 key) |
| 5 | GitHub push 失败处理 | 跳过 (deploy 不依赖 push) |

---

## 8. 关键文件路径

**保留 = 主入口**:
- `Z:\damai\hermes-project\app\sandbox\canvas\CanvasFlowSandbox.tsx` (1125 行, React Flow cp backup 8569554)
- `Z:\damai\hermes-project\app\canvas\[id]\CanvasFlowEditor.tsx` (2532 行, Phase 3.5 老入口)

**补完 D = 主线**:
- `Z:\damai\hermes-project\app\sandbox\canvas-v3\CanvasFlowV3.tsx` (1233 行, commit 26c46b2)

**建议删 (D1)**:
- `Z:\damai\hermes-project\app\sandbox\canvas-v3\*` (v3 路由留 deprecated, 但不删目录) — 实际: 留路由, 但主页入口删
- `Z:\damai\hermes-project\app\sandbox\tldraw\*` (14MB, 拖 build 时间)

**部署 + 测试脚本**:
- `Z:\damai\hermes-project\scripts\deploy-to-ecs.sh` (1024M heap + pm2 stop + backup + smoke + 回滚)
- `Z:\damai\hermes-project\e2e\canvas.spec.ts` (5 test)
- `Z:\damai\hermes-project\app\api\health\route.ts` (deploy smoke + ARMS)

**锁文件**:
- `Z:\damai\hermes-project\.claude\CLAUDE.md` (画布核心锁, D1 加 "公测期锁")

---

**报告结束**. 等 user 拍板 §7 → D1 开做.