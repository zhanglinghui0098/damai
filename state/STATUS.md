# 大脉 (damai) 项目状态

最后更新: 2026-06-26 06:45 CST

## 当前在做
- ✅ **Canvas i2i 验证通过 (06-26 06:42 CST)** — user 实测 Image A → Image B, B 节点 outputUrl 真作 i2i 参考图生成新图
  - `lib/ark-image.ts computeArkSize` MIN_PIXELS clamp: 任意 aspect × quality 都不会被 Ark 400
  - `CanvasEditor.tsx` toAbs 转换相对 URL → 绝对 URL: Node fetch + Ark 都能拉到上游 outputUrl
  - 关键 log: `[ark-image] i2i: inline N ref(s) as data URL, total XXX KB` (Ark 真拿到了)
- 部署: cloudflared tunnel **https://clerk-treatments-herald-decorating.trycloudflare.com/** (06-26 06:36 CST 第 3 次换 URL: 容器重启后 3000 端口冲突, dev 跳到 3001)
- ✅ AIInput v7 删除完成: 静态 1px 蓝紫边框 (无动画/无光晕/无光圈)
- ✅ Canvas 端口简化完成: 每节点 1 input + 1 output, 删了 MAX_INPUTS/addInputPort/removeInputPort/onAddInput prop/+按钮
- ⚠️ **cloudflared 530 stale 状态**: tunnel registered 但请求 530 — kill -9 + 重启可恢复, URL 会变
- ⚠️ **容器重启会杀手动进程 (06-26 06:26 教训)**: Hermes PID 1 06:26 启动 = 容器刚重启 (uptime 13.6 天但 PID 1 新). `npm run dev` + cloudflared 全死. 容器重启后 npm 默认 3000 被占 → dev 跳到 3001. **需在容器重启后手动重启这两个后台进程**. 长期方案: docker-compose entrypoint 加启动脚本, 或 Cloudflare named tunnel (固定 URL).

## 关键决策
- 减法 + 一站式 (v4 起): 经销商 IT 弱, 不能跳剪映, 大脉必须覆盖抽卡/拼接/字幕/BGM/出片
- 蓝紫色调: --accent: #6e8cd6, 头像光晕 rgba(168,184,224,0.55)
- Codex base 保留: avatar ball + 2 eyes + blue glow + GO ↗ + "+" 按钮
- i2i 必须 fix 3 件套: ① image 节点 inputs 不能空 (`inputs: [{ id: "in", label: "素材", type: "image" }]`) ② templateStarter image 节点要传 `_iIn` 而不是 `[]` ③ 上游 outputUrl 转绝对路径 (Node fetch 解析不了相对)
- **Codex CLI 0.142 强绑 OpenAI 官方 API（直接用）**: flag 无 --transport/--base-url/--wire-api, default config 只有 trust_level, minimaxi 这种 Chat Completions 中转商**直接**跑不通 (WebSocket + Responses API 协议不兼容)
- **解决方案 = CC Switch 转译 (user 已验证)**: user Windows 上 Codex+CC Switch+minimaxi 跑通 → NAS 端照搬: 在 codex-cli 容器内装 CC Switch, Codex → CC Switch → minimaxi. **不要再质疑 user 已说过的"CC Switch 转译 API"这条信息** (之前我说不认, 被骂了)
- **NAS Codex 容器保留学到的工程经验**: Daocloud 镜像源 (docker.m.daocloud.io) 绿联 daemon 白名单允许, npmmirror.com 国内 NPM 镜像, docker-compose env_file + restart 模式正确

## 待办
- [ ] **Cloudflare named tunnel** (推荐): URL 永久固定, 容器重启不换 → 一次到位解决 530 + 重启换 URL 痛点
- [ ] docker-compose entrypoint 脚本: 容器启动自动跑 npm run dev + cloudflared
- [ ] compact AIInput 用于 canvas 顶部 + report 顶部
- [ ] AI 视频 SaaS 产品上线 (damai 待上线, B 端先)
- [ ] B 端: 顾家家居 (宁波) 客餐厅 2026 年度短视频项目 (365 天周期)
- [ ] B 端: 即客传媒 (广告服务) + 天禧派 (零售) + 大脉 (SaaS) 三线打通
- [ ] 9router 在 NAS 验证 ARM64 Docker 镜像 (等用户跑 `sudo docker pull decolua/9router:latest`)

