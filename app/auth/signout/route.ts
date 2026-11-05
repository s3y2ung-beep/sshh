import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 로그아웃: 세션을 지우고 홈으로. (버튼은 POST 폼이라 링크 미리보기로 실수로 로그아웃되지 않아요)
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
