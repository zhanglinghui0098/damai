# 大脉项目 — Daily Handoff (2026-06-30 13:30 CST)

> **用途**: 抗失忆 + 跨 session 连贯性, 06-30 13:30 手动更新 (cron 22:00 会覆盖)
> **下次 session 启动**: 读本文件 + `state/STATUS.md` + `git log --oneline -5`
> **维护人**: Hermes (NAS 容器)

---

## 0. 一句话 (今天做了什么)

- ✅ **节点功能按键已部署 06-30 13:27** — commit `1ec14f1` (含 3fcefd6 节点按键 + handoff)
- ⚠️ **Deploy 事故 + 修复已收口** — ECS npm install OOM 静默失败 → cp bak node_modules 跳过 → 重 build → 502 恢复 200
- ✅ **deploy-to-ecs.sh 已修** — 加 exclude `state/案例/ + state/案例库/ + .open-next + .wrangler + ...` (下次 tar 31M 不带 3.6G 视频)
- ✅ **Browser verify UI 完整** — 6 类节点 (Text/Image/VideoGen/AudioGen/Merge) + 顶栏 + 浮动工具 + 缩放 + 脉 logo 全在

## 1. 关键 commit
```
1ec14f1 docs(state): 06-30 13:20 handoff 更新 — 部署 handoff + 节点按键已 commit 待 deploy
3fcefd6 feat(canvas): 节点功能按键 (prompt/ModelChip/ChipRow/RunButton + NodeShell + Context)
599e6ae fix(canvas): /canvas 列表 redirect 从 canvas-v2 改成 canvas
8709229 feat(canvas): Phase 4 收口 — 老画布切换到 React Flow 单画布
8c2b1cc fix(canvas-v2): 把新画布代码 cp 到真正生效的 canvas-v2 路径
```

## 2. Deploy 链路 (06-30 13:20-13:27)
1. NAS tar 31M (排除 .git / node_modules / .next / state/案例/ / public/case/ / .open-next / .wrangler) — `state/` README 修后
2. scp ECS /tmp/damai-deploy.tar.gz (3.5s)
3. 备份 ECS /opt/damai → /opt/damai.bak-20260630-1320
4. 解压 204 文件 + chmod
5. ⚠️ npm install --include=dev **失败** (OOM, next symlink 没建) → build `next: command not found`
6. 修法: cp bak node_modules (18s, 358 packages) → npm run build OK (/canvas/[id] 59.1 kB) → pm2 delete + start (PID 122156)
7. curl https://damai.net.cn/canvas/test-3-5 → HTTP 200 + content-type text/html
8. browser verify: 6 类节点 + 顶栏 + 浮动工具 + 缩放 + 脉 logo 全在

## 3. 阻塞 ask user
1. 飞书告警 webhook URL (阶段 1.2 阻塞) — 老的, 还没解决
2. NAS 备份 SSH user (阶段 1.1 阻塞) — 老的, 还没解决
3. GitHub push 不可达 (国内 NAS 容器) — 本地 commit `1ec14f1` 已就位, 推 master 待 user 在能访问海外的机器跑

---

## 历史 (06-30 之前)

[原 handoff 内容] — 今天之前的进度

## 1. 商业方案 (静态)
- **项目**: 大脉 = AI 武装的家居 ToB 营销案例库 (对标 TapNow 模式)
- **客户**: 张凌辉 / 杭州即客传媒 / 天禧派 (城北万象城 2000方)
- **路径**: 天禧派自己门店 → 顾家家居 10 经销商
- **收费**: 工具免费 + 服务收费 (¥3000-5000/月)
- **护城河**: 1:5 = 完整工作流, 不是单点功能
- **详细**: `PROJECT.md` §1

## 2. 当前阶段 (动态)
- **v2.7.0** phase: 阶段 0 完成 + 阶段 1 部分阻塞 + 备案在审
- **phase_status**: phase_0_done_phase_1_partial_blocked
- **公网 URL**: https://damai.net.cn
- **详细**: `state.json` + `ROADMAP.md` 任务总览