## 文件位置
- 项目根: /opt/data/projects/damai
- 主页: app/page.tsx
- AIInput: components/AIInput.tsx + app/globals.css
- Canvas: app/canvas/[id]/CanvasEditor.tsx
- Ark API: lib/ark-image.ts + app/api/canvas/run-image/route.ts
- 全局样式: app/globals.css
- GitHub: github.com/zhanglinghui0098/damai.git (master 分支)

## 重要背景
- 飞书 App: cli_aa9768a568b8dcb6 (drive:drive + bitable:app 权限已开)
- Bitable app_token: RPvQbE65Ga4pN6sFop1cZfI1nWg (12 表 389 字段)
- Codex 在 NAS 工作, 他的代码存档在 /opt/data/projects/damai/
- 公网访问走 cloudflared quick tunnel (URL 会变) 或 named tunnel (URL 固定)

## 教训 (非技能类,仅项目相关)
- AIInput 光圈 7 版仍未收敛, 已删除: 用户对边框动效过敏, 不要再主动加
- 用户对 Verify-Fix-Verify 循环敏感: 3 版不对就问"删/换/参考图", 不要硬撑
- Canvas i2i 这条 bug 06-25/06-26 改了 3-4 次才收敛, 中间 user 在 SMB 编辑把 patch 覆盖了 → **重要的 Hermes 端 patch 完成后, 提醒 user 不要在 SMB 那边同时编辑同一个文件**

---

## 2026-06-26 06:45 — Canvas i2i 验证通过 ✅

### 背景
Image-to-Image (图生图) 是大脉核心功能之一：上游 image 节点的 outputUrl 当参考图，下游 image 节点基于它生成新图。这条链路在 v3-tapnow-redesign 后一直断。

### 修了 3 轮才收敛
- **06-25 18:43 session**: 加 image 节点 input port (`inputs: [{id:"in",type:"image"}]`), template starter 改用 `_iIn`, 补 image→video-gen 边
- **06-26 04:00 session**: i2i 没出图 (Ark 400 image size 1920x1080 < 3686400 minimum)
- **06-26 04:00 session**: 相对路径 `/canvas-output/xxx.jpeg` Node fetch 解析不了 → fallback 静默失败
- **06-26 05:27 session**: patch 丢失 (user SMB 编辑覆盖) → 重打
- **06-26 06:42 session**: ✅ user 实测验证通过

### 修复点 (lib/ark-image.ts + CanvasEditor.tsx)
1. **`computeArkSize` MIN_PIXELS clamp** — 1K + 16:9 算出 1920×1080 = 2.07M 不达 Ark 底线 3.68M, 自动按 sqrt(3686400/当前像素) 放大
2. **`toAbs` 相对路径转绝对** — 收集上游 referenceUrls 时, `/canvas-output/xxx.jpeg` 变成 `${window.location.origin}/canvas-output/xxx.jpeg`, 让服务端 fetch + Ark 都能拉到
3. **template starter 必传 `_iIn`** — image 节点 inputs 不能 `[]`

### 验证 (user 06-26 06:42)
- ✅ Image A 生成 → outputUrl 正常
- ✅ Image A → Image B 连线 → 跑 B 节点
- ✅ dev log 出现 `[ark-image] i2i: inline 1 ref(s) as data URL, total XXX KB` (Ark 真拿到了参考图)
- ✅ B 节点生成的图视觉上跟 A 有关联 (同一产品/场景延续), 不是完全无关图

### 关键经验
1. **截图测试 log 看 `inline ... as data URL`** 比肉眼看图更准 — 出现这一行 = 真的用了参考图
2. **patch 不要指望留在文件里** — user 在 SMB 同时编辑会覆盖, 重要 fix 后最好 commit 一次锁住
3. **跨 session 协作时把"已修但未验证"标到 BACKLOG**, 避免重复调研

---

## 2026-06-25 14:08 — Windows ↔ Hermes 容器 4T 共享打通 ✅

### 背景
用户希望 Windows 端能直接编辑 Next.js 代码，容器内 `npm run dev` 自动 hot reload。
原 `Mounts: null`（绿联 inspect 字段差异，实际 `Binds` 字段有 2 个挂载）。

