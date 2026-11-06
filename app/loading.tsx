// 화면이 바뀌는 동안(서버에서 글을 불러오는 동안) 보여주는 화면
export default function Loading() {
  return (
    <div className="win" style={{ maxWidth: 460, margin: "24px auto 0", width: "100%" }} role="status" aria-live="polite">
      <div className="tb">
        <span className="t">불러오는 중.exe</span>
        <span className="x" aria-hidden="true" />
      </div>
      <div className="wb stack">
        <p style={{ margin: 0 }}>불러오는 중이에요…</p>
        <div className="spin" aria-hidden="true" />
      </div>
    </div>
  );
}
