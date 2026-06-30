# 07-01 Hermes Handoff — Desktop Chrome 仅有的"线消失" bug 排查

> **新 session 必读** — 这是 07-01 07:00 ~ 10:30 我 (Hermes) 自己盲改 4 个 commit 没修好之后, 决定"挂起 + 转交" 的文档
>
> 任务: desktop Chrome 上拖完一根线会消失, mobile Safari/Chrome Android 不消失. 找根因.

---

## 0. TL;DR (你 30 秒能看完)

- **Mobile (iOS Safari / Chrome Android)**: 拖线工作正常, 线稳定不消失. **已修复**, 部署 07-01 06:00+.
- **Desktop Chrome**: 拖完线后线**消失**. **未修**. **单开 session 排查**, 别在我之前的会话里改.
- **不要盲改**. 我之前 commit `ead8294` + `e71f315` + `8d86e80` 在没 console 数据支持下做的归因, 全是赌博, 全失败.

---

## 1. 已知的好数据 (新 session 可以放心依赖)

**Mobile 已经 OK** 的关键 commit:
- `7f368b0` ImageNode 3 段独立 panel
- `3530c26` ImageNode v2 居中布局
- `2b570e2` ImageNode 拆 2 段 + 上传按钮
- `d9a06cc` 删 image area 的 stopPropagation
- `f49fbb0` 部署适配 896Mi SWAS
- (更早) `0bbac09` Handle 热区 20x20 + ConnectionLine 蓝紫
- (更早) `058ed02` i2i 数据流 (useUpstreamUrls + referenceUrls)

**这些 commit 别动** — 它们对 mobile 是对的.

---

## 2. Desktop bug 已知的事实 (新 session 第一件事收集)

**会做的事**:
- ✅ Mobile (iOS Safari, Android Chrome) 拖完线 → 线保留 OK
- ❌ Desktop Chrome 拖完线 → 线消失

**试过的失败方案** (新 session 别重复掉同一个坑):
- ❌ `handleEdgesChange` filter 'add'/'remove'/'replace' — 没有 console 数据支撑这个归因
- ❌ 把 `edges={edges}` controlled mode 完全 unrolled — 没验证桌面/手机分别的行为
- ❌ 改 ConnectionLine 颜色 / Handle 大小 — 这些是**视觉**, 不是 desktop bug 的根因

**会影响的 js module**:
- `/app/canvas/[id]/CanvasFlowEditor.tsx` (2 个文件: 上面 + `page.tsx`)
- 部署在阿里云轻量 SWAS `47.96.128.172:/opt/damai/`

---

## 3. 用户提供的关键线索 (新 session 别忘)

1. ✅ 用户用 phone 拖完 3 条线都稳定 (07-01 10:05 截图给 Hermes)
2. ✅ 用户用 desktop Chrome 拖完线消失 (07-01 09:50 video)
3. ✅ 用户换浏览器 (`damai.net.cn` 在 Chrome vs Firefox / Edge), **仍然消失** — 不是浏览器特定问题
4. ✅ 用户用 desktop Chrome F12 给过 console log:
   - `[damai] onConnect: ▶ Object` **触发** (但 edge 消失)
   - **没有 `[damai] edge change:`** (说明我 commit `e71f315` 的诊断版**没部署**到 desktop, 或 desktop 上的 onEdgesChange 没被 React Flow 内部触发)
5. ✅ Desktop Chrome body 有 `__CiCi_translate_global_wrapper__` 翻译插件 wrapper (字节豆包翻译), 但**不是**翻译插件问题 (换浏览器后仍消失)

---

## 4. 新 session 第一件事 (不是改代码)

**收集** desktop Chrome 的真实 console log. 不要急于改代码.

### 4.1 让 user 在 desktop Chrome:
1. 强刷 `damai.net.cn/canvas/test` (Ctrl+Shift+R)
2. F12 → Console
3. 拖 1 条线: Image(▣) → Video(▶) 节点的右边端口
4. **等 5 秒不要动, 截图 console 完整面板**
5. 展开 `▶ Object` 截图 (含 source/target/sourceHandle/targetHandle 字段)
6. scroll console 到底看有没有 [damai] 后续 log

**我们** 关心的 log:
```
[damai] onConnect: ...
[damai] edge change: ...     (只有 diagnostic commit e71f315 有这行, 大概率 0 行)
[damai] handleEdgesChange: filter ...
```

