import { createClient } from "@supabase/supabase-js";

// ⚠ 서버(API Route)에서만 import 하세요. service_role 키는 모든 보안 규칙(RLS)을 무시하는 강력한 키라서
// 브라우저 코드에 들어가면 절대 안 돼요. 확인 질문의 정답처럼 "브라우저로 내려가면 안 되는 값"을 읽을 때만 써요.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("no-service-key");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
