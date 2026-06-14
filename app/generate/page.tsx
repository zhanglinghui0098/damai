"use client";

import { useState } from "react";
import Link from "next/link";

type Template = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  prompt: string;
};

type Job = {
  taskId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  videoUrl?: string;
  error?: string;
  elapsed?: number;
};

const TEMPLATES: Template[] = [
  {
    id: "owner",
    name: "老板出镜讲解",
    desc: "上传照片+声音，AI 帮你出镜",
    emoji: "👤",
    prompt:
      "第一人称视角，一位家居门店老板站在现代客厅中央，自然地介绍一款主推沙发，背景是轻奢样板间，语气亲切真实。",
  },
  {
    id: "delivery",
    name: "客户家交付",
    desc: "客户家照片一键变 15 秒短片",
    emoji: "🏠",
    prompt:
      "第一人称视角，走进一户刚交付的样板间，依次展示客厅、餐厅、卧室的成品效果，配舒缓音乐，结尾定焦于全家福。",
  },
  {
    id: "product",
    name: "产品展示",
    desc: "产品图自动生成展示视频",
    emoji: "🛋️",
    prompt:
      "特写镜头环绕一款真皮沙发 360 度展示，灯光柔和，背景是极简客厅，最后 2 秒拉远展示整体空间。",
  },
  {
    id: "festival",
    name: "节日促销",
    desc: "促销文案+素材=营销视频",
    emoji: "🎉",
    prompt:
      "快节奏节日促销广告，开门见山展示优惠套餐，叠加红包特效，最后 2 秒显示门店地址和联系方式。",
  },
];

const MODELS = [
  { id: "doubao-seedance-2-0-260128", name: "Seedance 2.0（推荐）", desc: "火山方舟最新版，11s 视频" },
  { id: "doubao-seedance-1-0-pro-250528", name: "Seedance 1.0 Pro", desc: "稳定版本，5-10s 视频" },
];

