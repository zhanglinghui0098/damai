"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type JobRecord = {
  taskId: string;
  templateId: string;
  templateName: string;
  model: string;
  status: "succeeded" | "failed" | "running";
  videoUrl?: string;
  error?: string;
  text: string;
  duration: number;
  ratio: string;
  createdAt: number;
  finishedAt?: number;
};

const STORAGE_KEY = "damai:jobs";

function loadJobs(): JobRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m${r}s`;
}

export default function AssetPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "succeeded" | "failed">("all");
  const [selected, setSelected] = useState<JobRecord | null>(null);

  useEffect(() => {
    setJobs(loadJobs());
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter(j => j.status === filter);

  // 数据看板
  const total = jobs.length;
  const succeeded = jobs.filter(j => j.status === "succeeded").length;
  const failed = jobs.filter(j => j.status === "failed").length;
  const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 0;
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalSeconds = jobs
    .filter(j => j.finishedAt && j.createdAt)
    .reduce((acc, j) => acc + Math.round(((j.finishedAt as number) - j.createdAt) / 1000), 0);
  const avgSeconds = succeeded > 0 ? Math.round(totalSeconds / succeeded) : 0;

  function clearAll() {
    if (!confirm("确定清空所有记录？")) return;
    localStorage.removeItem(STORAGE_KEY);
    setJobs([]);
    setSelected(null);
  }

  function removeJob(taskId: string) {
    if (!confirm("删除这条记录？")) return;
    const next = jobs.filter(j => j.taskId !== taskId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setJobs(next);
    if (selected?.taskId === taskId) setSelected(null);
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAFAF7]/80 border-b border-black/5">
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
            大脉
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/generate" className="text-sm text-[#FF6B35] hover:text-[#E55A2B] transition">
              + 生成新视频
            </Link>
            <Link href="/" className="text-sm text-[#1D1D1F]/60 hover:text-[#1D1D1F] transition">
              ← 返回首页
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
              视频库
            </h1>
            <p className="mt-3 text-lg text-[#1D1D1F]/60">
              所有生成过的视频 · 都在本地浏览器里
            </p>
          </div>
          {jobs.length > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-[#1D1D1F]/40 hover:text-red-600 transition"
            >
              清空记录
            </button>
          )}
        </div>

        {/* 数据看板 */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="总任务" value={total} />
          <Stat label="成功率" value={`${successRate}%`} accent={successRate >= 80 ? "good" : "warn"} />
          <Stat label="本月生成" value={thisMonth} />
          <Stat label="平均耗时" value={avgSeconds > 0 ? formatDuration(avgSeconds) : "-"} />
        </div>

        {/* 筛选 */}
        {jobs.length > 0 && (
          <div className="mt-8 flex items-center gap-2">
            {[
              { id: "all", label: `全部 ${total}` },
              { id: "succeeded", label: `成功 ${succeeded}` },
              { id: "failed", label: `失败 ${failed}` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  filter === f.id
                    ? "bg-[#1D1D1F] text-white"
                    : "bg-white border border-black/10 text-[#1D1D1F]/60 hover:border-black/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* 视频网格 */}
        {filtered.length === 0 ? (
          <EmptyState hasAny={jobs.length > 0} />
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(job => (
              <JobCard
                key={job.taskId}
                job={job}
                onClick={() => setSelected(job)}
                onDelete={() => removeJob(job.taskId)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 详情弹窗 */}
      {selected && <DetailModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string | number;
  accent?: "default" | "good" | "warn";
}) {
  const color =
    accent === "good" ? "text-green-600" : accent === "warn" ? "text-orange-600" : "text-[#1D1D1F]";
  return (
    <div className="p-5 rounded-2xl bg-white border border-black/5">
      <div className="text-sm text-[#1D1D1F]/60">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="mt-12 aspect-[2/1] rounded-3xl bg-gradient-to-br from-stone-100 to-amber-50 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-5xl mb-3">🎬</div>
        {hasAny ? (
          <>
            <p className="text-[#1D1D1F]/60">当前筛选下没有视频</p>
            <p className="mt-1 text-sm text-[#1D1D1F]/40">换个筛选条件看看</p>
          </>
        ) : (
          <>
            <p className="text-[#1D1D1F]/60">还没有生成过视频</p>
            <Link
              href="/generate"
              className="mt-4 inline-block px-6 py-2 rounded-full bg-[#1D1D1F] text-white text-sm hover:bg-black/90 transition"
            >
              去生成第一个 →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function JobCard({
  job,
  onClick,
  onDelete,
}: {
  job: JobRecord;
  onClick: () => void;
  onDelete: () => void;
}) {
  const statusBadge = {
    succeeded: { color: "bg-green-500", text: "成功" },
    failed: { color: "bg-red-500", text: "失败" },
    running: { color: "bg-orange-500", text: "生成中" },
  }[job.status];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-black/5 hover:border-black/20 transition"
    >
      <div className="relative aspect-[9/16] bg-gradient-to-br from-stone-100 to-amber-50">
        {job.status === "succeeded" && job.videoUrl ? (
          <video
            src={job.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={e => (e.currentTarget as HTMLVideoElement).pause()}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl opacity-30">
              {job.status === "failed" ? "❌" : "🎬"}
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-xs text-white">
          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.color}`} />
          {statusBadge.text}
        </div>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-xs text-white">
          {job.duration}s · {job.ratio}
        </div>
      </div>
      <div className="p-3">
        <div className="font-medium text-sm text-[#1D1D1F] truncate">{job.templateName}</div>
        <div className="mt-1 text-xs text-[#1D1D1F]/40 truncate">
          {formatTime(job.createdAt)} · {job.model.includes("seedance-2") ? "Seedance 2.0" : "Seedance 1.0"}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ job, onClose }: { job: JobRecord; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!job.videoUrl) return;
    navigator.clipboard.writeText(job.videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-[#FAFAF7] rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-[#1D1D1F]/40">{formatTime(job.createdAt)}</div>
              <h2 className="mt-1 text-2xl font-semibold text-[#1D1D1F]">{job.templateName}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#1D1D1F]/60"
            >
              ✕
            </button>
          </div>

          {job.status === "succeeded" && job.videoUrl ? (
            <div className="mt-6 aspect-[9/16] max-h-[60vh] mx-auto rounded-2xl overflow-hidden bg-black">
              <video
                src={job.videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="mt-6 aspect-video rounded-2xl bg-red-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-2">❌</div>
                <p className="text-sm text-red-700 px-6">{job.error || "生成失败"}</p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Meta label="模板" value={job.templateName} />
            <Meta label="模型" value={job.model.includes("seedance-2") ? "Seedance 2.0" : "Seedance 1.0"} />
            <Meta label="时长" value={`${job.duration}s`} />
            <Meta label="比例" value={job.ratio} />
          </div>

          <div className="mt-4">
            <div className="text-sm text-[#1D1D1F]/60 mb-2">文案</div>
            <div className="p-4 rounded-2xl bg-white border border-black/5 text-sm text-[#1D1D1F]/80 leading-relaxed">
              {job.text}
            </div>
          </div>

          {job.status === "succeeded" && job.videoUrl && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={job.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 text-center rounded-full bg-[#1D1D1F] text-white text-sm font-medium hover:bg-black/90 transition"
              >
                ⬇️ 下载视频
              </a>
              <button
                onClick={copyLink}
                className="flex-1 py-3 rounded-full bg-white border border-black/10 text-sm text-[#1D1D1F] hover:border-black/20 transition"
              >
                {copied ? "✓ 已复制" : "🔗 复制链接"}
              </button>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-[#1D1D1F]/40">
            Task ID: {job.taskId}
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-black/5">
      <div className="text-xs text-[#1D1D1F]/40">{label}</div>
      <div className="mt-0.5 text-sm text-[#1D1D1F] truncate">{value}</div>
    </div>
  );
}
