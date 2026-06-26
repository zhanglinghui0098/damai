# setup-workflow.ps1
# 一键配置: SMB 网络驱动器 + Junction 目录联接 + Codex sandbox
# 运行方式: PowerShell 管理员模式 -> .\setup-workflow.ps1
#
# 作用: 让 Codex/Workbody (桌面) 与 Hermes (NAS 容器) 看同一份文件,
#       解决"Codex 写完要手动 cp 到 NAS"和"Hermes 卡住要复制项目到桌面分析"的割裂。

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# === 用户需要改的常量 ===
$NAS_IP       = "192.168.1.100"           # TODO: 改成你的 NAS IP (在 NAS 控制台 → 网络看)
$NAS_USER     = "你的NAS账号"              # TODO: 改成你的 NAS 登录账号
$NAS_PASS     = "你的NAS密码"              # TODO: 改成你的 NAS 登录密码
$NAS_SHARE    = "projects"                 # NAS 共享名 (在 NAS 控制台 → 文件服务 → SMB 看到的名字)
$DRIVE_LETTER = "Z"                        # Windows 映射的网络驱动器盘符
$JUNCTION_DIR = "C:\Users\Administrator\Documents\大脉"
$JUNCTION_NAME = "damai-live"              # 联接名 (Codex sandbox allowlist 用)
$CODEX_PROJECT_ROOT = "$JUNCTION_DIR\$JUNCTION_NAME"

# === 1. 映射网络驱动器 ===
Write-Host "[1/4] 映射网络驱动器 ${DRIVE_LETTER}: -> \\$NAS_IP\$NAS_SHARE ..." -ForegroundColor Cyan
$existing = Get-SmbMapping -LocalPath "${DRIVE_LETTER}:" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "    已存在映射, 先移除" -ForegroundColor Yellow
    Remove-SmbMapping -LocalPath "${DRIVE_LETTER}:" -Force
}
# 用凭据存储避免每次重启电脑都要重输密码
$securePass = ConvertTo-SecureString $NAS_PASS -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($NAS_USER, $securePass)
New-SmbMapping -LocalPath "${DRIVE_LETTER}:" -RemotePath "\\$NAS_IP\$NAS_SHARE" -Credential $credential -Persistent

# === 2. 创建目录 + Junction ===
Write-Host "[2/4] 创建 Junction $JUNCTION_DIR\$JUNCTION_NAME -> ${DRIVE_LETTER}:\damai ..." -ForegroundColor Cyan
if (!(Test-Path $JUNCTION_DIR)) {
    New-Item -ItemType Directory -Path $JUNCTION_DIR -Force | Out-Null
}
$junctionPath = "$JUNCTION_DIR\$JUNCTION_NAME"
if (Test-Path $junctionPath) {
    $item = Get-Item $junctionPath -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        Write-Host "    Junction 已存在, 检查是否正确..." -ForegroundColor Yellow
        $target = (Get-Item $junctionPath -Force).Target  # 仅在 PowerShell 5.1+ 支持
        Write-Host "    现有 Junction 指向: $target"
        # 不自动删除, 让用户决定
    } else {
        Write-Host "    [警告] $junctionPath 已存在但不是 Junction, 请手动删除后重跑" -ForegroundColor Red
        exit 1
    }
} else {
    cmd /c mklink /J "$junctionPath" "${DRIVE_LETTER}:\damai"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    [错误] mklink 失败, 请确认 ${DRIVE_LETTER}:\damai 存在" -ForegroundColor Red
        exit 1
    }
}

# === 3. 验证 ===
Write-Host "[3/4] 验证路径..." -ForegroundColor Cyan
$testFile = "$CODEX_PROJECT_ROOT\package.json"
if (Test-Path $testFile) {
    Write-Host "    [OK] $testFile 存在" -ForegroundColor Green
    Write-Host "    内容预览:"
    Get-Content $testFile -TotalCount 5 | ForEach-Object { Write-Host "      $_" }
} else {
    Write-Host "    [警告] $testFile 不存在" -ForegroundColor Yellow
    Write-Host "    请确认 NAS 共享路径是否正确 (你设置的是 ${DRIVE_LETTER}:\damai)"
    Write-Host "    如果 NAS 共享根目录就是 damai, 把上面的 \damai 去掉"
}

