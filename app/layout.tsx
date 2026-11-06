import type { Metadata, Viewport } from "next";
import AuthChip from "@/components/AuthChip";
import DiaryShell from "@/components/DiaryShell";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "찾아zoom · AI 분실물 찾기 (시제품)",
  description: "찍으면 써주는 캠퍼스 분실물 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  let nickname: string | null = null;
  if (data.user) {
    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", data.user.id).maybeSingle();
    nickname = profile?.nickname ?? "회원";
  }

  // 상단 TODAY(오늘 올라온 글, 한국 시간 기준) / TOTAL(전체 글) 숫자
  const kstDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()); // 2026-11-06
  const [{ count: total }, { count: today }] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }).gte("created_at", `${kstDay}T00:00:00+09:00`),
  ]);

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
        <DiaryShell auth={<AuthChip nickname={nickname} />} today={today ?? 0} total={total ?? 0}>{children}</DiaryShell>
        <div id="sheet" />
        <div id="toast" />
      </body>
    </html>
  );
}
