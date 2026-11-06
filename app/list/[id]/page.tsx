import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ITEM_COLUMNS, koDateTime, photoUrl, placeText, type Item } from "@/lib/items";

const stClass: Record<string, string> = { "보관 중": "s1", "연락 중": "s2", "반환 완료": "s3" };

// 게시글 상세 (로그인 없이 볼 수 있어요)
export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("items").select(ITEM_COLUMNS).eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const item = data as Item;

  let author = "익명";
  if (!item.is_anonymous) {
    const { data: p } = await supabase.from("profiles").select("nickname").eq("id", item.author_id).maybeSingle();
    author = p?.nickname ?? "회원";
  }
  const img = photoUrl(item.image_path);
  const facts: [string, string | null][] = [
    ["종류", item.category],
    ["색상", item.color],
    ["브랜드", item.brand],
    ["크기", item.size],
    ["찾은 곳", placeText(item)],
    ["찾은 시간", koDateTime(item.found_at)],
    ["메모", item.location_note],
    ["지금 보관", item.storage_location],
    ["올린 사람", author],
  ];

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/list">← 목록</Link>
        <h2>게시글</h2>
      </div>
      <div className="win" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
        <div className="tb">
          <span className="t">{item.title}</span>
          <span className="x" aria-hidden="true" />
        </div>
        <div className="wb stack">
          <div className="thumb big" style={{ height: "auto", minHeight: 200, maxHeight: 420 }}>
            {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt={item.title} style={{ objectFit: "contain", maxHeight: 420 }} /> : "📦"}
          </div>
          <div className="row">
            <h3 style={{ margin: 0, fontSize: 18, flex: 1 }}>{item.title}</h3>
            <span className={`st ${stClass[item.status] ?? ""}`}>{item.status}</span>
          </div>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>{item.post_text}</p>
          {item.features.length > 0 && (
            <div>
              {item.features.map((f) => (
                <span className="tag" key={f}>#{f}</span>
              ))}
            </div>
          )}
          <dl className="hand" style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 14 }}>
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: "contents" }}>
                <dt style={{ color: "#444" }}>{k}</dt>
                <dd style={{ margin: 0 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="note" style={{ margin: 0 }}>내 물건 같다면 “잃어버렸어요”에서 AI에게 물어봐 주세요. (연락 기능은 5단계에서 붙어요)</p>
        </div>
      </div>
    </>
  );
}
