import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大脉 — 把素材变成获客的爆款视频",
  description: "大脉是 AI 武装的获客视频工具，让每一份素材都成为获客的爆款。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-[#FAFAF7] text-[#1D1D1F] font-sans selection:bg-orange-100">
        {children}
      </body>
    </html>
  );
}
