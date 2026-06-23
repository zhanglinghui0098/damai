"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/workbench", label: "爆款仓库" },
  { href: "/case", label: "案例库" },
  { href: "/dashboard", label: "数据中心" },
];

export default function SiteNav() {
  const pathname = usePathname();
  // 沉浸式画布: canvas 路由不渲染 nav (避免干扰创作)
  if (pathname?.startsWith("/canvas")) return null;

  const [openMenu, setOpenMenu] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 防 HMR state 残留 + portal 仅在 client mount 后渲染
  useEffect(() => {
    setMounted(true);
    setOpenMobile(false);
    setOpenMenu(false);
  }, []);

  // 锁定 body 滚动 (避免背景跟着滚)
  useEffect(() => {
    if (openMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMobile]);

  const drawer = (
    <>
      {/* 半透明 backdrop — 点击关闭 */}
      <div
        onClick={() => setOpenMobile(false)}
        style={{
          position: "fixed",
          inset: 0,
          top: 48,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 199,
          animation: "fadeIn 0.2s ease-out",
        }}
        aria-hidden="true"
      />
      {/* 抽屉主体 — 从左侧滑入 */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: 48,
          left: 0,
          bottom: 0,
          width: "min(320px, 85vw)",
          background: "var(--bg)",
          borderRight: "1px solid var(--border-light)",
          zIndex: 200,
          padding: "1.5rem 1.25rem",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          animation: "slideInLeft 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "8px 0 32px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenMobile(false)}
              style={{
                display: "block",
                padding: "0.85rem 0.75rem",
                fontSize: "1.0625rem",
                color: "var(--text)",
                fontWeight: 500,
                borderBottom: "1px solid var(--border-light)",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "var(--border-light)", margin: "0.5rem 0" }} />
          <button
            onClick={() => {
              setOpenMobile(false);
              window.dispatchEvent(new Event("damai:auth:open"));
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.85rem 0.75rem",
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            登录 / 切换
          </button>
        </div>
      </div>
    </>
  );

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--overlay)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 600,
            fontSize: "1.125rem",
            letterSpacing: "-0.01em",
          }}
        >
          大脉
        </Link>

        <ul
          className="nav-desktop"
          style={{
            gap: "1.75rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text)",
                  opacity: 0.88,
                  transition: "opacity 0.18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.88")}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 汉堡按钮 — 仅 mobile 显示 (桌面 css 隐藏) */}
          <button
            className="nav-mobile-btn"
            onClick={() => setOpenMobile(!openMobile)}
            aria-label="菜单"
            style={{
              width: 36, height: 36, borderRadius: 8,
              alignItems: "center", justifyContent: "center",
              color: "var(--text)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {openMobile ? (
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>

          {/* 头像 + 桌面端下拉菜单 */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              aria-label="账户菜单"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--bg-gray)",
                fontSize: "0.75rem", fontWeight: 600,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              经
            </button>
            {openMenu && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "var(--bg-elevated)", border: "1px solid var(--border-light)",
                  borderRadius: 12, minWidth: 200,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  padding: 8, zIndex: 200,
                }}
                onMouseLeave={() => setOpenMenu(false)}
              >
                <MenuItem href="/dashboard">欢迎页</MenuItem>
                <MenuItem href="/workbench">我的项目</MenuItem>
                <MenuItem href="/data/review">数据复盘</MenuItem>
                <MenuItem href="/data/analytics">数据分析</MenuItem>
                <div style={{ height: 1, background: "var(--border-light)", margin: "6px 0" }} />
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    window.dispatchEvent(new Event("damai:auth:open"));
                  }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 12px",
                    fontSize: "0.875rem", color: "var(--text)", borderRadius: 6,
                    background: "transparent", border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-gray)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  登录 / 切换
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端抽屉 — 用 portal 渲染到 body, 脱离 nav 的 backdrop-filter containing block */}
      {openMobile && mounted && createPortal(drawer, document.body)}
    </nav>
  );
}

function MenuItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "block", padding: "8px 12px",
        fontSize: "0.875rem", color: "var(--text)", borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-gray)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </Link>
  );
}