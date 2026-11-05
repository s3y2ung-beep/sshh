import type { CSSProperties } from "react";
import Link from "next/link";

// 아직 만들지 않은 화면의 자리. 해당 단계에서 진짜 화면으로 바뀜.
export default function PlaceholderPage({ title, step }: { title: string; step: string }) {
  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>{title}</h2>
      </div>
      <div className="bubble warn" style={{ "--t": "'준비 중'" } as CSSProperties}>
        이 화면은 개발 {step}에서 만들어요.
      </div>
    </>
  );
}
