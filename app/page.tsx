"use client";

import { useState } from "react";
import Link from "next/link";

type Video = {
  id: string;
  title: string;
  author: string;
  avatar: string;
  likes: number;
  views: number;
  category: "全部" | "老板出镜" | "交付案例" | "产品展示" | "节日促销";
  gradient: string;
};

const VIDEOS: Video[] = [
  { id: "v1", title: "杭州李总，180㎡现代奶油风落地", author: "顾家·城北", avatar: "顾", likes: 248, views: 1820, category: "交付案例", gradient: "from-amber-200 via-orange-200 to-rose-200" },
  { id: "v2", title: "老板出镜：这款沙发为什么卖爆了", author: "芝华仕·萧山", avatar: "芝", likes: 196, views: 1430, category: "老板出镜", gradient: "from-stone-200 via-stone-100 to-amber-100" },
  { id: "v3", title: "618 客厅焕新套餐，限时 5999", author: "林氏木业", avatar: "林", likes: 412, views: 3210, category: "节日促销", gradient: "from-rose-200 via-amber-100 to-yellow-100" },
  { id: "v4", title: "客户家实拍：89㎡老房改奶油风", author: "源氏木语·滨江", avatar: "源", likes: 156, views: 980, category: "交付案例", gradient: "from-amber-100 via-orange-100 to-stone-200" },
  { id: "v5", title: "老板讲床垫：5 招选对不踩坑", author: "喜临门·临平", avatar: "喜", likes: 89, views: 720, category: "老板出镜", gradient: "from-stone-100 via-amber-50 to-rose-100" },
  { id: "v6", title: "极简茶几，胡桃木真皮高端款", author: "造作·西湖", avatar: "造", likes: 234, views: 1690, category: "产品展示", gradient: "from-stone-200 via-amber-100 to-orange-100" },
  { id: "v7", title: "老客户家：120㎡意式极简毕业照", author: "慕思·钱江", avatar: "慕", likes: 178, views: 1150, category: "交付案例", gradient: "from-rose-100 via-stone-100 to-amber-100" },
  { id: "v8", title: "端午客厅焕新，给家人一个惊喜", author: "全友·下沙", avatar: "全", likes: 67, views: 540, category: "节日促销", gradient: "from-yellow-100 via-amber-100 to-rose-200" },
  { id: "v9", title: "真皮沙发 7 年不过时的秘密", author: "顾家·城北", avatar: "顾", likes: 312, views: 2340, category: "产品展示", gradient: "from-amber-200 via-stone-100 to-yellow-100" },
  { id: "v10", title: "老板走访客户家，听听真实反馈", author: "芝华仕·萧山", avatar: "芝", likes: 145, views: 1080, category: "老板出镜", gradient: "from-stone-200 via-rose-100 to-amber-100" },
  { id: "v11", title: "小户型 12 ㎡卧室改造方案", author: "源氏木语·滨江", avatar: "源", likes: 287, views: 1980, category: "产品展示", gradient: "from-rose-200 via-amber-100 to-stone-100" },
  { id: "v12", title: "客户家毕业：三代同堂的新中式", author: "慕思·钱江", avatar: "慕", likes: 198, views: 1450, category: "交付案例", gradient: "from-amber-100 via-rose-200 to-stone-200" },
];

const CATEGORIES: Video["category"][] = ["全部", "老板出镜", "交付案例", "产品展示", "节日促销"];

