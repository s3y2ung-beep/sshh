import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(safeNext);

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>로그인</h2>
      </div>
      {error && (
        <div className="bubble warn" style={{ "--t": "'로그인 실패'", marginBottom: 14 } as CSSProperties}>
          로그인이 끝나지 않았어요. 다시 시도해 주세요.
        </div>
      )}
      <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
        <div className="tb">
          <span className="t">로그인.exe</span>
          <span className="x" aria-hidden="true" />
        </div>
        <div className="wb">
          <p style={{ margin: "0 0 12px" }}>
            글을 올리거나 쪽지를 보내려면 로그인이 필요해요.
            <br />
            <span className="note">글 보기, AI 대화, 검색은 로그인 없이 할 수 있어요.</span>
          </p>
          <GoogleLoginButton next={safeNext} />
        </div>
      </div>
    </>
  );
}
