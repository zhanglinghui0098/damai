# 07-01 Hermes Handoff — 拖线看不到/难命中 修复

> **给部署 agent** — 07-01 改完了, 但本地 VM 推不动 (GFW)
> 关联 commit `3fcefd6` 已部署但还有 bug, 这次是 fix

---

## 0. 这次改了什么 (commit 待提交)

### Bug: 拖线时看不到引导线 + 端口热区太小

**视频现象 (user 拍):**
- 节点变大 (因 prompt/chip 多了) → 端口被推离中心
- 拖线过程看不到 ConnectionLine, 用户以为"拖失败"
- 左/右端口 `width:16` 远端鼠标, 容易没击中 Handle

### Fix 2 处 (app/canvas/[id]/CanvasFlowEditor.tsx)

**1. LeftHandle / RightHandle (Handle 热区扩大)**
```diff
- width: 16, height: 16
- left: -8 / right: -8
- top: '50%'  (✗ 节点大时飘远)
+ width: 20, height: 20
+ left: -10 / right: -10
+ top: '50%'
+ transform: 'translateY(-50%)'  // 节点垂直居中
+ boxShadow: '0 0 0 3px rgba(110,140,214,0.25)'  // 蓝紫光晕, 视觉+命中都更明显
```

**2. ConnectionLine (拖线过程可见)**
```diff
- stroke: 'rgba(255,255,255,0.35)' (灰白, 黑底看不见)
+ stroke: 'rgba(110,140,214,0.55)' (蓝紫半透明, TapNow 风格)
+ strokeWidth: 3 (was 2)
- 终点圆点 r:4
+ 起点圈 + 终点圆点 (双圆点更醒目)
+ 终点圆点 r:6 (was 4)
+ 终点 valid 时 r:7 + fill '#6e8cd6' 蓝紫实心
```

---

## 1. ⚠️ 本地 commit 已就绪, 但 PUSH / DEPLOY 这台 VM 推不动

**原因:**
- Windows VM 在国内, 无代理
- `git push origin master` 超时 (GFW 墙 github.com)
- `ssh admin@47.96.128.172` 超时 (防火墙挡 ECS 公网 IP)
- `bash scripts/deploy-to-ecs.sh` 也走上面两条 → 同样不通

**必须由 user 在能出网的机器上跑:**

```bash
cd /opt/data/projects/damai    # NAS 容器或代理机器

# Step 1: 拉 Hermes commit (前提: 1ec14f1 已经在远端 master 了)
git pull origin master

# 验证本地 commit hash (应该 1ec14f1 + Hermes 的 2 处新改动)
git diff HEAD --stat

# Step 2: commit + push
git add app/canvas/[id]/CanvasFlowEditor.tsx
git commit -m "fix(canvas): Handle 热区扩大 (20x20) + ConnectionLine 蓝紫可见 (TapNow 风格)"
git push origin master

# Step 3: deploy
bash scripts/deploy-to-ecs.sh
```

### 部署事故警告 (从 STATUS 06-30 13:21)

> ⚠️ 之前 `npm install --include=dev` 在 ECS OOM 静默失败 → `next symlink` 没建 → build 失败 → **502**

**deploy-to-ecs.sh 已加 fix:** exclude `.open-next / .wrangler / .bak-v1 / state/案例 / state/案例库 / hermes-reports / .env.local.bak* / test*.txt / codex-cli`

**如果 deploy 又 OOM:**
```bash
ssh -i <key> admin@47.96.128.172
sudo -i
cp -a /opt/damai.bak-<最新一份>/node_modules /opt/damai/
cd /opt/damai && npm run build
pm2 delete && pm2 start npm --name damai -- run start
```

---

## 2. Deploy 后验证清单

| 测试 | 预期 |
|---|---|
| 打开 `/canvas/test` | HTTP 200, 6 节点照常显示 |
| 鼠标 hover 节点端口 | 蓝紫光晕 (`boxShadow`), 更好命中 |
| 从端口拖线 | 蓝紫色 + 终点圆点立刻跟手 |
| 拖到目标端口 | 线变蓝色高亮 + 终点圆点放大 |
| 松手落到有效端口 | 自动连成边, 永久保留 |
| 松手落到空白 | 弹节点菜单 (06-30 onConnectEnd 实现) |

---

## 3. 阻塞 ask user

跟之前一样 — 这台 VM 出不去, **只能等你在能出网的机器上跑 push + deploy**

---

## 4. 文件

| 路径 | 行数 | 状态 |
|---|---|---|
| `app/canvas/[id]/CanvasFlowEditor.tsx` | +28/-12 | 已改, 等 commit |
| `state/HANDOFF-2026-07-01-DRAG-FIX.md` | (本文件) | 新建 |
| `state/HANDOFF-LATEST.md` | (待更新) | 别忘记更新 |
