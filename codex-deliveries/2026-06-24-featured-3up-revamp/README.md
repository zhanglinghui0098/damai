# 精选推荐 v6 — 3 屏大卡交付包 (2026-06-24)

> 状态: 写好代码, 等 Hermes 部署
> 改动: 首页 `精选推荐` 栏目 从 5 屏 3D carousel 改为 3 屏横向大卡 (图二效果)

---

## 1. 改动清单

| 文件 | 改动类型 | 说明 |
|---|---|---|
| `components/FeaturedCases.tsx` | 替换 (整文件) | 删 `FeaturedCarousel` (3D perspective 透视 + 5 卡), 换成 `FeaturedGrid` (3 列等高大卡). 保留 `SectionHeader` + `HotTemplates` (爆款模板) 不动 |
| `app/globals.css` | **追加** (末尾) | 加 `.featured-grid-3` / `.featured-card` / `.featured-card-tag` / `.featured-card-title` 样式块 (含 hover + 暗角 + 响应式) |

**未动**: `CaseCard.tsx` / `lib/cases.ts` / `app/page.tsx` / `tailwind.config.ts` / `package.json`

---

## 2. 部署步骤 (Hermes)

### 1) 备份当前两个文件
```bash
cp components/FeaturedCases.tsx  components/FeaturedCases.tsx.bak-v5
cp app/globals.css                app/globals.css.bak-v5
```

### 2) 覆盖
- `components/FeaturedCases.tsx` ← 本包 `components/FeaturedCases.tsx` (整文件替换)
- `app/globals.css` ← 把本包 `globals.css.snippet.txt` **追加**到 `app/globals.css` 文件末尾

### 3) 重 build
```bash
rm -rf .next && npm run build
```

### 4) 浏览器验证
- 首页 `精选推荐` 应是 3 张横向大卡, **不是** 3D carousel
- 每张卡: 左上小字 tag (绿色), 左下大字 title (白色)
- hover 卡片: 上移 4px, 暗角加深
- `爆款模板` 仍是 4 列网格 (未动)
- 移动端 (≤1024px) 3 张卡堆叠为 1 列

---

## 3. 改内容 (后续)

打开 `components/FeaturedCases.tsx` 顶部的 `PROMOS` 数组, 改对应字段:

```ts
const PROMOS: PromoItem[] = [
  {
    id: "promo-canvas",          // 唯一 id
    tag: "无限画布",              // 左上小字 (默认绿色)
    title: "四大维度·激励计划",   // 左下大字 (白色)
    href: "/canvas/new",          // 跳转链接
    bg: "linear-gradient(135deg, #d4a574 0%, #8b6f47 100%)",  // 背景: 渐变 或 url()
    tagColor: "#34d399",          // 可选, 覆盖 tag 颜色
  },
  // ... 再加 2 项
];
```

**换真图**: 把 `bg` 改成 `bg: "url(/case/poster/xxx.jpg) center/cover"` 即可.

**想加/删一张卡**: 直接 push / splice `PROMOS` 数组, 网格会自动用 `grid-template-columns: repeat(3, 1fr)` 适配 (≥4 张时建议改 `repeat(4, 1fr)` 或自动填充).

---

## 4. 已知假设 / 决策

| 项 | 决策 |
|---|---|
| 图二里的卡是营销图, 不是视频 poster | 新卡用 CSS 渐变占位, 你后期替换为 `url(/path/to/img)` |
| 移动端断点 | 1024px 以下 3 卡堆叠 1 列 (沿用 v5 现有断点) |
| 暗模式 | `var(--bg)` 是 `#0A0A0B` 极黑底, tag 绿色 `#34d399` 在黑底上对比度足够 |
| hover 动效 | 上移 4px + 暗角 `0.45 → 0.6` 加深, 跟其他 section 一致 |
| "爆款模板" | **不动**, 4 列网格 + tab 筛选保留 v5 行为 |

---

## 5. 回滚

出问题:
```bash
cp components/FeaturedCases.tsx.bak-v5 components/FeaturedCases.tsx
# 手动从 globals.css 末尾删掉 v6 那段 (本包 globals.css.snippet.txt 整段)
rm -rf .next && npm run build
```