## 3. 今日完成 (自动统计)
```
66156ae plan(canvas): 迁移 @xyflow/react v12 (4 phase 8-10h) — 06-29 19:30 user 决定走方案 A
a7fa0cc docs(state): 19:15 收口 — bezier+arrow canvas 部署 + session 跨 session 交接
ddfa331 fix(canvas): 连接线改贝塞尔+箭头+SVG覆盖全区域
de85d9c chore(gitignore): 忽略 tsconfig.tsbuildinfo build cache
7c31971 docs(canvas): 加注释说明 zoom 缩放不影响 UI 元素的架构
a163d0f fix(canvas): 连接线改正交阶梯 (像即梦/TapNow 竞品), 移除 cubic bezier 飘线
1c3be77 fix(canvas): port 默认 subtle 永远可见 + toolbar 节点不走 click 位置 (3 真 bug 修)
e7aaefd docs(state): 4T 共享盘 state/ 完整化 + 旧 brief 标过期, 治'其他 agent 改错'
34f9481 fix(canvas): SVG 10400x9600 覆盖全 panning 区域 + 线条加粗 + toolbar 用真实点击位置
937137f fix(deploy): cleanup tar + 旧 bak (server 30G 小, 留最新 1 个 bak)
81e2e22 fix(canvas): 右键回退到 panning, 保留双向 port + 5 真 bug 修
8fa46c3 fix(canvas): 06-29 17:30 画布 2 bug 真正修 (SVG 回退 + 公式 sign + 双向 + 右键)
bbc3b85 fix(canvas): 06-29 17:00 修 2 个画布 bug (链接线没了 + 新节点跑画外)
2afd8cc feat(oss-cases): 06-29 16:20 案例视频/海报从 server 迁到阿里云 OSS
48c783a deploy: 06-29 16:10 阿里云轻量生产部署完成 (admin + sudo bash -s)
1e825c1 fix(canvas): 06-29 14:55 紧急恢复 Codex 同步覆盖的 CanvasEditor.tsx
29122a0 feat(api): 06-29 14:30 P1 #2.1 S3 飞书项目表 API + MyProjects 真实数据 ✅
55ab837 feat(bitable): 06-29 14:00 P1 #2.1 飞书 Bitable 项目表 S1+S2 ✅
db75275 feat(deploy): 06-29 13:30 P0 #1 deploy 完成 + scripts/deploy-to-ecs.sh 自动化
70d7ced docs(state): 06-29 12:45 P0 #2 stub curl 5/5 测试通过 ✅
no commit today
```

## 4. 明日计划 (待 user 拍板 / 阻塞项)
参见 `state/STATUS.md` 末尾 + `DECISIONS.md` 待拍板段

## 5. 阻塞 ask user (3 件事)
1. **飞书告警 webhook URL** (阶段 1.2 阻塞)
2. **NAS 备份 SSH user 确认** + 是否配 key (阶段 1.1 阻塞)
3. **ECS 47.96.128.172 root 密码** (推 1.1 脚本用)

## 6. 关键文件位置
- `PROJECT.md` — 项目入口
- `ROADMAP.md` — 任务总览
- `DECISIONS.md` — 决策日志
- `state.json` — 机器可读进度
- `state/STATUS.md` — 状态详情
- `state/HANDOFF-LATEST.md` — 最新 handoff (本文件的副本)

## 7. Agent 操作原则 (硬规则)
- 6 步启动 checklist: state.json → PROJECT.md → DECISIONS.md → ROADMAP.md → codex-deliveries/ → hermes-reports/
- 不要盲信 user "X 已建立" → 先验证
- 改状态文件前问"我亲眼看到 vs user 说的"是否一致
- "继续"= 接上一 session 末尾, 不是新事

## 8. Git 状态
- HEAD: 66156ae
- 远端: origin/master
- 落后远端: 0 commit
- 未提交: 7 个文件
```
?? deploy-to-ecs.sh
?? "docs/08-OSS-\351\203\250\347\275\262\345\220\216\345\276\205\345\212\236-2026-06-27.md"
?? scripts/alert-resources.sh
?? scripts/backup-to-nas.sh
?? scripts/daily-handoff-daemon.sh
?? state/ALIYUN-DEPLOY-LESSONS.md
?? "state/\346\241\210\344\276\213/"
```

## 9. 教训 (按 06-27 update 累计)
- **mtime 假阳性**: 35 个 M 文件但 numstat 0 0 = 没改
- **session_search summary ≠ transcript**: 必须 git diff + mtime 反查
- **commit 范围**: `numstat > 0` 过滤, 别 `git add -A`
- **时间戳**: `datetime.fromtimestamp(t, UTC+8)` 换算
