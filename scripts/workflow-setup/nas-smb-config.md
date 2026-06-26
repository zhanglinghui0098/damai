# NAS 控制台 SMB 共享配置 (绿联 DXP4800 Plus)

## Step 1: 启用 SMB

控制台 -> 文件服务 -> SMB (默认开启) -> 确认状态"已启用"

## Step 2: 创建共享

文件服务 -> 共享列表 -> 新增共享

| 字段           | 值                                |
|----------------|-----------------------------------|
| 共享名         | `projects`                        |
| 共享路径       | `/opt/data/projects` (容器外路径) |
| 启用回收站     | 关                                |
| 启用 SMB       | 开                                |
| 允许匿名访问   | **关** (用账号密码认证更安全)     |
| 读写权限       | 你的 NAS 账号 -> 完全控制         |
| 高级 -> force user | 填 `root` (关键!)              |
| 高级 -> force group| 填 `root`                      |

**为什么 force user = root 关键**:
- Hermes 容器内用 root 跑, 容器内创建的文件 owner = root
- Windows 通过 SMB 写入的文件 owner = NAS_USER (Windows 账号)
- 不加 `force user`, 后续 Hermes 容器内要 chmod 才能改 Codex 写的文件
- 加上后, SMB 共享下所有文件 owner 统一是 root, 两边都能改

## Step 3: 验证

在 NAS 容器内 (SSH 进 NAS 后 `docker exec -it hermes bash`):

```bash
# 看 /opt/data/projects 的 owner
ls -la /opt/data/projects/
# 应该看到 root:root

# 创建一个测试文件
touch /opt/data/projects/damai/.smb-test
chmod 666 /opt/data/projects/damai/.smb-test
ls -la /opt/data/projects/damai/.smb-test
# 应该看到 -rw-rw-rw- root root
```

在 Windows 上跑 `setup-workflow.ps1`, 然后验证:

```powershell
# 写一个测试文件 (从 Windows 通过 SMB)
"hello from windows" | Out-File "Z:\damai\.smb-test-from-win"

# 在 NAS 容器内验证
cat /opt/data/projects/damai/.smb-test-from-win
# 应该看到 "hello from windows"
```

如果能双向读写, 配置完成.

## Step 4: 防火墙 / 网络

确认 Windows 能访问 NAS 的 445 端口:

```powershell
Test-NetConnection -ComputerName $NAS_IP -Port 445
# 应该看到 TcpTestSucceeded: True
```

如果不通:
- NAS 控制台 -> 网络 -> 防火墙 -> 允许 SMB (445/tcp)
- Windows 防火墙 -> 允许 "文件和打印机共享 (SMB-In)"

## Step 5 (可选): 性能调优

如果 SMB 慢:
- 控制台 -> 文件服务 -> SMB -> 高级 -> 启用 SMB3 + 多通道
- Windows: 映射网络驱动器 -> 勾 "使用 SMB3"