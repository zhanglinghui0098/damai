import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LoginModal from "@/components/LoginModal";

export const metadata: Metadata = {
  title: "大脉 | AI 视频工厂",
  description:
    "AI 让爆款短视频每家都能做。两条产线: 模板 (秒上手) + 画布 (玩花的)。",
  icons: { icon: "/favicon.ico" },
};

import Script from "next/script";

const ARMS_APP_ID = process.env.NEXT_PUBLIC_ARMS_APP_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
      {ARMS_APP_ID ? (
        <Script id="arms-rum" strategy="afterInteractive">
          {`(function(c,b,d,a){c[a]||(c[a]={});c[a].config={pid:"${ARMS_APP_ID}",appType:"web",tag:undefined,behavior:false,useFmp:true,enableSPA:true,env:"prod"};with(b)with(body)with(insertBefore){var e=d.createElement("script");e.async=1;e.src="https://retcode.taobao.com/arms-retcode.1.0.8.min.js";d.getElementsByTagName("head")[0].insertBefore(e,d.getElementsByTagName("script")[0])}})(window,document,document.createElement,"__bl");`}
        </Script>
      ) : null}
        <SiteNav />
        <main style={{ minHeight: "calc(100vh - 200px)" }}>{children}</main>
        <SiteFooter />
        {/* 全局登录 modal — SiteNav 等派发 'damai:auth:open' 事件触发; Suspense 包裹因 LoginModal 用了 useSearchParams (Next.js 14 SSG 要求) */}
        <Suspense fallback={null}>
          <LoginModal />
        </Suspense>
      </body>
    </html>
  );
}