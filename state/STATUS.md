# 大脉 (damai) 项目状态

最后更新: 2026-06-24

## 当前在做
- AIInput v7 删除完成: 静态 1px 蓝紫边框 (无动画/无光晕/无光圈)
- Canvas 端口简化完成: 每节点 1 input + 1 output, 删了 MAX_INPUTS/addInputPort/removeInputPort/onAddInput prop/+按钮
- 部署: cloudflared tunnel `https://utc-reporter-witnesses-attachments.trycloudflare.com`

## 关键决策
- 减法 + 一站式 (v4 起): 经销商 IT 弱, 不能跳剪映, 大脉必须覆盖抽卡/拼接/字幕/BGM/出片
- 蓝紫色调: --accent: #6e8cd6, 头像光晕 rgba(168,184,224,0.55)
- Codex base 保留: avatar ball + 2 eyes + blue glow + GO ↗ + "+" 按钮

## 待办
- [ ] compact AIInput 用于 canvas 顶部 + report 顶部
- [ ] AI 视频 SaaS 产品上线 (damai 待上线)
- [ ] B 端: 顾家家居 (宁波) 客餐厅 2026 年度短视频项目 (365 天周期)
- [ ] B 端: 即客传媒 (广告服务) + 天禧派 (零售) + 大脉 (SaaS) 三线

## 文件位置
- 项目根: /opt/data/projects/damai
- 主页: app/page.tsx
- AIInput: components/AIInput.tsx + app/globals.css
- Canvas: app/canvas/[id]/CanvasEditor.tsx
- 全局样式: app/globals.css

## 重要背景
- 飞书 App: cli_aa9768a568b8dcb6 (drive:drive + bitable:app 权限已开)
- Bitable app_token: RPvQbE65Ga4pN6sFop1cZfI1nWg (12 表 389 字段)
- Codex 在 NAS 工作, 他的代码存档在 /opt/data/projects/damai/

## 教训 (非技能类,仅项目相关)
- AIInput 光圈 7 版仍未收敛, 已删除: 用户对边框动效过敏, 不要再主动加
- 用户对 Verify-Fix-Verify 循环敏感: 3 版不对就问"删/换/参考图", 不要硬撑
