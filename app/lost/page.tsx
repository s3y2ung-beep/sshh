import Link from "next/link";
import LostChat from "@/components/LostChat";

// 잃어버렸어요: AI와 대화하면 등록된 글 중에서 후보를 찾아 줘요 (로그인 없이 가능)
export default function Page() {
  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>잃어버렸어요</h2>
      </div>
      <LostChat />
    </>
  );
}
