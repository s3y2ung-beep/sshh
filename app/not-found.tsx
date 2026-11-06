import Link from "next/link";

// 없는 주소(글 번호가 틀렸거나 지워진 글 등)로 들어왔을 때
export default function NotFound() {
  return (
    <div className="win" style={{ maxWidth: 460, margin: "24px auto 0", width: "100%" }}>
      <div className="tb">
        <span className="t">찾을 수 없음.exe</span>
        <span className="x" aria-hidden="true" />
      </div>
      <div className="wb stack">
        <p style={{ margin: 0 }}>🔍 찾는 화면이 없어요.</p>
        <p className="note" style={{ margin: 0 }}>주소가 바뀌었거나 지워진 글일 수 있어요.</p>
        <div className="btns" style={{ padding: 0 }}>
          <Link className="pill" href="/list">게시글 목록</Link>
          <Link className="pill" href="/">처음으로</Link>
        </div>
      </div>
    </div>
  );
}
