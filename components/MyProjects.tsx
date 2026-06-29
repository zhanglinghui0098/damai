"use client";

// 我的项目 (home page section) — 06-29 14:30 S3 改: 弃 MOCK_PROJECTS, 改 fetch /api/projects
// 显示规则 (减法, user 06-19 起偏好):
//   - 有缩略图 → 用 OSS URL; 无 → 渐变色块 (hash 算 hue, 保证同名同色)
//   - 时间 → 相对 ("刚刚/N 分钟前/N 小时前/N 天前/N 个月前")
//   - 状态 → Bitable 字段, 默认 "草稿"
//   - 空 → 模板中心引导

import Link from "next/link";
import { useEffect, useState } from "react";

interface Project {
  record_id: string;
  项目名: string;
  状态?: string;
  类型?: string;
  缩略图URL?: string;
  描述?: string;
  标签?: string;
  创建时间?: number;
  最后修改时间?: number;
}

function formatTime(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 0) return "刚刚";
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return `${Math.floor(d / 30)} 个月前`;
}

// 同名项目同色 (mock 的 hue 字段换成 hash)
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && Array.isArray(data.projects)) setProjects(data.projects);
      })
      .catch(() => {
        /* 静默失败: 空状态由 loading=false + empty 触发 EmptyState */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const empty = !loading && projects.length === 0;

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
            <h2 className="h-section" style={{ marginBottom: "0.25rem" }}>
              我的项目.
            </h2>
            <p className="t-sub">继续上次的创作.</p>
          </div>
          <Link href="/workbench" className="link-arrow">
            我的工作台
          </Link>
        </div>

        {loading ? (
          <div
            style={{
              padding: "3rem 1rem",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            加载中…
          </div>
        ) : empty ? (
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
            {projects.map((p) => {
              const hue = hueFromName(p.项目名 || p.record_id);
              return (
                <Link
                  key={p.record_id}
                  href={`/canvas/${p.record_id}`}
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
                      background: p.缩略图URL
                        ? `center/cover no-repeat url(${p.缩略图URL})`
                        : `linear-gradient(135deg, hsl(${hue}, 45%, 50%, 0.55), hsl(${(hue + 30) % 360}, 40%, 62%, 0.38))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {!p.缩略图URL && (
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
                    )}
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
                      {p.项目名}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "#86868b",
                      }}
                    >
                      <span>{formatTime(p.最后修改时间 || p.创建时间)}</span>
                      <span>{p.状态 || "草稿"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
      <Link href="/templates" className="link-arrow">
        去模板中心开始第一个 →
      </Link>
    </div>
  );
}
