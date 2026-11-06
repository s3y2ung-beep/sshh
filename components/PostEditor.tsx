"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FoundDraft } from "@/lib/found-draft";
import { clearDraft } from "@/lib/found-draft";
import { CATEGORIES, STORAGE_PLACES, makeDraftText, makeTitle, placeText } from "@/lib/items";
import { registerItem } from "@/lib/register-item";

// 글 수정·등록 화면. (AI 글 작성이 붙으면 아래 초안이 AI가 쓴 글로 바뀌어요)
export default function PostEditor({ draft, onBack }: { draft: FoundDraft; onBack: () => void }) {
  const router = useRouter();
  const place = placeText({ building_name: draft.building, address: draft.address, floor: draft.floor, room: draft.room });

  const [category, setCategory] = useState<string>("");
  const [customCat, setCustomCat] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [tags, setTags] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(() => makeDraftText({ place, takenAt: draft.takenAt }));
  const [detail, setDetail] = useState("");
  const [anon, setAnon] = useState(false);
  const [storage, setStorage] = useState<string>(STORAGE_PLACES[0]);
  const [storageEtc, setStorageEtc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(true);
  const [aiMsg, setAiMsg] = useState("");
  const started = useRef(false);

  // AI가 사진·위치·시간을 보고 칸을 채워 줘요. 실패해도 직접 쓸 수 있어요.
  const runAi = async () => {
    setAnalyzing(true);
    setAiMsg("");
    try {
      const r = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: draft.photo, takenAt: draft.takenAt, place }),
      });
      const j = (await r.json()) as {
        error?: string; category?: string; kind?: string; color?: string; brand?: string; size?: string;
        features?: string[]; title?: string; post_text?: string;
      };
      if (!r.ok || !j.post_text) throw new Error(j.error);
      setCategory(j.category ?? "기타");
      setCustomCat(j.category === "기타" ? j.kind ?? "" : "");
      setColor(j.color ?? "");
      setBrand(j.brand ?? "");
      setSize(j.size ?? "");
      setTags((j.features ?? []).join(", "));
      setTitle(j.title ?? "");
      setBody(j.post_text);
      setAiMsg("AI가 사진을 보고 써 봤어요. 틀린 곳은 고쳐 주세요.");
    } catch (e) {
      setAiMsg(e instanceof Error && e.message ? e.message : "AI가 글을 쓰지 못했어요. 직접 고쳐 쓰거나 아래 버튼을 눌러 주세요.");
    }
    setAnalyzing(false);
  };

  useEffect(() => {
    if (started.current) return; // 개발 모드에서 두 번 부르지 않게
    started.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runAi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const catValue = category === "기타" ? customCat.trim() || "기타" : category;
  const features = tags
    .split(/[,#\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((t) => t.slice(0, 20));

  // 입력한 정보로 제목·본문 초안을 다시 만들어요
  const regenerate = () => {
    setTitle(makeTitle({ color, brand, category: catValue }));
    setBody(makeDraftText({ place, takenAt: draft.takenAt, color, brand, category: catValue }));
  };

  const ok = !!catValue && body.trim().length >= 5 && (storage !== "기타" || storageEtc.trim().length > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true);
    setError("");
    const fullText = detail.trim() ? `${body.trim()}\n\n${detail.trim()}` : body.trim();
    try {
      const r = await registerItem(draft.photo, {
        found_at: draft.takenAt,
        lat: draft.lat,
        lng: draft.lng,
        accuracy: draft.accuracy,
        address: draft.address,
        building_name: draft.building,
        floor: draft.floor,
        room: draft.room,
        location_note: draft.note,
        category: catValue,
        title: title.trim() || makeTitle({ color, brand, category: catValue }),
        brand,
        color,
        size,
        features,
        post_text: fullText,
        is_anonymous: anon,
        storage_location: storage === "기타" ? `기타: ${storageEtc.trim()}` : storage,
      });
      if (r.error || !r.id) {
        setError(r.error ?? "글을 등록하지 못했어요.");
        setBusy(false);
        return;
      }
      clearDraft();
      router.push(`/list/${r.id}`);
      router.refresh();
    } catch {
      setError("등록하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
      setBusy(false);
    }
  };

  return (
    <div className="win" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
      <div className="tb">
        <span className="t">글쓰기.exe</span>
        <span className="x" aria-hidden="true" />
      </div>
      <form className="wb" onSubmit={submit}>
        {analyzing && (
          <div role="status" style={{ marginBottom: 12 }}>
            <p style={{ margin: 0 }}>AI가 글을 쓰고 있어요…</p>
            <div className="spin" aria-hidden="true" />
          </div>
        )}
        {!analyzing && aiMsg && <p className="note" style={{ margin: "0 0 12px" }}>🤖 {aiMsg}</p>}
        <fieldset disabled={analyzing || busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="thumb big" style={{ marginBottom: 12 }}><img src={draft.photo} alt="찍은 사진" /></div>

        <div className="f" style={{ marginBottom: 12 }}>
          <span style={{ display: "block", margin: "0 0 4px 2px", fontSize: 14 }}>물건 종류</span>
          <div className="chips" role="radiogroup" aria-label="물건 종류">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={category === c} className={`chip${category === c ? " on" : ""}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          {category === "기타" && (
            <input type="text" style={{ marginTop: 8 }} value={customCat} maxLength={20} placeholder="종류를 직접 적어 주세요" onChange={(e) => setCustomCat(e.target.value)} aria-label="종류 직접 입력" />
          )}
        </div>

        <label className="f">
          <span>색상 <small className="note">(선택)</small></span>
          <input type="text" value={color} maxLength={20} placeholder="예: 흰색" onChange={(e) => setColor(e.target.value)} />
        </label>
        <label className="f">
          <span>브랜드 <small className="note">(선택)</small></span>
          <input type="text" value={brand} maxLength={30} placeholder="예: 애플" onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className="f">
          <span>크기 <small className="note">(선택)</small></span>
          <input type="text" value={size} maxLength={30} placeholder="예: 손바닥만 해요" onChange={(e) => setSize(e.target.value)} />
        </label>
        <label className="f">
          <span>특징 <small className="note">(쉼표로 구분, 선택)</small></span>
          <input type="text" value={tags} maxLength={100} placeholder="예: 스티커, 케이스 긁힘" onChange={(e) => setTags(e.target.value)} />
        </label>

        <div className="row" style={{ marginBottom: 12, flexWrap: "wrap" }}>
          <button type="button" className="pill sm" onClick={() => void runAi()}>🤖 AI로 다시 쓰기</button>
          <button type="button" className="pill sm" onClick={regenerate}>✨ 입력한 정보로 초안 만들기</button>
        </div>

        <label className="f">
          <span>제목 <small className="note">(비우면 자동으로 만들어요)</small></span>
          <input type="text" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="f">
          <span>본문</span>
          <textarea value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="f">
          <span>상세 설명 <small className="note">(선택, 본문 아래에 붙어요)</small></span>
          <textarea value={detail} maxLength={500} placeholder="예: 케이스 안쪽에 이름 스티커가 있어요" onChange={(e) => setDetail(e.target.value)} />
        </label>

        <div className="sw">
          <button type="button" className={anon ? "on" : ""} role="switch" aria-checked={anon} aria-label="익명으로 올리기" onClick={() => setAnon(!anon)} />
          <span>익명으로 올리기 {anon ? "(글쓴이가 “익명”으로 보여요)" : ""}</span>
        </div>

        <div className="f" style={{ marginBottom: 12 }}>
          <span style={{ display: "block", margin: "0 0 4px 2px", fontSize: 14 }}>지금 어디에 보관 중인가요?</span>
          <div className="chips" role="radiogroup" aria-label="보관 위치">
            {STORAGE_PLACES.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={storage === s} className={`chip${storage === s ? " on" : ""}`} onClick={() => setStorage(s)}>
                {s}
              </button>
            ))}
          </div>
          {storage === "기타" && (
            <input type="text" style={{ marginTop: 8 }} value={storageEtc} maxLength={40} placeholder="보관 장소를 적어 주세요" onChange={(e) => setStorageEtc(e.target.value)} aria-label="보관 장소 직접 입력" />
          )}
        </div>

        {error && <p className="ferr" role="alert">{error}</p>}
        <div className="btns" style={{ padding: 0 }}>
          <button type="submit" className="pill" disabled={!ok || busy}>{busy ? "등록 중…" : "등록하기"}</button>
          <button type="button" className="pill" onClick={onBack} disabled={busy}>이전으로</button>
        </div>
        </fieldset>
        {!ok && <p className="note" style={{ margin: "8px 0 0" }}>물건 종류를 고르고 본문을 5자 이상 적으면 등록할 수 있어요.</p>}
      </form>
    </div>
  );
}
