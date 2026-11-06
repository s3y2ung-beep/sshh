import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, ITEM_COLUMNS, STATUSES, koDateTime, photoUrl, placeText, type Item } from "@/lib/items";

const stClass: Record<string, string> = { "보관 중": "s1", "연락 중": "s2", "반환 완료": "s3" };

type Params = { status?: string; cat?: string; q?: string };

// 주소(링크) 만들기: 지금 검색 조건을 유지하면서 일부만 바꿔요
const href = (p: Params) => {
  const s = new URLSearchParams();
  if (p.q) s.set("q", p.q);
  if (p.cat) s.set("cat", p.cat);
  if (p.status) s.set("status", p.status);
  const qs = s.toString();
  return qs ? `/list?${qs}` : "/list";
};

// 게시글 목록 + 직접 검색 (로그인 없이 볼 수 있어요).
// 기본은 반환 완료를 뺀 전체, "반환 완료" 필터에서만 반환된 글이 보여요.
export default async function ListPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "";
  const cat = (CATEGORIES as readonly string[]).includes(sp.cat ?? "") ? sp.cat! : "";
  // 검색어: 필터 문법을 깨는 특수문자는 공백으로 바꿔요
  const q = (sp.q ?? "").replace(/[%,()*{}"\\:]/g, " ").replace(/\s+/g, " ").trim().slice(0, 30);

  const supabase = await createClient();
  let query = supabase.from("items").select(ITEM_COLUMNS).order("created_at", { ascending: false }).limit(100);
  query = status ? query.eq("status", status) : query.neq("status", "반환 완료");
  if (cat) query = query.eq("category", cat);
  if (q) {
    const like = ["title", "post_text", "brand", "color", "size", "building_name", "address", "location_note", "category"]
      .map((c) => `${c}.ilike.%${q}%`)
      .join(",");
    query = query.or(`${like},features.cs.{${q}}`);
  }
  const { data, error } = await query;
  const items = (data ?? []) as Item[];
  const filtered = !!(q || cat || status);

  const chipStyle = { display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#000" } as const;

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>게시글 목록</h2>
      </div>

      <form action="/list" method="get" className="inbar" style={{ position: "static", marginBottom: 10 }} role="search">
        <input type="text" name="q" defaultValue={q} maxLength={30} placeholder="물건·색·브랜드·장소로 검색 (예: 에어팟, 도서관)" aria-label="글 검색" />
        {cat && <input type="hidden" name="cat" value={cat} />}
        {status && <input type="hidden" name="status" value={status} />}
        <button className="pill" type="submit">검색</button>
      </form>

      <nav className="chips" aria-label="종류 필터" style={{ marginBottom: 8 }}>
        <Link className={`chip${cat === "" ? " on" : ""}`} href={href({ q, status })} style={chipStyle}>모든 종류</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} className={`chip${c === cat ? " on" : ""}`} href={href({ q, status, cat: c })} style={chipStyle}>{c}</Link>
        ))}
      </nav>
      <nav className="chips" aria-label="상태 필터" style={{ marginBottom: 12 }}>
        {[{ key: "", label: "전체" }, ...STATUSES.map((s) => ({ key: s, label: s }))].map((f) => (
          <Link key={f.key} className={`chip${f.key === status ? " on" : ""}`} href={href({ q, cat, status: f.key })} style={chipStyle}>{f.label}</Link>
        ))}
      </nav>

      {error ? (
        <div className="bubble warn" style={{ "--t": "'오류'" } as React.CSSProperties}>
          글을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.
        </div>
      ) : items.length === 0 ? (
        <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div className="tb"><span className="t">게시글.exe</span><span className="x" aria-hidden="true" /></div>
          <div className="wb stack">
            <p style={{ margin: 0 }}>{filtered ? "조건에 맞는 글이 없어요." : "아직 등록된 글이 없어요."}</p>
            {filtered && <Link className="pill sm" href="/list">조건 모두 지우기</Link>}
            <Link className="pill sm" href="/lost">🔍 AI에게 물어보기</Link>
          </div>
        </div>
      ) : (
        <>
          {filtered && <p className="note" style={{ margin: "0 0 6px" }}>{items.length}개의 글을 찾았어요{items.length >= 100 ? " (최신 100개까지)" : ""}.</p>}
          <ul className="files" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((i) => {
              const img = photoUrl(i.image_path);
              return (
                <li key={i.id}>
                  <Link href={`/list/${i.id}`} className="row" style={{ padding: "8px 10px", borderBottom: "1px dotted #aaa", textDecoration: "none", color: "#000", minHeight: 64 }}>
                    <div className="thumb" style={{ width: 52, height: 52, fontSize: 26 }}>
                      {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" loading="lazy" /> : "📦"}
                    </div>
                    <div className="sp">
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</div>
                      <div className="note" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {placeText(i)}</div>
                      <div className="note">🕒 {koDateTime(i.found_at)}</div>
                    </div>
                    <span className={`st ${stClass[i.status] ?? ""}`}>{i.status}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
