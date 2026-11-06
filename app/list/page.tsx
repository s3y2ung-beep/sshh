import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ITEM_COLUMNS, STATUSES, koDateTime, photoUrl, placeText, type Item } from "@/lib/items";

const FILTERS = [{ key: "", label: "전체" }, ...STATUSES.map((s) => ({ key: s, label: s }))];
const stClass: Record<string, string> = { "보관 중": "s1", "연락 중": "s2", "반환 완료": "s3" };

// 게시글 목록 (로그인 없이 볼 수 있어요). 기본은 반환 완료를 뺀 전체, "반환 완료" 필터에서만 반환된 글이 보여요.
export default async function ListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "";

  const supabase = await createClient();
  let q = supabase.from("items").select(ITEM_COLUMNS).order("created_at", { ascending: false }).limit(100);
  q = status ? q.eq("status", status) : q.neq("status", "반환 완료");
  const { data, error } = await q;
  const items = (data ?? []) as Item[];

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>게시글 목록</h2>
      </div>

      <nav className="chips" aria-label="상태 필터" style={{ marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <Link key={f.key} className={`chip${f.key === status ? " on" : ""}`} href={f.key ? `/list?status=${encodeURIComponent(f.key)}` : "/list"} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#000" }}>
            {f.label}
          </Link>
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
            <p style={{ margin: 0 }}>{status ? `“${status}” 상태의 글이 아직 없어요.` : "아직 등록된 글이 없어요."}</p>
            <Link className="pill sm" href="/found">📸 주웠어요 올리기</Link>
          </div>
        </div>
      ) : (
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
      )}
    </>
  );
}
