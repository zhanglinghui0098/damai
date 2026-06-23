"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { getTemplateById } from "@/lib/templates";

function GenerateContent() {
  const sp = useSearchParams();
  const templateId = sp.get("template") || "boss";
  const tpl = getTemplateById(templateId);

  const [aspect, setAspect] = useState<"9:16" | "16:9" | "1:1">(tpl?.aspect || "9:16");
  const [watermark, setWatermark] = useState(true);
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);
    // mock 下载 (无真视频文件, 假装下载)
    setTimeout(() => {
      alert(`Mock 下载\n\n模板: ${tpl?.name}\n比例: ${aspect}\n水印: ${watermark ? "开" : "关"}\n\n(4 secret 冻结中, 正式版接 ffmpeg 真出片)`);
      setDownloading(false);
    }, 800);
  }

  if (!tpl) {
    return (
      <div className="section">
        <div className="container">
          <h1 className="h-section">出片页</h1>
          <p className="t-sub">没有传入 template 参数, 请从 <Link href="/templates" style={{ color: "var(--accent)" }}>模板中心</Link> 选一个模板开始。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 1080 }}>
        {/* 顶部 */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href={`/create/${templateId}`} className="t-small" style={{ color: "var(--text-secondary)" }}>
            ← 返回修改
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 1fr)", gap: "2rem" }}>
          {/* 左: 视频预览 (mock) */}
          <div>
            <div
              style={{
                aspectRatio: aspect === "9:16" ? "9/16" : aspect === "1:1" ? "1/1" : "16/9",
                maxHeight: 540,
                background: `linear-gradient(135deg, hsl(${tpl.hue}, 22%, 22%), hsl(${tpl.hue + 12}, 20%, 12%))`,
                borderRadius: 16,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid var(--border-light)",
                margin: "0 auto",
              }}
            >
              {/* mock 视频 placeholder */}
              <div style={{ textAlign: "center" }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 1rem" }}>
                  <path d="M8 5v14l11-7z" fill="rgba(255,255,255,0.5)" />
                </svg>
                <div className="t-small" style={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  {tpl.name}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)" }}>
                  Mock preview · {tpl.duration}s · {tpl.model}
                </div>
              </div>
              {/* AI 水印 (合规) */}
              {watermark && (
                <span className="watermark">AI 生成</span>
              )}
            </div>

            <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
              <div className="t-small" style={{ color: "var(--text-tertiary)" }}>
                ⚠️ 当前为 Mock 视频 (无 API key, 真实出片 = 接火山方舟 + ffmpeg)
              </div>
            </div>
          </div>

          {/* 右: 4 控件 */}
          <div>
            <h2 className="h-section" style={{ fontSize: "1.25rem", marginBottom: "1.25rem" }}>出片</h2>

            {/* 比例 */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div className="t-small" style={{ marginBottom: "0.5rem", color: "var(--text-tertiary)" }}>
                比例
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["9:16", "1:1", "16:9"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    style={{
                      flex: 1, padding: "0.55rem 0",
                      fontSize: "0.8125rem",
                      color: aspect === a ? "var(--text)" : "var(--text-secondary)",
                      background: aspect === a ? "var(--bg-gray)" : "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    {a === "9:16" ? "竖屏 9:16" : a === "1:1" ? "方形 1:1" : "横屏 16:9"}
                  </button>
                ))}
              </div>
              <div className="t-small" style={{ marginTop: 6, color: "var(--text-tertiary)" }}>
                抖音/小红书 = 竖屏 · 朋友圈 = 方形 · 视频号 = 横屏
              </div>
            </div>

            {/* 水印 */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div className="t-small" style={{ marginBottom: "0.5rem", color: "var(--text-tertiary)" }}>
                AI 水印 (合规)
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={watermark}
                  onChange={(e) => setWatermark(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: "0.875rem" }}>添加 "AI 生成" 标识</span>
              </label>
              <div className="t-small" style={{ marginTop: 6, color: "var(--text-tertiary)" }}>
                网信办《深度合成管理规定》要求, 强制开启
              </div>
            </div>

            {/* 下载 */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-primary"
              style={{ width: "100%", height: 48, fontSize: "0.9375rem", fontWeight: 500 }}
            >
              {downloading ? "下载中..." : "下载 mp4"}
            </button>

            {/* 链接: 切换到画布编辑 */}
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <Link href="/canvas" className="t-small" style={{ color: "var(--text-secondary)" }}>
                想要更精细的编辑? 试试画布 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container">
          <div className="t-small" style={{ color: "var(--text-tertiary)" }}>加载中...</div>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
