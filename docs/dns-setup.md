# damai.net.cn 域名解析 → Cloudflare Pages 操作指南

> 最后更新：2026-06-16
> 目标：让 `www.damai.net.cn`（或 `damai.net.cn`）打开 Cloudflare Pages 上的 `damai.pages.dev`
> 网站现状：`https://damai.pages.dev` 已经 200 OK 跑着（已验证）

---

## 你必须自己做的（我没有你的阿里云/Cloudflare 账号）

下面所有点击都得你登录控制台做。我没有你的账号密码、API Token，**没法替你操作控制台**。

但路径我都查官方文档验证过了（阿里云 2025-12-10 更新，Cloudflare 2026-04-21 更新），照着点就行。

---

## 方案 A（推荐，10 分钟）：只配 `www.damai.net.cn`

最省事，国内访问也够用（业内 99% 的网站都是 www 入口）。

### 步骤 1：阿里云 DNS 加 CNAME（5 分钟）

打开 → https://dnsnext.console.aliyun.com/authoritative

找到 `damai.net.cn` → 点 **解析设置** → **添加记录**：

| 主机记录 | 记录类型 | 记录值 | TTL |
|---|---|---|---|
| `www` | CNAME | `damai.pages.dev` | 10 分钟 |

点确认。等 1-5 分钟 DNS 全球生效。

### 步骤 2：Cloudflare Pages 绑子域名（3 分钟）

打开 → https://dash.cloudflare.com/

路径：**Workers & Pages** → 选 `damai` 项目 → **Custom domains** → **Set up a domain**

输入 `www.damai.net.cn` → Continue

Cloudflare 会自动验证 CNAME 是否配对，验证通过就 OK。

### 步骤 3：验证

浏览器打开 `https://www.damai.net.cn`，看到大脉首页 = 成功。

---

## 方案 B（20 分钟）：让 `damai.net.cn`（裸域/主域）也能直接打开

浏览器输入不带 www 的 `damai.net.cn` 也能用，要多做几步。

### 为什么方案 A 不够

apex 域名（`damai.net.cn` 这种主域）按 RFC 协议**不能用 CNAME**（会和 MX/NS 记录冲突）。Cloudflare 的做法是：

1. 把整个 `damai.net.cn` 的 nameserver 切到 Cloudflare
2. Cloudflare 自动用 "CNAME flattening"（伪装成 A 记录）实现

### 步骤 1：Cloudflare 添加 zone（5 分钟）

打开 → https://dash.cloudflare.com/

右侧 **Add a site** → 输入 `damai.net.cn` → 选 Free plan → Continue

Cloudflare 会扫一遍现有 DNS 记录，**确认**继续。

Cloudflare 会给你 2 个 nameserver，类似：
```
anna.ns.cloudflare.com
sid.ns.cloudflare.com
```

**记下这两个**（每个人的不一样）。

### 步骤 2：阿里云改 nameserver（5 分钟）

打开 → https://dnsnext.console.aliyun.com/authoritative

找到 `damai.net.cn` → 右侧 **DNS 服务器** / **修改 DNS 服务器**

把阿里云默认的（`dns*.hichina.com`）改成 Cloudflare 给你的那 2 个：
```
anna.ns.cloudflare.com
sid.ns.cloudflare.com
```

点确认。

**DNS 切换要 24-48 小时全球生效**（这个比 CNAME 慢得多，没法加速）。

### 步骤 3：Cloudflare Pages 绑主域（3 分钟）

DNS 切完后，回到 Cloudflare → **Workers & Pages** → `damai` 项目 → **Custom domains** → **Set up a domain**

输入 `damai.net.cn` → Continue

Cloudflare 会自动加 CNAME flattening + 自动签 SSL 证书。

### 步骤 4：验证

浏览器开 `https://damai.net.cn` 看到大脉首页 = 成功。

---

## 备案的事

- `.cn` 域名 → 解析到 Cloudflare Pages（境外节点）**现在不用备案**，国内访问慢一点但能用
- 想搬到阿里云国内服务器才需要备案（20-30 天），先不做

---

## 常见坑

| 现象 | 原因 | 解决 |
|---|---|---|
| Cloudflare 报 "CNAME not found" | 阿里云 DNS 没生效 | 等 5-30 分钟，或 `nslookup www.damai.net.cn` 看是否解析到 `damai.pages.dev` |
| 浏览器开域名 522 错误 | 只手动改了 CNAME 没在 Cloudflare Pages 加 custom domain | 去 Cloudflare Pages 后台把域名加进 custom domains |
| SSL 证书一直 pending | 切 nameserver 没完成 | 等 24-48 小时 |

---

## 验证命令（你做完操作后告诉我，我帮你跑）

```bash
nslookup www.damai.net.cn 8.8.8.8
nslookup damai.net.cn 8.8.8.8
curl -sI https://www.damai.net.cn
curl -sI https://damai.net.cn
```
