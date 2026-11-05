import PlaceholderPage from "@/components/PlaceholderPage";
import { requireUser } from "@/lib/supabase/require-user";

export default async function Page() {
  await requireUser("/found"); // 글 올리기는 로그인 필요
  return <PlaceholderPage title="주웠어요" step="3단계" />;
}
