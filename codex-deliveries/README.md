<!-- README.md (in codex-deliveries/)
     你复制哪个文件给 Codex 看 → 这里有答案
-->

# Codex 简报 — 使用说明

**位置**: `/opt/data/projects/damai/codex-deliveries/`

## 文件清单

| 文件 | 大小 | 用途 | 何时用 |
|---|---|---|---|
| `damai-codex-brief-overview.md` | 17KB | 综合入口（项目全貌 + 任务清单 + 6/18 最新状态） | 第一次让 Codex 看项目时 |
| `damai-codex-brief-task01.md` | 15KB | task 01 (代码) 完整 spec | 准备让 Codex 写代码时 |
| `README.md` | 本文件 | 使用说明 | 你忘了怎么用时 |

## 怎么用

### Step 1: 复制文件
在 NAS 文件管理器（或者 SSH 进去）：
```bash
cat /opt/data/projects/damai/codex-deliveries/damai-codex-brief-overview.md
```
或者用 SMB 挂载的文件管理器打开，复制整文件。

### Step 2: 贴给 Codex
打开 Codex 桌面沙盒，**新建会话**，第一句：
```
看下面这个文件, 然后告诉我你看到什么.
---
[粘贴整个 brief 文件内容]
---
```

### Step 3: 让 Codex 干具体 task
```
看 brief-task01.md, 按 Part 3 的 spec 干.
干完把决策报告 + 关键 diff 贴回给我.
```

### Step 4: 收回 Codex 的产出
Codex 写完代码后，**它会在自己的沙盒里**——你看不到。
让 Codex 把代码 diff 复制出来（用 git diff 或抄到 markdown）。
你拿到后，**贴回 NAS**：
```
/opt/data/projects/damai/codex-deliveries/2026-06-17-task01-delivery.md
```

### Step 5: 我 (Hermes) 自动处理
你把 Codex 产出贴回 NAS 后，**跟我说一句**：
```
codex 干完 task 01 了, 报告在 codex-deliveries/
```
我会自动：
1. 读 Codex 的报告
2. 验证代码 (跑测试 / git status / ...)
3. 更新 state.json
4. 写反馈报告到 hermes-reports/2026-06-17-task01-review.md
5. 告诉你："task 01 进展如何, 下一步是 X"

### Step 6: 把我的反馈给 Codex
复制 hermes-reports/2026-06-17-task01-review.md → 贴给 Codex → 它下次会话第一句。

## 循环

```
[你] brief 文件 → Codex (新会话)
[Codex] 干活, 输出报告
[你] 报告 → codex-deliveries/
[我 (Hermes)] 读 + 验证 + 写反馈 → hermes-reports/
[你] 反馈 → Codex (下次会话第一句)
```

**每次"中转"成本 = 复制粘贴 2 次**（给 Codex + 回给我）。

## 不需要复制整个文件的情况

如果 Codex 已经看过 brief-overview.md, 下次只需要复制新内容：
- 状态更新 → 复制 state.json
- 新 task → 复制对应 brief-taskXX.md
- 反馈 → 复制 hermes-reports/ 对应文件

## 故障排查

| 问题 | 解决 |
|---|---|
| Codex 看不到粘贴的内容 | 你的 Codex 沙盒可能太长, 拆成 2 次贴 |
| Codex 输出太长塞不下它的窗口 | 让它用 git diff --stat + 关键代码段, 别粘整文件 |
| Hermes 找不到 codex-deliveries/ 的文件 | 确认路径: /opt/data/projects/damai/codex-deliveries/ |
| 不知道 task XX 对应哪个 brief | 看 ROADMAP.md 的"详细拆解"段 |
