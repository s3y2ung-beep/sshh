"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 분실물 주인 → 글쓴이에게 쪽지 보내기 시작. 대화방을 만들고(글 상태는 보관 중 → 연락 중) 대화 화면으로 가요.
export default function ContactButton({ itemId }: { itemId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
