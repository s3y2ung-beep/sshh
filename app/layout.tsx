import type { Metadata, Viewport } from "next";
import DiaryShell from "@/components/DiaryShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "주웠다 찾았다 · AI 분실물 찾기 (시제품)",
  description: "찍으면 써주는 캠퍼스 분실물 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <DiaryShell>{children}</DiaryShell>
        <div id="sheet" />
        <div id="toast" />
      </body>
    </html>
  );
}
