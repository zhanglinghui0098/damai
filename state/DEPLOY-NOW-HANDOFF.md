# ⚠️ 部署 Handoff — 现在就执行

> **给部署 agent** — 06-30 08:45 CST 由 Hermes 写
>
> ⚠️ **master 还在 599e6ae**, 我已经改完 4 个文件但没 commit
> ⚠️ **2 个风险**:
>   1. ECS 端 git HEAD = 006f92e (06-26 旧版), 工作树领先 13+ commit
>      → 部署脚本会 tar 源码覆盖, deploy 前要确保 ECS 工作树不丢东西
>   2. /canvas-v2/abc 仍 404 (目录已删), git 会自动 skip
>      → 不用管, 这是预期的

---

## 0. 立即动手 (按这个顺序, 5min)

### Step 1: commit (本地 + push)

```bash
cd Z:\damai\hermes-project

# 0a. 看现状
git status --short
git log --oneline -3

# 0b. 应该有这 4 个文件 modified
#   app/canvas/[id]/CanvasFlowEditor.tsx  (节点功能按键: prompt/ModelChip/ChipRow/RunButton)
#   state/HANDOFF-LATEST.md
#   state/PHASE4-DEPLOY-HANDOFF.md
#   state/STATUS.md

# 1. 不要 git add canvas-v2/ (目录已删, git 会自动 skip)
git add app/canvas/[id]/CanvasFlowEditor.tsx \
        state/HANDOFF-LATEST.md \
        state/PHASE4-DEPLOY-HANDOFF.md \
        state/STATUS.md

# 2. 看 staged 是不是只有这 4 个
git status --short

# 3. commit + push
git commit -m "feat(canvas): 节点功能按键 (prompt/ModelChip/ChipRow/RunButton + NodeShell + Context)"
git push origin master
```

### Step 2: 部署

```bash
cd Z:\damai\hermes-project
bash scripts/deploy-to-ecs.sh
```

**部署脚本会自动:**
- tar 本地源码 (排除 node_modules / .env.local / public/case)
- scp 到 ECS /opt/damai
- 备份 /opt/damai → /opt/damai.bak-YYYYMMDD-HHMMSS
- 解压 + chown + chmod
- npm install --legacy-peer-deps
- next build (低内存优化)
- pm2 delete + start (env 强制 refresh)

---

## 1. 已知风险 + 缓解

### Risk 1: ECS 端 git HEAD = 006f92e (06-26 旧版) 工作树领先 13+ commit

**意味着:** ECS 上有些未 commit 的本地改动 (历史踩坑: 06-29 Codex 同步覆盖 working tree, 曾 `git checkout HEAD --` 恢复)

**自动处理:**
- deploy 脚本会备份 ECS 工作树到 `/opt/damai.bak-YYYYMMDD-HHMMSS`
- 然后解压新代码覆盖

**建议手动处理 (前置, 避免丢 13+ commit 改动):**

```bash
# 在 ECS 上执行 (通过 SSH)
ssh -i /opt/data/home/.ssh/damai-ecs admin@47.96.128.172 'cd /opt/damai && git status --short | head -50'
```

如果有重要改动 → **先 commit 上去** → 再 deploy。否则会被 tar 覆盖（备份在 .bak 里可以找回）。

**如果没有重要改动** → 直接 deploy，备份留 .bak 里就够了。

### Risk 2: canvas-v2/abc 仍 404

**正常。** Phase 4 已经把 `app/canvas-v2/` 目录删了，但 README 没说删除 `/canvas-v2/abc` URL。
- 老 URL `/canvas-v2/abc` → 404（正常，目录没了）
- 新 URL `/canvas/abc` → React Flow 完整版 ✅
- git add 列表里有 `app/canvas-v2/` 目录会被 git 跳过（已经不存在），不用管

---

## 2. 部署后验证

```bash
# 公网
curl -I https://damai.net.cn/canvas/test-3-5
# 应该返回 200, 文件大小跟这次改的 59.3 kB 接近

# 不应该 404
curl -I https://damai.net.cn/canvas-v2/abc
# 预期 404 (Phase 4 故意删了)

# pm2 状态
ssh -i /opt/data/home/.ssh/damai-ecs admin@47.96.128.172 'pm2 list | grep damai'
```

**visual 验证清单:**
1. 打开 `/canvas/test` → 看到 React Flow 完整版画布
2. 节点卡有:
   - Header (图标 + 类型名)
   - Prompt textarea (点就能编辑)
   - 模型 chip (点击下拉显示模型列表)
   - 参数 chip row (比例/画质/数量)
   - 底部运行按钮 + 积分徽章
3. FloatingTools 加节点 → 出现新节点，**位置准确**（不跑画外）
4. 拖线连接 → bezier 自动连
5. 刷新页面 → 节点状态保留 (localStorage 持久化)

---

## 3. 紧急回滚 (出问题用)

```bash
# 在 ECS
ssh -i /opt/data/home/.ssh/damai-ecs admin@47.96.128.172 'sudo bash -s' <<'EOF'
  pm2 delete damai
  ls -dt /opt/damai.bak-* | head -1 | xargs -I {} sudo mv {} /opt/damai
  cd /opt/damai && pm2 start npm --name damai -- run start
EOF
```

---

## 4. 完了之后

让 Hermes 更新：
- `state/STATUS.md` 写 "✅ 06-30 节点功能按键已 deploy, commit xxx, 部署完成"
- `state/HANDOFF-LATEST.md` 写新 commit
- 推送新 commit 到 master
