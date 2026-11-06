import Link from "next/link";
import { notFound } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";
import StatusButtons from "@/components/StatusButtons";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { koDateTime, photoUrl, placeText, type Status } from "@/lib/items";

const stClass: Record<string, string> = { "보관 중": "s1", "연락 중": "s2", "반환 완료": "s3" };

// 쪽지 대화방 (로그인 필요). 대화에 참여한 두 사람만 열 수 있어요 — 아니면 RLS 때문에 "없는 방"으로 보여요.
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,12}$/.test(id)) notFound();
  const user = await requireUser(`/messages/${id}`);
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id,finder_id,owner_id,items(id,title,status,is_anonymous,image_path,building_name,address,floor,room,found_at)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!conv) notFound();
  const it = conv.items as unknown as {
    id: number; title: string; status: Status; is_anonymous: boolean; image_path: string | null;
    building_name: string | null; address: string | null; floor: string | null; room: string | null; found_at: string;
  } | null;
  if (!it) notFound();

  const iAmFinder = conv.finder_id === user.id;
  const otherId = iAmFinder ? conv.owner_id : conv.finder_id;
  let other = "회원";
  if (!iAmFinder && it.is_anonymous) other = "익명";
  else {
    const { data: p } = await supabase.from("profiles").select("nickname").eq("id", otherId).maybeSingle();
    other = p?.nickname ?? "회원";
  }

  const { data: msgs } = await supabase
    .from("messages")
    .select("id,sender_id,content,created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true })
    .limit(200);

  const img = photoUrl(it.image_path);
  return (
    <>
      <div className="hdr">
        <Link className="back" href="/messages">← 쪽지함</Link>
        <h2>{other}님과의 쪽지</h2>
      </div>
      <div className="win" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <div className="tb">
          <span className="t">쪽지.exe</span>
          <span className="x" aria-hidden="true" />
        </div>
        <div className="wb">
          <Link href={`/list/${it.id}`} className="row" style={{ textDecoration: "none", color: "#000", marginBottom: 8 }}>
            <div className="thumb" style={{ width: 52, height: 52, fontSize: 26 }}>
              {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" /> : "📦"}
            </div>
            <div className="sp">
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</div>
              <div className="note" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {placeText(it)} · {koDateTime(it.found_at)}</div>
            </div>
            <span className={`st ${stClass[it.status] ?? ""}`}>{it.status}</span>
          </Link>
          {iAmFinder && (
            <div style={{ marginBottom: 8 }}>
              <StatusButtons itemId={it.id} status={it.status} />
            </div>
          )}
          <ChatRoom conversationId={conv.id} meId={user.id} initial={msgs ?? []} otherName={other} readOnly={it.status === "반환 완료"} />
        </div>
      </div>
    </>
  );
}
