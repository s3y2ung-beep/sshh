import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(next);

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>로그인</h2>
      </div>
      <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
        <div className="tb">
          <span className="t">로그인.exe</span>
          <span className="x" aria-hidden="true" />
        </div>
        <div className="wb">
          {next !== "/" && (
            <p className="note" style={{ margin: "0 0 12px" }}>이 기능은 로그인이 필요해요. 로그인하면 원래 화면으로 돌아가요.</p>
          )}
          <LoginForm next={next} />
        </div>
      </div>
    </>
  );
}
