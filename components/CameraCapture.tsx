"use client";

import { useEffect, useRef, useState } from "react";
import { fileToJpeg, videoToJpeg } from "@/lib/image";

// 사이트 안에서 바로 촬영 (갤러리 업로드 없음).
// 카메라를 못 쓰면 <input capture>로 대체. 화면을 떠나면 카메라 스트림을 꼭 끄기.
export default function CameraCapture({ onCapture }: { onCapture: (jpeg: string, takenAt: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"starting" | "live" | "fallback">("starting");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMsg("이 브라우저에서는 카메라를 바로 쓸 수 없어요.");
        setState("fallback");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setState("live");
      } catch (e) {
        if (cancelled) return;
        const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
        setMsg(denied ? "카메라 사용이 허용되지 않았어요. 아래 버튼으로 사진을 찍어 주세요." : "카메라를 켜지 못했어요. 아래 버튼으로 사진을 찍어 주세요.");
        setState("fallback");
      }
    })();
    return () => {
      cancelled = true;
      stop(); // 페이지를 떠날 때 카메라 끄기
    };
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setBusy(true);
    try {
      const jpeg = videoToJpeg(v);
      const takenAt = new Date().toISOString();
      stop();
      onCapture(jpeg, takenAt);
    } catch {
      setMsg("사진을 처리하지 못했어요. 다시 한 번 찍어 주세요.");
      setBusy(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const jpeg = await fileToJpeg(f);
      onCapture(jpeg, new Date().toISOString());
    } catch {
      setMsg("사진을 읽지 못했어요. 다시 찍어 주세요.");
      setBusy(false);
    }
    e.target.value = "";
  };

  return (
    <div className="stack">
      {state !== "fallback" && (
        <div className="cam">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="guide" aria-hidden="true" />
          {state === "starting" && <div className="camMsg">카메라 켜는 중…</div>}
        </div>
      )}
      {state === "fallback" && (
        <div className="bubble warn" style={{ "--t": "'카메라'" } as React.CSSProperties}>
          {msg}
        </div>
      )}
      {state === "live" && (
        <>
          <p className="note center" style={{ margin: 0 }}>주운 물건이 점선 안에 들어오게 찍어 주세요.</p>
          <button type="button" className="shutter" onClick={shoot} disabled={busy} aria-label="사진 찍기" />
        </>
      )}
      {state === "fallback" && (
        <label className="pill center" style={{ cursor: "pointer" }}>
          {busy ? "사진 처리 중…" : "📷 사진 찍기"}
          <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: "none" }} disabled={busy} />
        </label>
      )}
      {state === "live" && msg && <p className="ferr" role="alert">{msg}</p>}
    </div>
  );
}
