import Link from "next/link";

const TABS = [
  { href: "/data/viral", label: "爆款选集库" },
  { href: "/data/review", label: "数据复盘" },
  { href: "/data/analytics", label: "数据分析" },
];

export default function DataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div
        className="container"
        style={{ paddingTop: "3rem", paddingBottom: "1.5rem" }}
      >
        <h1 className="h-section" style={{ marginBottom: "0.5rem" }}>数据中心.</h1>
        <p className="t-sub" style={{ marginBottom: "2rem" }}>
          选品 · 复盘 · 分析, 让数据指引下一步.
        </p>
        <div
          style={{
            display: "flex", gap: 0,
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              style={{
                padding: "0.875rem 1.25rem",
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                marginBottom: -1,
                borderBottom: "2px solid transparent",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}