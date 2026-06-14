import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 顶部导航 */}
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
              天
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">天禧派视频创作助手</h1>
              <p className="text-xs text-stone-500">家居行业 AI 视频生成工具</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            P0 · 搭建中
          </span>
        </div>
      </header>

      {/* 主标题区 */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
          把素材变成 15 秒爆款视频
        </h2>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          上传老板照片、门店照片、客户家交付场景 → AI 自动生成抖音/小红书短视频
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-stone-500">
          <span>🤖 即梦 AI</span>
          <span>·</span>
          <span>🎬 Seedance 2.0</span>
          <span>·</span>
          <span>✨ 可灵 AI</span>
          <span>·</span>
          <span>🎥 Vidu</span>
        </div>
      </section>

      {/* 4 个核心模块 */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. 素材库 */}
          <ModuleCard
            status="待开发"
            title="素材库"
            desc="上传老板照片、声音、门店照片、客户家交付案例"
            items={["老板正面照", "老板录音", "门店实景", "交付案例照片", "产品图"]}
            emoji="📸"
          />
          {/* 2. 视频生成 */}
          <ModuleCard
            status="待开发"
            title="视频生成"
            desc="接入多模型 AI 视频生成 API，一键生成 15 秒视频"
            items={["即梦 AI（性价比）", "Seedance 2.0（多镜头）", "可灵 AI（真人出镜）", "Vidu（参考图）", "多模型路由"]}
            emoji="🎬"
            highlight
          />
          {/* 3. 模板库 */}
          <ModuleCard
            status="待开发"
            title="模板库"
            desc="沉淀家居行业 20+ 脚本模板，新人也能出爆款"
            items={["老板出镜讲解", "客户家交付案例", "产品展示", "节日促销", "干货知识"]}
            emoji="📝"
          />
          {/* 4. 效果看板 */}
          <ModuleCard
            status="待开发"
            title="效果看板"
            desc="抖音/小红书发布数据回流，知道哪条视频有效"
            items={["播放/点赞/评论", "留资数据", "进店数据", "成交数据", "模板效果对比"]}
            emoji="📊"
          />
        </div>
      </section>

      {/* 进度区 */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">项目进度</h3>
            <span className="text-sm text-stone-500">0 / 4 模块完成</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2 mb-6">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full" style={{ width: "5%" }}></div>
          </div>
          <div className="space-y-3 text-sm">
            <StepItem done label="项目初始化（Next.js 14 + Tailwind）" time="刚刚" />
            <StepItem label="火山引擎 + 快手 API key 注册" time="今晚你做" />
            <StepItem label="第 1 个视频 API 调通 + 生成测试视频" time="明天" />
            <StepItem label="网站 MVP：上传 → 选模板 → 生成 → 看板" time="本周" />
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-stone-500 border-t border-stone-200 mt-8">
        <p>天禧派 · 城北万象城 · 杭州 · 2000㎡ 软装/家具零售</p>
        <p className="mt-2 text-xs">AI 武装的家居营销服务 · Hermes Agent 构建</p>
      </footer>
    </div>
  );
}

function ModuleCard({
  status,
  title,
  desc,
  items,
  emoji,
  highlight = false,
}: {
  status: string;
  title: string;
  desc: string;
  items: string[];
  emoji: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border transition-all ${
        highlight
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm"
          : "bg-white border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{emoji}</div>
          <h4 className="text-lg font-semibold text-stone-900">{title}</h4>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">
          {status}
        </span>
      </div>
      <p className="text-sm text-stone-600 mb-4">{desc}</p>
      <ul className="space-y-1.5 text-sm text-stone-700">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-amber-600">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepItem({ label, time, done = false }: { label: string; time: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            done ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
          }`}
        >
          {done ? "✓" : "·"}
        </div>
        <span className={done ? "text-stone-900" : "text-stone-700"}>{label}</span>
      </div>
      <span className="text-xs text-stone-500">{time}</span>
    </div>
  );
}
