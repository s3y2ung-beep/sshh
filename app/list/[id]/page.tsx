import Link from "next/link";
import { notFound } from "next/navigation";
import ContactButton from "@/components/ContactButton";
import StatusButtons from "@/components/StatusButtons";
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
  // 지금 보는 사람이 누구인지에 따라 아래 버튼이 달라져요
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id ?? null;
  const isAuthor = me === item.author_id;
  let myConv: number | null = null; // 내(주인)가 이미 만든 대화방
  let convs: { id: number }[] = []; // 글쓴이가 받은 대화방들
  if (me) {
    if (isAuthor) {
      const { data: cs } = await supabase.from("conversations").select("id").eq("item_id", item.id).order("created_at");
      convs = cs ?? [];
    } else {
      const { data: c } = await supabase.from("conversations").select("id").eq("item_id", item.id).eq("owner_id", me).maybeSingle();
      myConv = c?.id ?? null;
    }
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
          {isAuthor ? (
            <div className="stack" style={{ gap: 8 }}>
              <p className="note" style={{ margin: 0 }}>내가 올린 글이에요. 주인에게 돌려주면 상태를 바꿔 주세요.</p>
              <StatusButtons itemId={item.id} status={item.status} />
              {convs.length > 0 ? (
                <div className="chips">
                  {convs.map((c, n) => (
                    <Link key={c.id} className="chip" href={`/messages/${c.id}`} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", color: "#000" }}>
                      💌 받은 쪽지 {convs.length > 1 ? n + 1 : ""}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="note" style={{ margin: 0 }}>아직 받은 쪽지가 없어요.</p>
              )}
            </div>
          ) : item.status === "반환 완료" ? (
            <p className="note" style={{ margin: 0 }}>이미 주인에게 돌아간 물건이에요.</p>
          ) : myConv ? (
            <Link className="pill" href={`/messages/${myConv}`}><span>💌 쪽지 대화 이어가기</span><span className="ar">➜</span></Link>
          ) : me ? (
            <ContactButton itemId={item.id} question={item.verify_question} />
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              <Link className="pill" href={`/login?next=${encodeURIComponent(`/list/${item.id}`)}`}><span>🔑 로그인하고 쪽지 보내기</span><span className="ar">➜</span></Link>
              <p className="note" style={{ margin: 0 }}>내 물건 같다면 로그인하고 글쓴이에게 쪽지를 보내 보세요. 로그인 없이는 “잃어버렸어요”에서 AI에게 물어볼 수 있어요.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