const TEMPLATES = [
  { name: "老板出镜讲解", desc: "上传照片+声音，AI 帮你出镜", count: 24, emoji: "👤" },
  { name: "客户家交付", desc: "客户家照片一键变 15 秒短片", count: 18, emoji: "🏠" },
  { name: "产品展示", desc: "产品图自动生成展示视频", count: 32, emoji: "🛋️" },
  { name: "节日促销", desc: "促销文案+素材=营销视频", count: 15, emoji: "🎉" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Video["category"]>("全部");
  const filtered = activeTab === "全部" ? VIDEOS : VIDEOS.filter(v => v.category === activeTab);

  return (
    <div className="min-h-screen">
      {/* 顶部导航 — 苹果极简 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAFAF7]/80 border-b border-black/5">
        <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
              大脉
            </Link>
            <div className="hidden md:flex items-center gap-7 text-sm text-[#1D1D1F]/80">
              <Link href="#discover" className="hover:text-[#1D1D1F] transition">发现</Link>
              <Link href="#generate" className="hover:text-[#1D1D1F] transition">生成</Link>
              <Link href="#templates" className="hover:text-[#1D1D1F] transition">模板</Link>
              <Link href="#asset" className="hover:text-[#1D1D1F] transition">资产</Link>
            </div>
          </div>
          <Link
            href="#generate"
            className="text-sm px-4 py-1.5 rounded-full bg-[#1D1D1F] text-white hover:bg-black/90 transition"
          >
            开始创作
          </Link>
        </nav>
      </header>

      {/* 主视觉 — 苹果风大字号 */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
        <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.05]">
          把每一份素材，<br />
          变成<span className="text-[#FF6B35]">获客</span>的爆款视频。
        </h1>
        <p className="mt-6 text-xl sm:text-2xl text-[#1D1D1F]/60 max-w-2xl mx-auto font-light">
          上传照片 · 选择模板 · 一键生成
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link
            href="#generate"
            className="px-7 py-3 rounded-full bg-[#1D1D1F] text-white text-base font-medium hover:bg-black/90 transition"
          >
            开始创作 →
          </Link>
          <Link
            href="#discover"
            className="px-7 py-3 rounded-full text-[#1D1D1F] text-base font-medium hover:bg-black/5 transition"
          >
            看爆款
          </Link>
        </div>
        <p className="mt-6 text-sm text-[#1D1D1F]/40">
          即梦 · Seedance 2.0 · 可灵 · Vidu · 多模型智能路由
        </p>
      </section>

      {/* 发现页 — 爆款视频 */}
      <section id="discover" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
              爆款作品
            </h2>
            <p className="mt-2 text-base text-[#1D1D1F]/60">
              看看其他经销商用大脉做出了什么
            </p>
          </div>
          <Link href="#" className="text-sm text-[#1D1D1F]/60 hover:text-[#1D1D1F] transition hidden sm:block">
            查看全部 →
          </Link>
        </div>

        {/* Tab 分类 */}
        <div className="flex items-center gap-1 mb-8 border-b border-black/5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2.5 text-sm font-medium transition relative ${
                activeTab === cat
                  ? "text-[#1D1D1F]"
                  : "text-[#1D1D1F]/50 hover:text-[#1D1D1F]/80"
              }`}
            >
              {cat}
              {activeTab === cat && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B35]" />
              )}
            </button>
          ))}
        </div>

        {/* 视频卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>

      {/* 模板区 */}
      <section id="templates" className="bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
              模板库
            </h2>
            <p className="mt-3 text-base text-[#1D1D1F]/60 max-w-xl mx-auto">
              沉淀了行业 89 个脚本模板，新人也能出爆款
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(tpl => (
              <div
                key={tpl.name}
                className="group p-6 rounded-2xl border border-black/5 hover:border-black/10 hover:shadow-sm transition cursor-pointer"
              >
                <div className="text-4xl mb-4">{tpl.emoji}</div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">{tpl.name}</h3>
                <p className="mt-1.5 text-sm text-[#1D1D1F]/60">{tpl.desc}</p>
                <p className="mt-4 text-xs text-[#1D1D1F]/40">{tpl.count} 个模板</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 — 极简 */}
      <footer className="max-w-7xl mx-auto px-6 py-12 text-center text-sm text-[#1D1D1F]/40">
        <p>大脉 · Damai · AI 武装的获客视频工具</p>
        <p className="mt-2 text-xs">© 2026 即客传媒</p>
      </footer>
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <div className="group cursor-pointer">
      {/* 视频缩略图（用渐变占位） */}
      <div className={`relative aspect-[9/16] rounded-2xl bg-gradient-to-br ${video.gradient} overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <svg className="w-5 h-5 text-[#1D1D1F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px]">
          15s
        </div>
      </div>
      {/* 标题区 */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-medium text-[#1D1D1F] line-clamp-2 leading-snug">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center text-[10px] text-white">
            {video.avatar}
          </div>
          <span className="text-xs text-[#1D1D1F]/60">{video.author}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-[#1D1D1F]/40">
          <span>❤ {video.likes}</span>
          <span>👁 {video.views}</span>
        </div>
      </div>
    </div>
  );
}
