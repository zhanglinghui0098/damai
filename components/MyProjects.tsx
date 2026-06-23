"use client";

import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/mock-projects";

export default function MyProjects() {
  const projects = MOCK_PROJECTS;
  const empty = projects.length === 0;

  return (
    <section className="section section--gray">
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2 className="h-section" style={{ marginBottom: "0.25rem" }}>我的项目.</h2>
            <p className="t-sub">继续上次的创作.</p>
          </div>
          <Link href="/workbench" className="link-arrow">我的工作台</Link>
        </div>

        {empty ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(260px, 1fr)",
              gap: "1rem",
              overflowX: "auto",
              padding: "0.25rem 0 0.5rem",
              scrollSnapType: "x mandatory",
            }}
          >
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/canvas/${p.id}`}
                style={{
                  scrollSnapAlign: "start",
                  background: "#fff",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 260,
                }}
              >
                <div
                  style={{
                    aspectRatio: "16/9",
                    background: `linear-gradient(135deg, hsl(${p.hue}, 45%, 50%, 0.55), hsl(${p.hue + 30}, 40%, 62%, 0.38))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    AI 生成
                  </span>
                </div>
                <div style={{ padding: "0.75rem 0.875rem 0.875rem" }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#111",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 4,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#86868b" }}>
                    <span>{p.updated}</span>
                    <span>{p.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "3rem 1rem",
        textAlign: "center",
        color: "var(--text-secondary)",
        border: "1px dashed var(--border-light)",
        borderRadius: 18,
      }}
    >
      <div style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>还没有项目</div>
      <Link href="/templates" className="link-arrow">去模板中心开始第一个 →</Link>
    </div>
  );
}