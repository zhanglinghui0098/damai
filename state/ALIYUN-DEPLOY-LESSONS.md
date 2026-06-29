# Next.js 部署到阿里云轻量 (Lighthouse/SWAS) — Lessons Learned

**来源**: 2026-06-26 damai 大脉上线全过程
**适用**: 备案过的 `.cn` 域名 + 阿里云轻量服务器 + Next.js 项目

## 完整流水线

```
本地源码 (NAS) 
  → tar 打包 (排除 node_modules/.next/videos/backups)
  → scp 到服务器
  → 服务器解压 + chmod 修权限
  → npm install --include=dev --legacy-peer-deps
  → npm run build (NODE_OPTIONS cap)
  → PM2 守护
  → nginx 反向代理
  → certbot 申请 Let's Encrypt SSL
  → DNS A 记录解析
  → 安全 headers (CSP/X-Frame-Options/nosniff/Referrer/Permissions)
```

## 关键 gotcha（坑过才学到的）

### 1. 轻量 ≠ ECS — 不同控制台
- ECS 控制台: `ecs.console.aliyun.com`
- 轻量 (SWAS) 控制台: `swas.console.aliyun.com` ← 用户买的通常是轻量

### 2. 实际 RAM ~896Mi 不是 2Gi
- 阿里云轻量 "2GB" 实际只有 ~896Mi（OS/cgroup 预留 ~1.1G）
- 不能跑 Docker（Docker daemon 自身 200MB+）
- 必须用 Node + PM2 + nginx 直接跑
- 加 2GB swap 防 build OOM

### 3. 文件权限 = 000（来自 git/NAS SMB 挂载）
- tar+extract 后所有文件 mode 000
- 每次解压后必须跑:
  ```bash
  chown -R root:root /opt/<name>
  find /opt/<name> -type d -exec chmod 755 {} +
  find /opt/<name> -type f -exec chmod 644 {} +
  find /opt/<name>/node_modules/.bin -type l -exec chmod +x {} +
  chmod 600 /opt/<name>/.env.local
  ```
- 第 4 行容易漏 — `chmod 644` 把 `.bin/` 可执行文件也改了

### 4. `--omit=dev` 让 build 崩
- 跳过 devDeps 包含 typescript
- webpack/SWC 找不到 ts 编译器 → "Cannot resolve '@/lib/foo'" 即使文件存在
- 必须用 `--include=dev`
- 加 `--legacy-peer-deps` 处理 Next 14 + opennext 冲突

### 5. nginx certbot SSL block 不能直接覆盖
- `certbot --nginx` 写两个 server block (HTTP + HTTPS)
- 用 sed/cat 覆盖只留 HTTP block → 443 端口静默停止响应
- **修法**: 自己写完整配置（包括 certbot 的 4 行 SSL 配置）

### 6. Alibaba Cloud Linux 3 = RHEL 系，用 yum 不用 apt

### 7. SSH 密码在 轻量控制台 → 实例 → 密钥/密码 → 重置实例密码
- 不是阿里云账号密码
- 用户常给错大小写，第一次 SSH 失败正常

### 8. Map destructuring 需 ES2015+ target
- `for (const [k, v] of map)` 在 Next 14 默认 target 下报错
- 改用 `map.forEach((v, k) => {...})`

## 安全 headers 配置（nginx）

```nginx
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

CSP 的 `script-src 'unsafe-inline' 'unsafe-eval'` 是 Next.js SSR 必需（hydration 用 inline script）。

## API 安全加固模式（每个贵的 endpoint 都要）

1. **IP 限流**: `Map<ip, timestamps[]>` + 内存清理
2. **类型保护**: `typeof body.prompt === "string"`
3. **长度上限**: `prompt.slice(0, 2000)`
4. **数值 clamp**: `Math.min(Math.max(Number(quantity), 1), 4)`
5. **URL 白名单**: `/^https?:\/\//i.test(url)` (防 SSRF file:// / javascript:)

## PM2 永久化

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
# 不跑 startup, 重启就死
```

## 验证清单

部署后跑一遍:
```bash
# 1. PM2 在线
ssh root@<IP> 'pm2 list'

# 2. Next.js :3000 内网通
ssh root@<IP> 'curl -sI http://127.0.0.1:3000/ | head -3'

# 3. nginx :80/:443 通
curl -sI http://<IP>/ | head -3
curl -sI https://<domain>/ | head -10  # 应有 5 个安全 headers

# 4. SSL cert 有效
echo | openssl s_client -servername <domain> -connect <domain>:443 2>/dev/null | openssl x509 -noout -dates

# 5. 限流工作
for i in {1..35}; do curl -s -o /dev/null -w "%{http_code} " -X POST https://<domain>/api/expensive -d '{}'; done
# 期望: 30 次 400, 第 31 次起 429
```

## 已验证

2026-06-26 damai 大脉上线:
- 服务器: 阿里云轻量 47.96.128.172 (2C/2G, Aliyun Linux 3)
- 域名: damai.net.cn (备案通过, Let's Encrypt SSL 到 2026-09-24)
- 23 路由全部 200/307
- 0 TS 错误
- 限流: 第 31 次 429
- 5 个安全 headers 全部生效

## 后续改进方向

- [ ] Redis 替代内存限流（多实例/持久化）
- [ ] CSP 改 nonce-based（去掉 unsafe-inline）
- [ ] 加 Sentry/日志聚合
- [ ] 备案后申请 ICP 备案号加到页脚
- [ ] 真实 VOLC_API_KEY 接入 Ark 测 i2i 端到端