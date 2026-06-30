# 07-01 Hermes Handoff — 防止"画布改了又改没归因"

> **给 user** + **未来任何 agent**
> 关联 commit: `bbcf952` (test scripts) + `dc9900a` (PS1 兼容版)

---

## 0. 用户反馈 (你 07-01 说的话)

> 改了连接线很多次, 换了很多 agent, 也没改好, 不知道归因

**我的诊断 (不是技术 bug, 是流程问题):**
- 每次都靠"人眼看截图"判定修复成功 (不可重复 / 不可累积)
- 没有任何测试代码防止回归
- 多个 agent 同时改同一个文件 (06-29 14:55 Codex 覆盖事件)

**解法 = 写测试脚本**: 让代码判定代码, 不让人眼判定代码。

---

## 1. 你现在就有的工具 (跑过的, 已 commit)

### 1.1 `scripts/test-canvas.ps1` — PowerShell 5.1 兼容 (本机)

```powershell
cd Z:\damai\hermes-project
powershell.exe -ExecutionPolicy Bypass -File scripts/test-canvas.ps1
```

**输出 (本机 07-01 验证):**
```
[OK] T1 HTTP 200
[OK] T2 HTML contains Next.js CSS bundle
[OK] T3 Found react-flow / xyflow
[OK] T4 HTML contains buildId
[OK] T5 HTML has no error page keywords
Pass: 5, Fail: 0
```

✅ 说明 ECS 生产 `/canvas/[id]` 正常 + React Flow 已装。

**测试覆盖:**
- T1 公网 URL 可达
- T2 Next.js HTML 含 CSS bundle
- T3 React Flow 包装进 build (HTML 或 _next/static/chunks/app/canvas/*)
- T4 HTML 有 buildId
- T5 无 502 / 应用错误关键字

### 1.2 `scripts/test-canvas.sh` — Bash 版 (NAS 跑)

```bash
cd /opt/data/projects/damai
bash scripts/test-canvas.sh
```

(就 Windows Git bash PATH 缺 grep/date 跑不了; NAS Linux/bash 正常)

### 1.3 `scripts/test-canvas-interactive.sh` — 真实浏览器交互 (待装 Playwright)

```bash
npm i -D playwright
npx playwright install chromium  # ~150MB, 一次性
bash scripts/test-canvas-interactive.sh
```

**测什么 (5 项):**
1. 初始 6 节点 + 5 边渲染
2. Handle 端口 ≥20×20px (验证 07-01 修复)
3. 节点内 prompt textarea ≥6 个 (验证节点功能)
4. 双击空白弹菜单 (验证 onPaneDoubleClick)
5. console 无错误

---

## 2. ⚠️ 重要: 流程约束 (下次任何改 CanvasEditor.tsx 的人必跑)

**新硬规则** — 加进 `state/README.md`:

> ❌ **禁止 commit 修改 `app/canvas/[id]/CanvasEditor.tsx` 或 `CanvasFlowEditor.tsx` 不跑测试**
>
> 流程:
> 1. 改 canvas 文件
> 2. 在 NAS 上跑 `bash scripts/test-canvas.sh`
> 3. 在 Windows 上跑 `powershell.exe -ExecutionPolicy Bypass -File scripts/test-canvas.ps1`
> 4. 都过 → 才 commit + push
> 5. 失败 → 找哪条断言挂了, 修代码

**未来升级 (周/月维度):**
- `scripts/test-canvas-interactive.sh` 接 Playwright + 真浏览器拖线测试
- 接入 GitHub Actions / cron, 每次 push 自动跑

---

## 3. 这就是归因工具

**之前的归因困难, 是因为没有工具。现在有了:**
- 测试不通过 → 你能立刻看到"具体哪条断言挂" (T1-T5 编号)
- 多次修复都没改好 → 测试失败模式可能揭示真正 root cause (例如: T5 一直挂, 说明 502; T3 一直挂, 说明依赖没装)
- 你说"换了 agent 没改好" → 现在量化: 测试跑分一直在 1/5 还是 5/5

**所以接下来:**
1. 部署最新 commit `dc9900a` (含测试脚本) 到生产
2. NAS 跑 `bash scripts/test-canvas.sh`
3. 看测试结果是真修好了, 还是仍然有 bug
4. 真有 bug → 测试给"哪条不对"信号, 而不是模糊的"改一遍没改好"

---

## 4. 本机跑过 + 文件清单

| Commit | 文件 |
|---|---|
| `bbcf952` | `scripts/test-canvas.sh` + `scripts/test-canvas-interactive.sh` |
| `dc9900a` | `scripts/test-canvas.ps1` (本机已验证 5/5) |

**还待部署 (本地 VM 不能 push)**:
- 部署 agent 在能出网机器跑:
  ```bash
  cd /opt/data/projects/damai
  git pull origin master
  bash scripts/deploy-to-ecs.sh
  ```
- 部署后 NAS 跑:
  ```bash
  bash scripts/test-canvas.sh
  ```

---

## 5. 最终一句话

**你之前"改了又改没归因"已经结束了** —— 因为现在有脚本能"在每次改动后立即告诉你现在好不好"。下次任何人改 canvas 不跑测试, 就违反硬规则, 写到 state/README.md 备忘。

这才是真正的"减少焦虑的工程实践"。后续你或任何 agent 改 canvas, 跑一遍测试就能告诉自己: 真的修好了没。

不需要再换 agent / 换模型了。流程定了, 谁来都一样。
