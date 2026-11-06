"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { photoUrl } from "@/lib/items";

type Cand = { id: number; title: string; place: string; time: string; image_path: string | null; reason: string };
type Msg = { role: "ai" | "me"; text: string; cands?: Cand[]; answered?: boolean; guide?: boolean };

const HELLO: Msg = {
  role: "ai",
  text: "안녕하세요! 어떤 물건을 잃어버리셨나요? 종류, 색깔, 잃어버린 장소나 시간을 편하게 말씀해 주세요.",
};
const MAX_FAILS = 2; // 이 횟수만큼 "아니에요"가 나오면 직접 검색으로 안내해요

// 분실물 주인 ↔ AI 대화창 (로그인 없이 사용)
export default function LostChat() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const rejected = useRef<number[]>([]);
  const fails = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...msgs, { role: "me", text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/lost/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 대화 내용(말풍선 글)만 보내요. 후보 카드는 보내지 않아요
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role === "me" ? "user" : "assistant", content: m.text })),
          rejected: rejected.current,
        }),
      });
      const j = (await r.json()) as { error?: string; reply?: string; candidates?: Cand[]; noMatch?: boolean };
      if (!r.ok) throw new Error(j.error);
      if (j.noMatch) {
        setMsgs((m) => [
          ...m,
          { role: "ai", text: "아직 비슷한 글을 찾지 못했어요. 새 글이 계속 올라오니 ‘게시글 목록’에서 직접 살펴보시거나, 다른 특징을 더 알려 주세요.", guide: true },
        ]);
      } else {
        setMsgs((m) => [...m, { role: "ai", text: j.reply ?? "", cands: j.candidates?.length ? j.candidates : undefined }]);
      }
    } catch (err) {
      setMsgs((m) => [
        ...m,
        { role: "ai", text: err instanceof Error && err.message ? err.message : "AI와 연결하지 못했어요. 인터넷을 확인하고 다시 보내 주세요." },
      ]);
    }
    setLoading(false);
  };

  // [아니에요]: 보여준 후보는 제외하고, 추가 질문 → 다시 검색. 2회 실패하면 직접 검색 안내
  const no = (index: number) => {
    const cands = msgs[index].cands ?? [];
    rejected.current = [...rejected.current, ...cands.map((c) => c.id)];
    fails.current += 1;
    const answered = msgs.map((m, i) => (i === index ? { ...m, answered: true } : m));
    if (fails.current >= MAX_FAILS) {
      setMsgs([
        ...answered,
        { role: "ai", text: "찾는 물건이 아직 없나 봐요. 직접 목록에서 찾아보시는 게 빠를 수 있어요. 새 글이 올라오면 다시 물어봐 주세요!", guide: true },
      ]);
    } else {
      setMsgs([
        ...answered,
        { role: "ai", text: "앗, 아니었군요. 어떤 점이 달랐나요? 기억나는 특징(색, 모양, 스티커, 흠집 등)을 더 알려 주세요." },
      ]);
    }
  };

  return (
    <div className="win" style={{ maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div className="tb">
        <span className="t">AI도우미 메신저.exe</span>
        <span className="x" aria-hidden="true" />
      </div>
      <div className="wb chat">
        <div id="msgs" role="log" aria-live="polite" aria-label="AI와의 대화">
          {msgs.map((m, i) => (
            <div key={i} className={`m ${m.role}`}>
              {m.text}
              {m.cands && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                  {m.cands.map((c) => {
                    const img = photoUrl(c.image_path);
                    return (
                      <div key={c.id} className="win" style={{ textAlign: "left" }}>
                        <div className="wb" style={{ padding: 10 }}>
                          <div className="row" style={{ alignItems: "flex-start" }}>
                            <div className="thumb" style={{ width: 92, height: 92 }} title="개인 정보 보호를 위해 사진을 흐리게 보여줘요">
                              {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="blur" src={img} alt="흐리게 처리된 사진" loading="lazy" /> : "📦"}
                            </div>
                            <div className="sp">
                              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{c.title}</h3>
                              <div className="note">📍 {c.place}</div>
                              <div className="note">🕒 {c.time}</div>
                              {c.reason && <div style={{ fontSize: 13, marginTop: 4 }}>💡 {c.reason}</div>}
                            </div>
                          </div>
                          <div className="btns" style={{ justifyContent: "flex-start", padding: "8px 0 0" }}>
                            <button type="button" className="pill" disabled={m.answered} onClick={() => router.push(`/list/${c.id}`)}>이거예요</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="btns" style={{ justifyContent: "flex-start", padding: 0 }}>
                    <button type="button" className="pill" disabled={m.answered} onClick={() => no(i)}>
                      {m.cands.length > 1 ? "여기엔 없어요" : "아니에요"}
                    </button>
                  </div>
                </div>
              )}
              {m.guide && (
                <div style={{ marginTop: 8 }}>
                  <Link className="pill sm" href="/list">📋 게시글 목록에서 직접 찾기</Link>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="m ai" role="status">
              AI가 찾아보고 있어요<span className="dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form className="inbar" onSubmit={send}>
          <input
            type="text"
            value={input}
            maxLength={300}
            placeholder="예: 어제 오후에 도서관에서 흰색 에어팟을 잃어버렸어요"
            onChange={(e) => setInput(e.target.value)}
            aria-label="AI에게 보낼 말"
            disabled={loading}
          />
          <button className="pill" type="submit" disabled={loading || !input.trim()}>보내기</button>
        </form>
      </div>
    </div>
  );
}