export default function GeneratePage() {
  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [text, setText] = useState<string>(TEMPLATES[0].prompt);
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [duration, setDuration] = useState<number>(11);
  const [ratio, setRatio] = useState<string>("9:16");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");

  const [job, setJob] = useState<Job | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);

  function pickTemplate(t: Template) {
    setTemplate(t);
    setText(t.prompt);
  }

  async function startGenerate() {
    if (submitting || polling) return;
    setSubmitting(true);
    setJob(null);

    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          text,
          image_urls: imageUrl ? [imageUrl] : [],
          audio_urls: audioUrl ? [audioUrl] : [],
          ratio,
          duration,
        }),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({ error: r.statusText }));
        throw new Error(err.error || `HTTP ${r.status}`);
      }

      const { task_id } = await r.json();
      setJob({ taskId: task_id, status: "queued" });
      setSubmitting(false);
      setPolling(true);
      pollTask(task_id);
    } catch (e: any) {
      setJob({ taskId: "", status: "failed", error: e.message });
      setSubmitting(false);
    }
  }

  async function pollTask(taskId: string) {
    const start = Date.now();
    const tick = async () => {
      try {
        const r = await fetch(`/api/poll/${taskId}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        const elapsed = Math.round((Date.now() - start) / 1000);

        if (data.status === "succeeded") {
          setJob({
            taskId,
            status: "succeeded",
            videoUrl: data.video_url,
            elapsed,
          });
          setPolling(false);
          return;
        }
        if (data.status === "failed" || data.status === "cancelled") {
          setJob({
            taskId,
            status: "failed",
            error: data.error || "生成失败",
            elapsed,
          });
          setPolling(false);
          return;
        }
        // 还在跑
        setJob({ taskId, status: data.status === "queued" ? "queued" : "running", elapsed });
        setTimeout(tick, 3000);
      } catch (e: any) {
        setJob({ taskId, status: "failed", error: e.message });
        setPolling(false);
      }
    };
    tick();
  }

  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAFAF7]/80 border-b border-black/5">
        <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
            大脉
          </Link>
          <Link href="/" className="text-sm text-[#1D1D1F]/60 hover:text-[#1D1D1F] transition">
            ← 返回首页
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
          生成视频
        </h1>
        <p className="mt-3 text-lg text-[#1D1D1F]/60">
          选模板 · 填素材 · 一键生成
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左：表单 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 模板 */}
            <Section title="第 1 步 · 选模板">
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => pickTemplate(t)}
                    className={`text-left p-4 rounded-2xl border transition ${
                      template.id === t.id
                        ? "border-[#FF6B35] bg-orange-50/50"
                        : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="text-3xl">{t.emoji}</div>
                    <div className="mt-2 font-medium text-[#1D1D1F]">{t.name}</div>
                    <div className="mt-1 text-sm text-[#1D1D1F]/60">{t.desc}</div>
                  </button>
                ))}
              </div>
            </Section>

            {/* 素材 */}
            <Section title="第 2 步 · 素材（可选）">
              <div className="space-y-3">
                <Field
                  label="📷 参考图 URL（老板照 / 客户家 / 场景）"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://...  （空着也行）"
                />
                <Field
                  label="🎤 参考音 URL（老板声音）"
                  value={audioUrl}
                  onChange={setAudioUrl}
                  placeholder="https://...  （空着也行）"
                />
                <p className="text-xs text-[#1D1D1F]/40">
                  留空 = 纯文字生成；填了 = 多模态参考，效果更可控
                </p>
              </div>
            </Section>

            {/* 文案 */}
            <Section title="第 3 步 · 文案">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                className="w-full p-4 rounded-2xl border border-black/10 focus:border-[#FF6B35] focus:outline-none text-sm leading-relaxed"
                placeholder="描述你想要的视频内容..."
              />
              <p className="mt-2 text-xs text-[#1D1D1F]/40">
                选模板时会自动填好示例文案，你按需改
              </p>
            </Section>

            {/* 高级选项 */}
            <Section title="高级选项" collapsible defaultOpen={false}>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-[#1D1D1F]/60">视频模型</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="mt-1 w-full p-3 rounded-xl border border-black/10 bg-white text-sm"
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.desc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-[#1D1D1F]/60">时长</label>
                    <select
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="mt-1 w-full p-3 rounded-xl border border-black/10 bg-white text-sm"
                    >
                      <option value={5}>5 秒</option>
                      <option value={10}>10 秒</option>
                      <option value={11}>11 秒（推荐）</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#1D1D1F]/60">比例</label>
                    <select
                      value={ratio}
                      onChange={e => setRatio(e.target.value)}
                      className="mt-1 w-full p-3 rounded-xl border border-black/10 bg-white text-sm"
                    >
                      <option value="9:16">9:16 抖音</option>
                      <option value="16:9">16:9 横屏</option>
                      <option value="1:1">1:1 朋友圈</option>
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* 提交按钮 */}
            <button
              onClick={startGenerate}
              disabled={submitting || polling || !text.trim()}
              className="w-full py-4 rounded-full bg-[#1D1D1F] text-white text-base font-medium hover:bg-black/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "提交中..." : polling ? "生成中..." : "生成视频 →"}
            </button>
            <p className="text-center text-xs text-[#1D1D1F]/40">
              预计 30-90 秒 · 成本 0.5-1 元
            </p>
          </div>

          {/* 右：结果 */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <h2 className="text-sm font-medium text-[#1D1D1F]/60 mb-3">生成结果</h2>
              <ResultPanel job={job} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#1D1D1F]">{title}</h2>
        {collapsible && (
          <button
            onClick={() => setOpen(!open)}
            className="text-sm text-[#1D1D1F]/40 hover:text-[#1D1D1F]"
          >
            {open ? "收起 ▲" : "展开 ▼"}
          </button>
        )}
      </div>
      {open && children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm text-[#1D1D1F]/60">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full p-3 rounded-xl border border-black/10 focus:border-[#FF6B35] focus:outline-none text-sm"
      />
    </div>
  );
}

function ResultPanel({ job }: { job: Job | null }) {
  if (!job) {
    return (
      <div className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-stone-100 to-amber-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl mb-2">🎬</div>
          <p className="text-sm text-[#1D1D1F]/40">填好左侧表单<br />点"生成"开始</p>
        </div>
      </div>
    );
  }

  if (job.status === "failed") {
    return (
      <div className="aspect-[9/16] rounded-2xl bg-red-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">❌</div>
          <p className="text-sm text-red-700">{job.error}</p>
        </div>
      </div>
    );
  }

  if (job.status === "succeeded" && job.videoUrl) {
    return (
      <div className="space-y-3">
        <div className="aspect-[9/16] rounded-2xl overflow-hidden bg-black">
          <video
            src={job.videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-cover"
          />
        </div>
        <a
          href={job.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-2.5 text-center rounded-full border border-black/10 hover:bg-black/5 text-sm"
        >
          ⬇️ 下载视频
        </a>
        <p className="text-center text-xs text-[#1D1D1F]/40">
          耗时 {job.elapsed}s
        </p>
      </div>
    );
  }

  // 排队 / 生成中
  return (
    <div className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-orange-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-[#1D1D1F]">
          {job.status === "queued" ? "排队中..." : "生成中..."}
        </p>
        <p className="mt-1 text-xs text-[#1D1D1F]/40">已等待 {job.elapsed ?? 0}s</p>
        <p className="mt-1 text-xs text-[#1D1D1F]/40">通常 30-90 秒</p>
      </div>
    </div>
  );
}
