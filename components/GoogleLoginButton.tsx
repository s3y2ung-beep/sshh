"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton({ next = "/" }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setBusy(false);
      setError("구글 로그인을 시작하지 못했어요. 잠시 뒤 다시 눌러 주세요.");
    }
    // 성공하면 구글 로그인 화면으로 이동해요.
  };

  return (
    <>
      <button className="pill" onClick={login} disabled={busy}>
        <span>{busy ? "구글로 이동하는 중…" : "🔑 Google로 로그인"}</span>
        <span className="ar">➜</span>
      </button>
      {error && <p className="note" style={{ color: "#c0332f", margin: "8px 0 0" }}>{error}</p>}
    </>
  );
}
