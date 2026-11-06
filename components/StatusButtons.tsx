"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Status } from "@/lib/items";

// 글쓴이 전용: 글 상태 바꾸기. (글쓴이만 자기 글을 고칠 수 있어요 — 서버 규칙(RLS)이 막아 줘요)
//   보관 중 / 연락 중 → [반환 완료]      연락 중 / 반환 완료 → [다시 보관 중으로]
export default function StatusButtons({ itemId, status }: { itemId: number; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = async (next: Status, ask: string) => {
    if (!window.confirm(ask)) return;
    setBusy(true);
    setError("");
    const { data, error: err } = await createClient().from("items").update({ status: next }).eq("id", itemId).select("id");
    if (err || !data?.length) {
      setError("상태를 바꾸지 못했어요. 로그인을 확인하고 다시 시도해 주세요.");
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="btns" style={{ justifyContent: "flex-start", padding: 0 }}>
        {status !== "반환 완료" && (
          <button type="button" className="pill" disabled={busy} onClick={() => change("반환 완료", "주인에게 돌려주었나요?\n반환 완료로 바꾸면 AI 검색과 기본 목록에서 빠져요.")}>
            ✅ 반환 완료
          </button>
        )}
        {status !== "보관 중" && (
          <button type="button" className="pill" disabled={busy} onClick={() => change("보관 중", "다시 ‘보관 중’으로 바꿀까요?\n다시 AI 검색에 나오게 돼요.")}>
            ↩ 다시 보관 중으로
          </button>
        )}
      </div>
      {error && <p className="ferr" role="alert">{error}</p>}
    </div>
  );
}
