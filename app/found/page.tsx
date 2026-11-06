import Link from "next/link";
import FoundFlow from "@/components/FoundFlow";
import { requireUser } from "@/lib/supabase/require-user";

export default async function Page() {
  await requireUser("/found"); // 글 올리기는 로그인 필요
  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>주웠어요</h2>
      </div>
      <FoundFlow />
    </>
  );
}
