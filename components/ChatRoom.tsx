"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { koTime } from "@/lib/items";

type Message = { id: number; sender_id: string; content: string; created_at: string };

// 쪽지 대화. 새 쪽지는 Supabase Realtime으로 바로 나타나요. (연결이 안 되면 몇 초마다 새로 불러와요)
export default function ChatRoom({
  conversationId,
  meId,
  initial,
  otherName,
  readOnly,
}: {
  conversationId: number;
  meId: string;
  initial: Message[];
  otherName: string;
  readOnly: boolean;
}) {
  const [msgs, setMsgs] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const live = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  const merge = (incoming: Message[]) =>
    setMsgs((cur) => {
      const seen = new Set(cur.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      return add.length ? [...cur, ...add].sort((a, b) => a.id - b.id) : cur;
    });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => merge([payload.new as Message]),
      )
      .subscribe((status) => {
        live.current = status === "SUBSCRIBED";
      });

    // 실시간 연결이 안 될 때를 위한 보험: 연결이 없으면 6초마다 새로 불러오기
    const poll = setInterval(async () => {
      if (live.current) return;
      const { data } = await supabase
        .from("messages")
        .select("id,sender_id,content,created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) merge(data);
    }, 6000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    const { data, error: err } = await createClient()
      .from("messages")
      .insert({ conversation_id: conversationId, content })
      .select("id,sender_id,content,created_at")
      .single();
    if (err || !data) {
      setError("쪽지를 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } else {
      merge([data as Message]); // 실시간 알림보다 먼저 내 화면에 보여줘요 (같은 쪽지는 한 번만 들어가요)
      setText("");
    }
    setSending(false);
  };

  return (
    <div className="chat">
      <div id="msgs" role="log" aria-live="polite" aria-label="쪽지 대화">
        {msgs.length === 0 && <p className="note" style={{ margin: 0 }}>아직 쪽지가 없어요. {otherName}님께 먼저 인사를 남겨 보세요.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`m ${mine ? "me" : "peer"}`} data-who={otherName}>
              <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
              <div className="note" style={{ fontSize: 11 }}>{koTime(m.created_at)}</div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {readOnly ? (
        <p className="note" style={{ margin: 0 }}>반환이 끝난 물건이라 새 쪽지는 보낼 수 없어요. 글쓴이가 ‘다시 보관 중으로’ 바꾸면 다시 이야기할 수 있어요.</p>
      ) : (
        <>
          {error && <p className="ferr" role="alert">{error}</p>}
          <form className="inbar" onSubmit={send}>
            <input type="text" value={text} maxLength={500} placeholder="쪽지를 입력하세요" onChange={(e) => setText(e.target.value)} aria-label="쪽지 내용" disabled={sending} />
            <button className="pill" type="submit" disabled={sending || !text.trim()}>{sending ? "보내는 중…" : "보내기"}</button>
          </form>
        </>
      )}
    </div>
  );
}
