# Dami Project — 文档使用说明

> 怎么读这套文档 / 怎么用这套文档

---

## 你（用户，张凌辉）怎么用

**场景 1：你下次回来想看进度**
→ 读 `PROJECT.md` 第 2 节"当前阶段"
→ 或问 Hermes："damai 现在到哪了？"

**场景 2：你想推进某一件事**
→ 读 `ROADMAP.md` 看建议顺序
→ 读对应 `tasks/0X-name.md` 看详细
→ 复制 task 文件里的 "Codex 任务单" section → 贴给 Codex
→ Codex 写完贴回来 → 放进 `codex-deliveries/` → 告诉 Hermes

**场景 3：你想知道为什么这么做**
→ 读 `DECISIONS.md`（防横跳）

**场景 4：你要给顾家/客户讲**
→ 读 `tasks/02-content.md`（case study）
→ 读 `tasks/05-business-flow.md`（客户旅程）

---

## 我（Hermes Agent）怎么用

**Session 启动 checklist**（6 步必做）：
1. 读 `state.json` → 知道当前 phase + 5 件事状态
2. 读 `PROJECT.md` → 知道全貌 + 约束
3. 读 `DECISIONS.md` → 知道为什么
4. 读 `ROADMAP.md` → 知道下一步该做啥
5. 扫 `codex-deliveries/` 有没有新文件
6. 扫 `hermes-reports/` 上次给 Codex 留了什么

**何时更新这些文件**：
- 用户拍板 → 立刻更新 `DECISIONS.md`
- 完成里程碑 → 立刻更新 `state.json` 和对应 `tasks/0X.md`
- 出现阻塞 / 风险 → 立刻更新 `PROJECT.md` 风险段
- 给 Codex 写任务单 → 写到 `tasks/0X.md` 的 "Codex 任务单" section

**打岔处理协议**（skill `hermes-project-state-protocol`）：
- 用户说"等等先做 X" → 冻结 damai 当前状态到 state.json → 开新项目 → 做完回来
- context 截断 → 先读 state.json 再回应

---

## Codex 怎么参与

**Codex 是桌面沙盒**，能写代码但不能跟 Hermes 直连。

**用户中转流程**：

```
[你] 复制 tasks/0X.md 的 "Codex 任务单" → 贴给 Codex
[Codex] 写代码到它自己的沙盒
[你] 把 Codex 写完的代码 / 报告 → 贴到 codex-deliveries/2026-06-17-task01.md
[Hermes] 读 codex-deliveries/ → 跟 project 状态对比
[Hermes] 写报告到 hermes-reports/2026-06-17-task01-review.md
[你] 把报告贴给 Codex → 下次 Codex 会话第一句
```

**我优化的部分**：
- task 文件 "Codex 任务单" section 直接可用，**不用你再写**
- 接收目录 `codex-deliveries/` 按日期命名，方便追踪
- 报告目录 `hermes-reports/` 结构化 markdown，复制友好

---

## 目录速查

```
/opt/data/projects/damai/
├── PROJECT.md          ← 入口（你 / 我都先读这个）
├── ROADMAP.md          ← 5 件事时间表
├── DECISIONS.md        ← 决策日志
├── state.json          ← 机器可读进度
├── README.md           ← 本文件
├── PROJECT_STATE.md    ← 老的（已升级，保留作历史）
├── codex-deliveries/   ← Codex 写完贴这
├── hermes-reports/     ← Hermes 写给 Codex
└── tasks/
    ├── 01-code.md
    ├── 02-content.md
    ├── 03-features-p0.md
    ├── 04-pages.md
    └── 05-business-flow.md
```

---

## 验证清单

每次更新后检查：
- [ ] `state.json` 的 `last_updated` 改了
- [ ] `PROJECT.md` 的 "最后更新" 改了
- [ ] `DECISIONS.md` 新增 1 行（如果这轮有拍板）
- [ ] 对应 `tasks/0X.md` 状态变了
- [ ] 任何"为什么"都在 `DECISIONS.md` 有记录
