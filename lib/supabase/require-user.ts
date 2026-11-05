import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그인이 필요한 화면 맨 위에서 부르면 돼요. 로그인 안 했으면 로그인 화면으로 보내고,
// 로그인하면 원래 화면(next)으로 돌아와요.
//   const user = await requireUser("/found");
export async function requireUser(next: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return data.user;
}
