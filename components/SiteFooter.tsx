"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COLUMNS = [
  {
    title: "产品",
    items: [
      { href: "/", label: "首页" },
      { href: "/case", label: "案例库" },
      { href: "/templates", label: "模板中心" },
      { href: "/sandbox/canvas-v3", label: "画布" },  // 07-08: v3 自研画布 (替代 /sandbox/canvas React Flow)
    ],
  },
  {
    title: "数据",
    items: [
      { href: "/data/viral", label: "爆款选集库" },
      { href: "/data/review", label: "数据复盘" },
      { href: "/data/analytics", label: "数据分析" },
    ],
  },
  {
    title: "工作台",
    items: [
      { href: "/workbench", label: "我的项目" },
    ],
  },
  {
    title: "关于",
    items: [
      { href: "#", label: "公司" },
      { href: "#", label: "隐私" },
      { href: "#", label: "条款" },
    ],
  },
];

export default function SiteFooter() {
  const pathname = usePathname();
  // 沉浸式画布: canvas 路由不渲染 footer
  if (pathname?.startsWith("/canvas")) return null;

  return (
    <footer
      style={{
        background: "var(--bg-gray)",
        borderTop: "1px solid var(--border-light)",
        padding: "3rem 0 2rem",
        marginTop: "6rem",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  marginBottom: 12,
                  letterSpacing: "0.01em",
                }}
              >
                {col.title}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.items.map((item) => (
                  <li key={item.href} style={{ marginBottom: 8 }}>
                    <Link
                      href={item.href}
                      style={{ fontSize: "0.8125rem", color: "var(--text)" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "1.5rem",
            fontSize: "0.75rem",
            color: "var(--text-tertiary)",
          }}
        >
          <div>© 2026 大脉. 保留所有权利.</div>
          <div>由 MiniMax 智能驱动</div>
        </div>
      </div>
    </footer>
  );
}