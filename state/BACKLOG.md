# 大脉 (damai) Backlog

最后更新: 2026-06-26 06:45 CST

## ✅ 已完成 (recently done)

### Canvas i2i (图生图) 修复 — 06-26 06:42 验证通过 ✅
- ✅ `computeArkSize` MIN_PIXELS=3,686,400 clamp (Ark 硬底线, 1K+16:9 自动放大)
- ✅ `CanvasEditor.tsx` toAbs 相对路径转绝对路径 (上轮 patch 被 SMB 覆盖, 重打)
- ✅ Next.js hot reload picked up
- ✅ cloudflared 重启换新 URL
- ✅ **用户实测验证 (06-26 06:42)**: Image A → Image B, dev log 出现 `[ark-image] i2i: inline 1 ref(s) as data URL`, B 节点 outputUrl 真作 i2i 参考图

## 📋 下一步 (next)

- [ ] **Cloudflare named tunnel** (推荐): URL 永久固定, 容器重启不换 → 一次到位解决 530 + 重启换 URL 痛点
- [ ] docker-compose entrypoint 脚本: 容器启动自动跑 npm run dev + cloudflared (短期方案)
- [ ] canvas 节点设计 v4+ (按 user 审美调优, 节点间距/端口 hover/连线动画)
- [ ] compact AIInput 用于 canvas 顶部 + report 顶部

## 🚧 已搁置 / 等用户决策

- [ ] AI 视频 SaaS 产品上线 (damai 待上线, B 端先)
- [ ] 9router 在 NAS 验证 ARM64 Docker 镜像 (等用户跑 `sudo docker pull decolua/9router:latest`)
- [ ] B 端: 顾家家居 (宁波) 客餐厅 2026 年度短视频项目
- [ ] B 端: 即客传媒 (广告服务) + 天禧派 (零售) + 大脉 (SaaS) 三线打通

## 📦 06-26 06:45 备份到 GitHub
- commit: `chore: 06-26 进度备份 (canvas i2i 验证通过)`
- 推 master 分支到 github.com/zhanglinghui0098/damai.git