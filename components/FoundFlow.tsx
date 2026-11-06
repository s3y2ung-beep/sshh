"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import KakaoMap from "@/components/KakaoMap";
import PostEditor from "@/components/PostEditor";
import { clearDraft, saveDraft, type FoundDraft } from "@/lib/found-draft";

type Geo =
  | { status: "pending" }
  | { status: "ok"; lat: number; lng: number; accuracy: number }
  | { status: "denied" | "error" };

type Place = { lat: number; lng: number; address: string; building: string; accuracy: number | null };
type Hit = { name: string; address: string; lat: number; lng: number };
type Step = "camera" | "confirm" | "fix" | "details" | "edit";

// GPS를 못 쓸 때 지도의 처음 위치 (한양여자대학교 근처)
const DEFAULT_CENTER = { lat: 37.558968, lng: 127.049414 }; // 한양여자대학교(살곶이길 200)

async function reverse(lat: number, lng: number): Promise<{ address: string; building: string } | null> {
  try {
    const r = await fetch(`/api/geo?lat=${lat}&lng=${lng}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { address: string; building: string };
    return { address: j.address, building: j.building };
  } catch {
    return null;
  }
}

const STEP_INDEX: Record<Step, number> = { camera: 0, confirm: 1, fix: 1, details: 2, edit: 3 };

export default function FoundFlow() {
  const [step, setStep] = useState<Step>("camera");
  const [geo, setGeo] = useState<Geo>({ status: "pending" });
  const [photo, setPhoto] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [resolving, setResolving] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [note, setNote] = useState("");
  const reqId = useRef(0);

  // 예전에 올린 내 글 중 검색용 벡터가 없는 것을 조용히 채워 둬요 (4단계 이전에 올린 글)
  useEffect(() => {
    void fetch("/api/items/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missing: true }),
    }).catch(() => {});
  }, []);

  // 카메라 화면에 들어오자마자 위치 요청 시작 (촬영하는 동안 GPS가 정확해져요)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeo({ status: "error" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ status: "ok", lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
      (e) => setGeo({ status: e.code === 1 ? "denied" : "error" }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, []);

  // 위치를 정할 때마다 주소 변환 (오래된 응답은 무시)
  const resolve = useCallback(async (lat: number, lng: number, accuracy: number | null, name?: string, addr?: string) => {
    const id = ++reqId.current;
    setResolving(true);
    setNotice("");
    const r = addr ? { address: addr, building: name ?? "" } : await reverse(lat, lng);
    if (id !== reqId.current) return;
    setResolving(false);
    if (!r) {
      setPlace({ lat, lng, address: "", building: "", accuracy });
      setNotice("주소를 불러오지 못했어요. 주소를 직접 검색해 주세요.");
      return;
    }
    setPlace({ lat, lng, address: r.address, building: r.building, accuracy });
  }, []);

  // 촬영 후: 위치가 준비됐으면 주소 확인, 거부됐으면 바로 주소 검색
  useEffect(() => {
    if (step !== "confirm" || place) return;
    if (geo.status === "ok") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void resolve(geo.lat, geo.lng, geo.accuracy);
    } else if (geo.status === "denied" || geo.status === "error") {
      setNotice(
        geo.status === "denied"
          ? "위치 사용이 허용되지 않았어요. 주소를 검색해서 알려 주세요."
          : "현재 위치를 찾지 못했어요. 주소를 검색해서 알려 주세요.",
      );
      setStep("fix");
    }
  }, [step, geo, place, resolve]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setHits(null);
    setNotice("");
    try {
      const r = await fetch(`/api/geo?q=${encodeURIComponent(q)}`);
      const j = (await r.json()) as { results?: Hit[]; error?: string };
      if (!r.ok) throw new Error(j.error);
      setHits(j.results ?? []);
    } catch {
      setNotice("검색하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    }
    setSearching(false);
  };

  const pickHit = (h: Hit) => {
    setHits(null);
    void resolve(h.lat, h.lng, null, h.name, h.address);
  };

  const retake = () => {
    clearDraft();
    reqId.current++;
    setPhoto("");
    setPlace(null);
    setHits(null);
    setQuery("");
    setNotice("");
    setFloor("");
    setRoom("");
    setNote("");
    setStep("camera");
  };

  const makeDraft = (p: Place): FoundDraft => ({
    photo,
    takenAt,
    lat: p.lat,
    lng: p.lng,
    accuracy: p.accuracy,
    address: p.address,
    building: p.building,
    floor: floor.trim(),
    room: room.trim(),
    note: note.trim(),
  });

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;
    saveDraft(makeDraft(place));
    setStep("edit");
  };

  const center = place ?? (geo.status === "ok" ? geo : DEFAULT_CENTER);
  const placeLabel = place ? `${place.address || "주소를 알 수 없어요"}${place.building ? ` (${place.building})` : ""}` : "";
  const ferr = (t: string) => (t ? <p className="ferr" role="alert">{t}</p> : null);

  return (
    <div className="stack">
      <div className="steps" aria-label={`${STEP_INDEX[step] + 1}단계 / 4단계`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < STEP_INDEX[step] ? "on" : i === STEP_INDEX[step] ? "now" : ""} />
        ))}
      </div>

      {step === "camera" && (
        <CameraCapture
          onCapture={(jpeg, at) => {
            setPhoto(jpeg);
            setTakenAt(at);
            setPlace(null);
            setStep("confirm");
          }}
        />
      )}

      {step === "confirm" && (
        <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div className="tb">
            <span className="t">위치 확인.exe</span>
            <span className="x" aria-hidden="true" />
          </div>
          <div className="wb stack">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="thumb big"><img src={photo} alt="찍은 사진" /></div>
            {!place || resolving ? (
              <>
                <p style={{ margin: 0 }}>위치 확인 중…</p>
                <div className="spin" aria-hidden="true" />
              </>
            ) : (
              <>
                <p style={{ margin: 0 }}>📍 <strong>{placeLabel}</strong> 여기가 맞나요?</p>
                {place.accuracy !== null && <p className="note" style={{ margin: 0 }}>위치 오차 약 {place.accuracy}m</p>}
                {ferr(notice)}
                <div className="btns" style={{ padding: 0 }}>
                  <button type="button" className="pill" disabled={!place.address} onClick={() => setStep("details")}>네, 맞아요</button>
                  <button type="button" className="pill" onClick={() => setStep("fix")}>아니요</button>
                </div>
              </>
            )}
            <button type="button" className="pill sm" onClick={retake}>다시 찍기</button>
          </div>
        </div>
      )}

      {step === "fix" && (
        <div className="win" style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
          <div className="tb">
            <span className="t">위치 고르기.exe</span>
            <span className="x" aria-hidden="true" />
          </div>
          <div className="wb stack">
            {ferr(notice)}
            <form onSubmit={search} className="inbar" style={{ position: "static" }}>
              <input type="text" value={query} placeholder="건물·장소·주소 검색 (예: 도서관)" onChange={(e) => setQuery(e.target.value)} aria-label="주소 검색" />
              <button className="pill" type="submit" disabled={searching || !query.trim()}>{searching ? "검색 중…" : "검색"}</button>
            </form>
            {hits && (
              <div className="files" style={{ maxHeight: 180 }}>
                {hits.length === 0 && <p className="note" style={{ margin: 8 }}>검색 결과가 없어요. 다른 말로 검색해 보세요.</p>}
                {hits.map((h, i) => (
                  <button key={i} type="button" className="card" style={{ gridTemplateColumns: "1fr", gridTemplateAreas: "none", display: "block" }} onClick={() => pickHit(h)}>
                    <strong>{h.name}</strong>
                    <br />
                    <span className="note">{h.address}</span>
                  </button>
                ))}
              </div>
            )}
            <KakaoMap lat={center.lat} lng={center.lng} onPick={(la, ln) => void resolve(la, ln, null)} />
            <p className="note" style={{ margin: 0 }}>핀을 끌거나 지도를 눌러서 위치를 옮길 수 있어요.</p>
            <p style={{ margin: 0 }}>
              {resolving ? "주소 확인 중…" : place ? <>📍 <strong>{placeLabel}</strong></> : "아직 위치를 고르지 않았어요."}
            </p>
            <div className="btns" style={{ padding: 0 }}>
              <button type="button" className="pill" disabled={!place || resolving || !place.address} onClick={() => setStep("details")}>여기로 정할게요</button>
              <button type="button" className="pill" onClick={retake}>다시 찍기</button>
            </div>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="win" style={{ maxWidth: 460, margin: "0 auto", width: "100%" }}>
          <div className="tb">
            <span className="t">층·호수.exe</span>
            <span className="x" aria-hidden="true" />
          </div>
          <form className="wb" onSubmit={finish}>
            <p style={{ margin: "0 0 12px" }}>📍 {placeLabel}</p>
            <label className="f">
              <span>층수 <small className="note">(선택)</small></span>
              <input type="text" value={floor} maxLength={10} placeholder="예: 1층" onChange={(e) => setFloor(e.target.value)} />
            </label>
            <label className="f">
              <span>호수 <small className="note">(선택)</small></span>
              <input type="text" value={room} maxLength={20} placeholder="예: 203호" onChange={(e) => setRoom(e.target.value)} />
            </label>
            <label className="f">
              <span>메모 <small className="note">(선택)</small></span>
              <input type="text" value={note} maxLength={100} placeholder="예: 창가 자리 책상 위" onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="btns" style={{ padding: 0 }}>
              <button type="submit" className="pill">다음</button>
              <button type="button" className="pill" onClick={() => setStep("fix")}>위치 다시 고르기</button>
            </div>
          </form>
        </div>
      )}

      {step === "edit" && place && <PostEditor draft={makeDraft(place)} onBack={() => setStep("details")} />}    </div>
  );
}
