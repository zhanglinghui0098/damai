"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

// 顶部导航线条图标 (内联 SVG, 不引外部依赖, 与现有风格一致)
const Icon = {
  Home: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9.5z" />
    </svg>
  ),
  Workspace: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="18" height="7" rx="1.5" />
    </svg>
  ),
  TV: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M17 3l-5 4l-5-4" />
    </svg>
  ),
  Data: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <rect x="7" y="13" width="3" height="5" rx="0.5" />
      <rect x="12" y="9" width="3" height="9" rx="0.5" />
      <rect x="17" y="5" width="3" height="13" rx="0.5" />
    </svg>
  ),
};

const NAV = [
  { href: "/", label: "主页", icon: Icon.Home },
  { href: "/workbench", label: "工作空间", icon: Icon.Workspace },
  { href: "/case", label: "大脉TV", icon: Icon.TV },
  { href: "/dashboard", label: "数据中台", icon: Icon.Data },
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

  // 路由匹配: "/" 只在首页激活, 其余走前缀匹配 (覆盖 /case/[id] 等子路由)
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return !!pathname && pathname.startsWith(href);
  };

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
          {NAV.map((item) => {
            const IconComp = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenMobile(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 0.75rem",
                  fontSize: "1.0625rem",
                  fontWeight: active ? 600 : 500,
                  color: "var(--text)",
                  background: active ? "var(--bg-elevated)" : "transparent",
                  borderRadius: 10,
                  textDecoration: "none",
                }}
              >
                <IconComp size={18} />
                {item.label}
              </Link>
            );
          })}
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
        // v6: 删 backdrop-filter 修椭圆 bug (Chrome/Blink 合成 bug —
        // backdrop-filter 祖先 + 子元素 overflow:hidden + border-radius
        // 会产生椭圆伪影。背景已经 var(--overlay) 半透明深色,
        // 视觉上仍像玻璃, 只失去背后模糊。)
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
            gap: "0.35rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {NAV.map((item) => {
            const IconComp = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    height: 30,
                    padding: "0 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.8125rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "var(--text)" : "var(--text-secondary)",
                    background: active ? "var(--bg-elevated)" : "transparent",
                    border: active ? "1px solid var(--border)" : "1px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "var(--text)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }
                  }}
                >
                  <IconComp size={14} />
                  {item.label}
                </Link>
              </li>
            );
          })}
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