# Workflow 集成使用说明

## 一次性配置 (5 分钟)

### 1. NAS 控制台配 SMB (3 分钟)

按 `nas-smb-config.md` 走完 Step 1-3, 关键点:
- 共享名 `projects`
- 共享路径 `/opt/data/projects`
- **强制勾选 `force user = root`** (关键!)

### 2. Windows 跑 setup-workflow.ps1 (2 分钟)

以管理员身份打开 PowerShell:

```powershell
cd <path>\workflow-setup
notepad setup-workflow.ps1   # 改最上面 4 个常量: NAS_IP / NAS_USER / NAS_PASS / NAS_SHARE
.\setup-workflow.ps1
```

脚本会自动:
1. 映射网络驱动器 `Z:` -> `\\NAS_IP\projects`
2. 创建 Junction `C:\Users\Administrator\Documents\大脉\damai-live` -> `Z:\damai`
3. 写入 Codex config + system prompt

### 3. 验证双向打通

```powershell
# Windows -> NAS
"hello from windows" | Out-File "C:\Users\Administrator\Documents\大脉\damai-live\.smb-test-from-win"

# 切到 NAS 容器内
cat /opt/data/projects/damai/.smb-test-from-win
# 应该看到 "hello from windows"
```

## 日常使用

### Codex 写代码 -> Hermes 浏览器实时看到

```
Codex sandbox: C:\Users\Administrator\Documents\大脉\damai-live
                ↓ 写 app/canvas/[id]/CanvasEditor.tsx
Junction 转接到 Z:\damai\app\canvas\[id]\CanvasEditor.tsx
                ↓ SMB 写到
NAS /opt/data/projects/damai/app/canvas/[id]/CanvasEditor.tsx
                ↓ Next.js dev server HMR 监听到
Hermes 浏览器自动刷新
```

**零复制, 零等待.**

### Hermes 卡住 -> 让 Codex 分析

不再需要把项目复制到桌面. Hermes 直接:

```
delegate_task(
  goal="分析 CanvasEditor 为什么 onPickImage 闭包 stale",
  toolsets=["terminal", "file"]
)
```

Codex 通过 SMB 读 NAS 上的真实文件, 给出修复方案, 用户验收后 Hermes 落地改.

## 兜底方案: Codex CLI 装 NAS 容器

如果 SMB 慢或断网:

```bash
# 在 NAS 容器内 (SSH 进 NAS -> docker exec -it hermes bash)
npm i -g @openai/codex
# 配 API key
mkdir -p ~/.codex
echo '{"OPENAI_API_KEY": "sk-..."}' > ~/.codex/auth.json
chmod 600 ~/.codex/auth.json

# Hermes 直接调
delegate_task(goal="...", acp_command="codex")
```

## 故障排查

| 现象                          | 原因                         | 解决                            |
|-------------------------------|------------------------------|---------------------------------|
| `mklink /J` 失败              | 目标路径已存在但不是 Junction| `rmdir` 那个目录再重跑          |
| Codex 写文件 "Permission denied" | SMB force user 没设对     | NAS 控制台 -> SMB -> 高级 -> force user = root |
| HMR 不触发                     | NAS 容器内 chokidar 没监听到 | 容器内 `ls -la` 看 mtime, dev server 日志 |
| Windows 看不到 `Z:` 盘       | net use 凭据过期             | `net use Z: /delete` 后重跑脚本  |
| `Test-NetConnection 445` 不通 | NAS 防火墙                   | NAS 控制台 -> 网络 -> 防火墙开 445 |