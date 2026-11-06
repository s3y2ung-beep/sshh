"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 분실물 주인 → 글쓴이에게 쪽지 보내기 시작. 대화방을 만들고(글 상태는 보관 중 → 연락 중) 대화 화면으로 가요.
// 확인 질문이 있는 글은 질문에 먼저 답해야 해요. (정답 비교는 서버에서만 해요)
export default function ContactButton({ itemId, question }: { itemId: number; question?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [locked, setLocked] = useState(false);
  const hasQuestion = !!question?.trim();

  const go = async () => {
    setBusy(true);
    setError("");
    const { data, error: err } = await createClient().rpc("start_conversation", { p_item_id: itemId });
    if (err || typeof data !== "number") {
      const m = err?.message ?? "";
      setError(
        m.includes("already returned")
          ? "이미 주인에게 돌아간 물건이에요."
          : m.includes("own item")
            ? "내가 올린 글에는 쪽지를 보낼 수 없어요."
            : m.includes("login")
              ? "로그인이 필요해요. 다시 로그인해 주세요."
              : "연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
      setBusy(false);
      return;
    }
    router.push(`/messages/${data}`);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/items/${itemId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const j = (await r.json()) as { ok?: boolean; remaining?: number; error?: string; locked?: boolean; conversationId?: number };
      if (j.ok && j.conversationId) {
        router.push(`/messages/${j.conversationId}`);
        return;
      }
      if (j.locked) setLocked(true);
      if (j.error) setError(j.error);
      else setError(j.remaining ? `답이 맞지 않아요. ${j.remaining}번 더 시도할 수 있어요.` : "답이 맞지 않아요. 잠시 뒤에 다시 시도해 주세요.");
      if (j.ok === false && j.remaining === 0) setLocked(true);
    } catch {
      setError("확인하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    }
    setBusy(false);
  };

  if (hasQuestion) {
    return (
      <form className="hand stack" style={{ gap: 8 }} onSubmit={verify}>
        <p style={{ margin: 0, fontWeight: 700 }}>🔒 내 물건이 맞는지 확인할게요</p>
        <p style={{ margin: 0 }}>{question}</p>
        <input type="text" value={answer} maxLength={100} placeholder="답을 적어 주세요" onChange={(e) => setAnswer(e.target.value)} aria-label="확인 질문의 답" disabled={busy || locked} autoComplete="off" />
        <button type="submit" className="pill" disabled={busy || locked || !answer.trim()}>
          <span>{busy ? "확인 중…" : "💌 확인하고 쪽지 보내기"}</span>
          <span className="ar">➜</span>
        </button>
        {error && <p className="ferr" role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <button type="button" className="pill" disabled={busy} onClick={go}>
        <span>{busy ? "연결 중…" : "💌 내 물건이에요 — 쪽지 보내기"}</span>
        <span className="ar">➜</span>
      </button>
      {error && <p className="ferr" role="alert">{error}</p>}
    </div>
  );
}