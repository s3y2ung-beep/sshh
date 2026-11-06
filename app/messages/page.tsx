import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { koDateTime, photoUrl, type Status } from "@/lib/items";

const stClass: Record<string, string> = { "보관 중": "s1", "연락 중": "s2", "반환 완료": "s3" };

type Conv = {
  id: number;
  finder_id: string;
  owner_id: string;
  created_at: string;
  items: { id: number; title: string; status: Status; is_anonymous: boolean; image_path: string | null } | null;
};

// 내 쪽지 대화방 목록 (로그인 필요). 대화방은 대화에 참여한 두 사람에게만 보여요(RLS).
export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select("id,finder_id,owner_id,created_at,items(id,title,status,is_anonymous,image_path)")
    .order("created_at", { ascending: false })
    .limit(50);
  const convs = (data ?? []) as unknown as Conv[];

  // 상대방 닉네임 + 마지막 쪽지
  const otherIds = [...new Set(convs.map((c) => (c.finder_id === user.id ? c.owner_id : c.finder_id)))];
  const nick = new Map<string, string>();
  if (otherIds.length) {
    const { data: ps } = await supabase.from("profiles").select("id,nickname").in("id", otherIds);
    (ps ?? []).forEach((p) => nick.set(p.id, p.nickname));
  }
  const last = new Map<number, { content: string; created_at: string }>();
  if (convs.length) {
    const { data: ms } = await supabase
      .from("messages")
      .select("conversation_id,content,created_at")
      .in("conversation_id", convs.map((c) => c.id))
      .order("created_at", { ascending: false })
      .limit(300);
    (ms ?? []).forEach((m) => {
      if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);
    });
  }

  return (
    <>
      <div className="hdr">
        <Link className="back" href="/">← 처음으로</Link>
        <h2>쪽지</h2>
      </div>
      {convs.length === 0 ? (
        <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div className="tb"><span className="t">쪽지함.exe</span><span className="x" aria-hidden="true" /></div>
          <div className="wb stack">
            <p style={{ margin: 0 }}>아직 주고받은 쪽지가 없어요.</p>
            <p className="note" style={{ margin: 0 }}>내 물건 같은 글을 찾으면 글에서 “쪽지 보내기”를 눌러 보세요.</p>
            <Link className="pill sm" href="/lost">🔍 잃어버렸어요</Link>
          </div>
        </div>
      ) : (
        <ul className="files" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {convs.map((c) => {
            const iAmFinder = c.finder_id === user.id;
            const it = c.items;
            // 글쓴이가 익명 글이면 주인에게는 "익명"으로 보여요
            const who = iAmFinder ? nick.get(c.owner_id) ?? "회원" : it?.is_anonymous ? "익명" : nick.get(c.finder_id) ?? "회원";
            const lm = last.get(c.id);
            const img = photoUrl(it?.image_path);
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="row" style={{ padding: "8px 10px", borderBottom: "1px dotted #aaa", textDecoration: "none", color: "#000", minHeight: 64 }}>
                  <div className="thumb" style={{ width: 52, height: 52, fontSize: 26 }}>
                    {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" loading="lazy" /> : "📦"}
                  </div>
                  <div className="sp">
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {who} · {it?.title ?? "삭제된 글"}
                    </div>
                    <div className="note" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lm ? lm.content : "아직 쪽지가 없어요. 인사를 남겨 보세요."}
                    </div>
                    <div className="note">{iAmFinder ? "내가 주운 물건" : "내가 찾는 물건"}{lm ? ` · ${koDateTime(lm.created_at)}` : ""}</div>
                  </div>
                  {it && <span className={`st ${stClass[it.status] ?? ""}`}>{it.status}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
