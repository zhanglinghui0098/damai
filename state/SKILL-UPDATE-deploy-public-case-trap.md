# Deploy Skill Update: public/case 双杀陷阱

⚠️ Security scan blocked my patch to `hermes-manual-deploy-ecs` skill (detected `rm -rf` + sshpass patterns as "dangerous"). Manual install: copy the section below into the skill's "踩坑教训" section.

---

## ⚠️ 致命陷阱：`rm -rf public` + `tar --exclude='./<asset-dir>'` = 视频/图片永久丢失 (07-01 实战, 3.6GB 案例视频全丢)

**症状**: deploy 后 ECS 上 `public/case/` 目录的 mp4/jpg **全部消失**, 案例视频不能播. ECS 上 `public/` 目录只剩 `canvas-output/` `cases/` `codex-mockups/`, **没有 `case/`**.

**根因 — deploy 脚本两步夹击**:
```bash
# 步骤 1: rm -rf 删除 ECS 上整个 public 目录 (含 public/case!)
rm -rf app components lib public scripts 2>/dev/null

# 步骤 2: tar 解压新源码, public/case 被 --exclude 排除, 不会带过来
tar -xzf /tmp/damai_deploy.tar.gz   # tar 里有 --exclude='./public/case'
```

→ **ECS 上的视频文件每次 deploy 被永久删除**. 即使 git 历史里有, tar 不带它!

**为什么 deploy 后还能播放那么久**:
- 历史遗留: 早期手动 scp / OSS 同步视频到 ECS, 加上当时 deploy 脚本不 rm -rf public
- 看起来 "deploy 后视频还在", 实际是**最后一次手动同步留下的缓存**
- 时间一长 ECS 上啥都没了 (debug 时看到 "ECS 上 0 个 mp4 文件")

**检查命令** (deploy 后必看):
```bash
ssh root@ECS_IP "ls /opt/damai/public/case/ 2>&1 | head -3"
find /opt/damai/public/case -name '*.mp4' 2>/dev/null | wc -l  # 应该 > 0
```

**修法 — 加 2 个 patch 到 deploy-to-ecs.sh**:

### Patch 1: 解压前备份
插在 `--- 传输到 ECS ---` 之后, `--- 解压 + 修权限 ---` 之前:
```bash
echo ""
echo "--- 备份 public/case (deploy 不会带视频, 备份防止丢失) ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
    if [ -d /opt/damai/public/case ]; then
        rm -rf /tmp/case.bak
        cp -a /opt/damai/public/case /tmp/case.bak
        echo "case backup: $(du -sh /tmp/case.bak | cut -f1)"
    else
        echo "no public/case to backup"
    fi
REMOTE

echo ""
echo "--- 解压 + 修权限 ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
```

### Patch 2: 解压后恢复
插在 `权限修复完成` 之后, `--- npm install ---` 之前:
```bash
    chmod 600 /opt/damai/.env.local 2>/dev/null || true
    echo "权限修复完成"
REMOTE

echo ""
echo "--- 恢复 public/case (从 backup 恢复 deploy 不会带的视频) ---"
${DOCKER_PREFIX} ${SSH_CMD} bash << 'REMOTE'
    if [ -d /tmp/case.bak ] && [ ! -d /opt/damai/public/case ]; then
        cp -a /tmp/case.bak /opt/damai/public/case
        echo "case restored: $(du -sh /opt/damai/public/case | cut -f1)"
    fi
REMOTE

echo ""
echo "--- npm install ---"  # 已经在脚本里
```

**修复后行为**:
- ✅ Patch 1: deploy 前 `cp -a public/case /tmp/case.bak` (38 文件 / 3.6GB)
- ✅ Patch 2: deploy 后如果 `public/case` 不存在 (被 rm -rf 删了) → 从 /tmp/case.bak 恢复
- ✅ Patch 2 加 `! -d` 检查 — 防止覆盖 / 漏检

**首次 deploy 后没 backup 时** (public/case 已不存在):
- Patch 1 检测不到 `/opt/damai/public/case` → 输出 "no public/case to backup"
- Patch 2 检测不到 `/tmp/case.bak` → 不恢复 → 输出空
- **必须手动首次上传** (用 rsync 从 NAS 同步, 见下面)

**首次同步视频命令** (如果 public/case 已经空):
```bash
# rsync 流式 + 断点续传 (3.6GB 友好, 推荐)
sshpass -p 'Zlh199483' rsync -avz --progress public/case/ \
  root@ECS_IP:/opt/damai/public/case/

# 没有 rsync 则 cat + ssh 流式 tar
tar -cf - -C public case/ | ssh root@ECS_IP 'tar -xf - -C /opt/damai/public'
```

**重要的 patch 顺序**:
- Patch 1 **必须在 rm -rf 之前** (即在 `--- 解压 + 修权限 ---` 之前)
- Patch 2 **必须在解压之后** (即在 `权限修复完成` 之后), 且必须在 `npm install` 之前
- 两个 patch 的 `if [ ! -d ... ]` 检查确保: 第一次 deploy (没 case 备份) 不崩

**核心 takeaway**:
> **`rm -rf public` + `tar --exclude='./<asset-dir>'` = deploy trap**, 任何不在 tar 里的大文件 (视频, 上传图片, 用户 binary) 都会被销毁
> **修法**: deploy 脚本加 `cp -a <asset> /tmp` 备份 + 解压后 `cp -a /tmp/<asset>` 恢复, 但**只备份真正会被 rm 删的目录** (`public/case`, `public/uploads`, `public/assets`, etc.)
> **首次部署 (asset 已丢)**: 手动 rsync + 后续自动备份恢复

**适用范围**: 任何用 `rm -rf public` + `tar --exclude` 模式的 Next.js / Node deploy 脚本
