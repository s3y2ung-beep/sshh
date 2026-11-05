import Link from "next/link";
import HomePopup from "@/components/HomePopup";
import Mascot from "@/components/Mascot";

// 홈: 왼쪽 페이지(마스코트) + 오른쪽 페이지(새 글 · 버튼). 새 글 목록은 DB가 붙는 3단계에서 채워짐.
export default function Home() {
  return (
    <>
      <div className="spreadgrid">
        <div className="pg l">
          <h2 className="title sm" style={{ marginTop: 6 }}>
            찍으면 써주는<br />분실물
          </h2>
          <div className="win">
            <div className="tb">
              <span className="t">오늘의 도우미.exe</span>
              <span className="x" aria-hidden="true" />
            </div>
            <div className="wb center">
              <Mascot />
              <div><span className="mood">TODAY IS.. 🍀 행운</span></div>
              <p className="note" style={{ margin: "8px 0 0" }}>
                한양여자대학교 분실물,<br />AI가 도와줘요
              </p>
            </div>
          </div>
        </div>
        <div className="pg r">
          <div className="news">
            <div className="nh">Updated news</div>
            <p className="note" style={{ padding: "12px 10px", margin: 0 }}>아직 등록된 글이 없어요.</p>
          </div>
          <div className="stack">
            <Link className="pill" href="/found"><span>📸 주웠어요</span><span className="ar">➜</span></Link>
            <Link className="pill" href="/lost"><span>🔍 잃어버렸어요</span><span className="ar">➜</span></Link>
            <Link className="pill light" href="/list"><span>📋 게시글 목록</span><span className="ar">➜</span></Link>
          </div>
        </div>
      </div>
      <HomePopup />
    </>
  );
}
