import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 구글 로그인이 끝나면 Supabase가 이 주소로 되돌려 보내요. 받은 code를 로그인 세션으로 바꿔 줘요.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 돌아갈 곳은 우리 사이트 안의 주소만 허용 (다른 사이트로 새는 것 방지)
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}