# === 4. 配置 Codex sandbox ===
Write-Host "[4/4] 写入 Codex config.toml ..." -ForegroundColor Cyan
$codexConfigDir = "$env:USERPROFILE\.codex"
$codexConfigPath = "$codexConfigDir\config.toml"
if (!(Test-Path $codexConfigDir)) {
    New-Item -ItemType Directory -Path $codexConfigDir -Force | Out-Null
}

# 备份现有 config
if (Test-Path $codexConfigPath) {
    $backupPath = "$codexConfigPath.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $codexConfigPath $backupPath
    Write-Host "    已备份现有 config 到 $backupPath"
}

@"
# Codex CLI config for 大脉 NAS workflow
# 路径 C:\Users\Administrator\Documents\大脉\damai-live 通过 mklink /J 指向 NAS

model = "gpt-5-codex"

[approval]
# 危险操作 (rm, 改 .env) 才询问, 其他自动执行
mode = "auto"

[sandbox]
# workspace-write: 只能写 working_dir + writable_roots, 其他目录只读
mode = "workspace-write"

# 允许写入的目录 (绝对路径). 当前 working_dir 自动允许.
writable_roots = [
    "C:\\Users\\Administrator\\Documents\\大脉\\damai-live",
]

# 允许读 (但不能写) 的目录: Node.js, Git
read_only_roots = [
    "C:\\Program Files\\nodejs",
    "C:\\Program Files\\Git",
]

# 禁用网络 (避免 Codex 自己跑 npm install 把 NAS 撑爆)
network_access = false
"@ | Out-File -FilePath $codexConfigPath -Encoding UTF8

Write-Host "    [OK] Codex config 已写入 $codexConfigPath" -ForegroundColor Green

# === 5. 写入 Codex system prompt 硬约束 ===
$codexPromptPath = "$codexConfigDir\instructions.md"
@"
# 大脉项目 - Codex 工作守则

## 文件访问约束 (硬约束)

你正在操作的路径 C:\Users\Administrator\Documents\大脉\damai-live 通过 Windows Junction
实际指向绿联 NAS 上的 Hermes 工作目录 (/opt/data/projects/damai).

**永远不要 touch 以下目录**:
- `node_modules/` — 装在 NAS 容器内, 通过 SMB 删了 Hermes 容器还会重新装, 但你删的过程中会卡
- `.next/` — Next.js dev server 编译产物, 删了让 Hermes 浏览器挂掉
- `.git/` — 如果有 git 仓库, 别乱搞
- `.env.local` / `.env*` — 包含 API key
- `*.log` — 日志文件

**可以改的目录**:
- `app/` — Next.js 源代码
- `components/` — React 组件
- `lib/` — 工具函数
- `scripts/` — 脚本

## 工作流

1. 改代码 -> 自动 HMR -> Hermes 浏览器实时看到变化 (无需手动 cp)
2. 改完简单自检: type-check (tsc --noEmit) + 跑相关单元测试
3. 不要自己启动 dev server (Hermes 已经跑着了)

## 沟通

- 完成大改动后, 用一段简洁的中文总结改了什么、为什么这么改
- 不要做用户没要求的额外优化 (用户偏好"减法 + 一站式")
- 如果发现 Hermes 这边有 bug, 直接修, 不用问"要不要修"
"@ | Out-File -FilePath $codexPromptPath -Encoding UTF8

Write-Host "    [OK] Codex instructions 已写入 $codexPromptPath" -ForegroundColor Green

# === 完成 ===
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "配置完成! 现在你可以:" -ForegroundColor Green
Write-Host "  1. Codex sandbox 允许: $CODEX_PROJECT_ROOT"
Write-Host "  2. Codex 写代码 -> 自动 HMR -> Hermes 浏览器实时看到"
Write-Host "  3. Hermes 卡住 -> 让我 delegate_task 调 Codex 分析 NAS 文件"
Write-Host ""
Write-Host "NAS 控制台还需要勾一项 (Samba 共享权限):" -ForegroundColor Yellow
Write-Host "  控制台 -> 文件服务 -> SMB -> 共享列表 -> projects -> 编辑"
Write-Host "  -> 勾选 '允许匿名访问' 或给当前用户读写权限"
Write-Host "  -> 高级 -> 'force user = root' (避免 Windows/Linux 权限错乱)"
Write-Host "=========================================" -ForegroundColor Green