### 4.2 同时打开 Elements panel, 搜 `react-flow__edge`:
- 拖完线后, 节点 DOM 里 `edge` 元素是否真的存在
- 找一张截图: `.react-flow__edges` 容器里有多少个 `<g class="react-flow__edge">`

---

## 5. 真正修复的可能路径 (不要先做, 等数据)

### 路径 A: edges state 真没更
- 如果 console 里**根本没 emit onConnect**, 那 `onConnect` callback 没接到
- 修复: ReactFlow `<ReactFlow onConnect={onConnect}>` 检查
- 修法: 用 `onEdgesChange={(eds) => setEdges(eds)}` 完全 skip filter, 改成 `useEdgesState` 行为

### 路径 B: edges state 加了, React Flow 渲染没拿到
- React Flow v12 的 internal store + controlled `edges` prop 时序问题
- **上次 `e71f315` 诊断版**就是为这个写的 — **新 session 可以在它基础上继续**

### 路径 C: onConnect 收到对象不对
- 展开 `[damai] onConnect: ▶ Object` 看 source/target 是否真的不一样
- 如果 source/target 一样, React Flow 把 onConnect 当 cancel 处理

### 路径 D: 渲染层 React Flow 内部 issue
- v12.11.0 issue: https://github.com/xyflow/xyflow/issues
- 升级到 v12.13.0+ 看是否修了

---

## 6. 重要约束 (新 session)

### 6.1 用户偏好
- 不要直接 git push — VM 推不动, user 自己 push
- 改 canvas 代码前**先收集 desktop Chrome console log**, 不要瞎猜
- 每次 commit 之前**等真实数据**, 用户的 F12 截图是金标准

### 6.2 已有测试 + handoff
- ✅ `scripts/test-canvas.sh` (curl only, 5 项)
- ✅ `scripts/test-canvas.ps1` (PowerShell 5.1 兼容, 本机已验 5/5 通过)
- ⏳ `scripts/test-canvas-interactive.sh` (Playwright, 装机后跑得动)

### 6.3 代码状态 (HEAD 当时)
- HEAD: `3530c26` (ImageNode v2 — 3 段布局修正)
- 上次 5 commit 都是**partial**或**reverted**:
  - `8d86e80` fix (撤回 e71f315, 恢复 ead8294 filter) — **filter 跟 mobile OK 没关系**, 但撤了
  - `e71f315` diag (加 console.log) — **撤回, 但诊断版是后续排查的关键基础**
  - `ead8294` fix (handleEdgesChange filter) — **撤销, 我归因错**

如果新 session 想看 e71f315 (诊断版) 的代码: `git show e71f315:app/canvas/[id]/CanvasFlowEditor.tsx`

---

## 7. 文件清单

| 文件 | 内容 |
|---|---|
| `state/HANDOFF-2026-07-01-DESKTOP-BUG.md` | **本文件 (新 session 入口)** |
| `state/HANDOFF-2026-07-01-REGRESSION-TEST.md` | 测试脚本 handoff |
| `state/HANDOFF-2026-07-01-DRAG-FIX.md` | 07-01 早上的修复 handoff |
| `state/HANDOFF-2026-07-01-MOBILE-OK.md` | 不会有这文件, mobile 验证已 commit `8d86e80` |

---

## 8. 自我反思 (Hermes 留给新 agent)

我之前犯的错:
1. ❌ 没看 console 就下结论 "React Flow emit 'add' change" → commit `ead8294` 错
2. ❌ "撤回 + 重新看 console" 的过程**只 console.add 1 行就又 commit**, 太急 → `e71f315` 不全
3. ❌ commit `8d86e80` 撤回 `e71f315` **没在 desktop Chrome 上验证** 就撤回
4. ❌ 给 user 说"已经修复" 但 mobile 验证 ≠ desktop 验证

**教训**:
- mobile OK **不能代表 desktop OK**
- 没 console 数据就别 commit
- 回滚前要**先验证回滚前的版本在 desktop 上还有问题**, 才能说"回滚"

下次 session 别重蹈覆辙.

---

## 9. Next session 第一句话 (你打开这个新会话时的开场白)

> "我读了 state/HANDOFF-2026-07-01-DESKTOP-BUG.md. 现在做 desktop Chrome 排查.
> 第一步: 让 user 在 desktop Chrome F12 console 跑一次拖线, 给我看 [damai] 系列 log.
> 第二步: 根据 log 决定路径 (A/B/C/D).
> 第三步: 改, 不超过 1 个 commit, 部署, user 验证."

这是正确的路径, 不要再重蹈我盲改 4 个 commit 的覆辙.
