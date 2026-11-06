"use client";

import Link from "next/link";

// 화면을 그리다가 예상 못한 오류가 났을 때 보여주는 화면
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="win" style={{ maxWidth: 460, margin: "24px auto 0", width: "100%" }} role="alert">
      <div className="tb">
        <span className="t">오류.exe</span>
        <span className="x" aria-hidden="true" />
      </div>
      <div className="wb stack">
        <p style={{ margin: 0 }}>⚠ 앗, 문제가 생겼어요.</p>
        <p className="note" style={{ margin: 0 }}>잠시 뒤에 다시 시도해 보세요. 계속 안 되면 처음 화면으로 돌아가 주세요.</p>
        <div className="btns" style={{ padding: 0 }}>
          <button type="button" className="pill" onClick={reset}>다시 시도</button>
          <Link className="pill" href="/">처음으로</Link>
        </div>
      </div>
    </div>
  );
}