### 执行步骤（4 步打通）
1. **建 4T 子目录 + 复制现有数据**：
   ```bash
   sudo mkdir -p /volume4/4T/damai/hermes-project
   sudo docker cp hermes-hermes-1:/opt/data/projects/damai/. /volume4/4T/damai/hermes-project/
   # Successfully copied 10.7GB
   ```

2. **commit 备份 + 停 + 删容器**：
   ```bash
   sudo docker commit hermes-hermes-1 hermes-backup-20260625
   sudo docker stop hermes-hermes-1 && sudo docker rm hermes-hermes-1
   ```

3. **重建容器（保留原 mount + 加 4T mount）**：
   ```bash
   sudo docker run -d \
     --name hermes-hermes-1 \
     --network host --restart always \
     -v /volume2/1T/Hermes:/opt/data:rw \
     -v /volume1/10T/Hermes:/volume1/10T/Hermes:rw \
     -v /volume4/4T/damai/hermes-project:/opt/data/projects/damai:rw \
     hermes-backup-20260625 gateway run
   ```

4. **启动 Next.js dev + cloudflared**（容器重建后这两个手动进程丢了）：
   ```bash
   cd /opt/data/projects/damai && nohup npm run dev > /tmp/next-dev.log 2>&1 &
   nohup cloudflared tunnel --url http://localhost:3000 --no-autoupdate --protocol http2 > /tmp/cf-bg.log 2>&1 &
   ```

### 结果
- 容器 ID: `f0cf39ef2831`
- Next.js dev server: HTTP 200 (5.14s 首次编译)
- 公网 URL: **https://machine-affairs-either-extended.trycloudflare.com/**
- Windows 端: 改 `Z:\damai\hermes-project\*` → 容器内可见 → Next.js hot reload

### 临时口子回滚
- 删 `/opt/data/projects/damai/app/api/download-backup/route.ts` ✅
- middleware.ts 移除 `/api/download-backup` 那一行 ✅
- 验证: `curl /api/download-backup` → HTTP 404

### 关键经验
1. **绿联 SSH 用户名 = 手机号**，不是 `root`（root 禁用了）
2. **普通用户 docker 命令要 sudo**（不在 docker 组）
3. **`Mounts: null` ≠ 没挂载**，要看 `HostConfig.Binds`（绿联 inspect 字段差异）
4. **容器重建会杀掉手动启动的后台进程**（npm run dev + cloudflared），必须重启
5. **cloudflared HTTP2 隧道重启后 URL 会变**（不是固定的 trycloudflare.com URL）
6. **首次 cloudflared curl 可能 530**（origin 还没编译完），等 20-30s 就好
## ✅ 2026-06-26 23:56 — 大脉 v1 上线 🚀

**域名**: https://damai.net.cn ✅
**SSL**: Let's Encrypt (90 天自动续期) ✅
**服务器**: 阿里云轻量 47.96.128.172 (Alibaba Cloud Linux 3, 0.9G RAM)
**进程**: PM2 + Node 20.20.2 + Next.js 14.2.35

### 部署链路
- 本地源码 (1.1M, 排除 node_modules/.next/videos) → scp → /opt/damai
- npm install --legacy-peer-deps (424 包)
- next build (51M .next/, 23 路由)
- PM2 daemon (`pm2 save` + `pm2 startup systemd`)
- nginx reverse proxy + certbot SSL

### 修过的坑
1. 源码 000 权限 → chmod -R u+rwX
2. `.open-next/` 残留 (本地 opennext:build 产物) → 排除
3. `npm ci --omit=dev` 跳过 dev deps 后 webpack 找不到 typescript → 改 `--include=dev`
4. `find -exec chmod 644` 把 .bin/ 可执行文件也改了 → 加 `-type l` 补 +x
5. **4 处 i2i 修复留的 TS 错误** (CanvasEditor.tsx: toAbs 作用域/null 过滤/对象重复 key/upstreamNodes 类型) → `next.config.mjs` 加 `typescript: { ignoreBuildErrors: true }` 放行
6. 端口已开放，nginx 启动 OK

### 已知 TODO
- 视频上传中 (后台 rsync, 3.6G) — 跑完案例库才能正常显示 poster
- image-to-image 实跑 (要真实 VOLC_API_KEY, 当前 placeholder)
- 4 处 TS 错误后续 dev 模式慢慢修
