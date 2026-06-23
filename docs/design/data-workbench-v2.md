# 大脉 v2 数据工作台设计稿 - 交付包 (2026-06-23)

## 包含

- `README.md` - v2 定稿说明 (304 行 / 11 KB, 含 7 维度决策总结 + 路径表 + 视觉风格 + 数据模型 + Mermaid 工作流)
- `data-workbench-mockup.html` - 4 屏静态原型 (670 行 / 37 KB)

## v2 拍板要点

- **三合一**: 数据中心 = 数据工作台 = 复盘页 (都在首页第 4 屏)
- **路径**: `/dashboard` 系列 (沿用历史, 不再 `/workbench`)
- **视觉**: 沿用 v3 画布深色风 (`#0a0a0a` + 点阵 + 卡片 `#18181b`)
- **多租户 Day 1**: 必带 `tenant_id`
- **项目两层**: Project (账号) → SubProject (单条视频)
- **优化目标**: ROI / CPL (投流场景)
- **视频来源 3 种**: canvas / self_shot / external_edit

## 4 屏最终结构

| # | 屏 | 路径 |
|---|---|---|
| 1 | 首页第 4 板块 | `/` 第 4 块 |
| 2 | 工作台主页 | `/dashboard` |
| 3 | 项目详情 | `/dashboard/[id]` |
| 4 | 周报 | `/dashboard/[id]/report?range=week` |

## 待 Hermes 拍板

- [ ] 这版定稿 OK 不?
- [ ] 还需要加屏不? (当前 4 屏: 入口 / 项目列表 / 项目详情 / 周报)
- [ ] 直接进实现? → 写 Codex 任务单

## 已知小 bug (Codex 没擅自改, 等用户拍)

README 2.5 数据模型里 Project 类型有冗余的 `project_id` 字段 (line 119), 
SubProject 才有这个字段是对的, Project 不该有。Codex 等用户拍。

## 同步方式

1. SMB 把整个 `codex-deliveries/2026-06-23-data-workbench-v2/` 目录拖到 NAS `/主文件夹/` 或 `/ai工作文件/`
2. Hermes 跑:
   ```bash
   cd /opt/data/projects/damai/codex-deliveries/2026-06-23-data-workbench-v2
   bash sync-v2-data-workbench.sh
   ```
3. 落到 `/opt/data/projects/damai/docs/design/` (脚本自动建目录)

> 注意: NAS 上 unzip 可能没装, 这次脚本不依赖 unzip, 直接 `cp`。