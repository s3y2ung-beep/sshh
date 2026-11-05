import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/AuthForms";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(next);

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>회원가입</h2>
      </div>
      <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
        <div className="tb">
          <span className="t">회원가입.exe</span>
          <span className="x" aria-hidden="true" />
        </div>
        <div className="wb">
          <SignupForm next={next} />
        </div>
      </div>
    </>
  );
}
