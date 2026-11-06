"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
// 카카오 지도(JavaScript SDK). 핀을 끌거나 지도를 눌러 위치를 고쳐요.
// JavaScript 키는 카카오에 등록한 도메인에서만 동작하는 공개용 키예요.
declare global {
  interface Window {
    kakao?: any;
  }
}

let sdkPromise: Promise<any> | null = null;

function loadSdk(appKey: string): Promise<any> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const done = () => window.kakao.maps.load(() => resolve(window.kakao));
    if (window.kakao?.maps) return done();
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
    s.async = true;
    s.onload = done;
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("sdk"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function KakaoMap({
  lat,
  lng,
  onPick,
}: {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pickRef = useRef(onPick);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  // 처음 한 번 지도 만들기
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!key) {
      setError(true);
      return;
    }
    let dead = false;
    const timer = setTimeout(() => {
      if (!mapRef.current) setError(true); // 8초 안에 못 불러오면 안내
    }, 8000);
    loadSdk(key)
      .then((kakao) => {
        if (dead || !box.current) return;
        const pos = new kakao.maps.LatLng(lat, lng);
        const map = new kakao.maps.Map(box.current, { center: pos, level: 3 });
        const marker = new kakao.maps.Marker({ position: pos, draggable: true });
        marker.setMap(map);
        kakao.maps.event.addListener(marker, "dragend", () => {
          const p = marker.getPosition();
          pickRef.current(p.getLat(), p.getLng());
        });
        kakao.maps.event.addListener(map, "click", (e: any) => {
          const p = e.latLng;
          marker.setPosition(p);
          pickRef.current(p.getLat(), p.getLng());
        });
        mapRef.current = map;
        markerRef.current = marker;
        setReady(true);
      })
      .catch(() => !dead && setError(true));
    return () => {
      dead = true;
      clearTimeout(timer);
    };
    // 지도는 처음 한 번만 만들고, 이후 위치 변화는 아래 effect가 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색 결과 등으로 위치가 바뀌면 핀과 지도를 옮기기
  useEffect(() => {
    const kakao = window.kakao;
    if (!ready || !kakao || !mapRef.current || !markerRef.current) return;
    const pos = new kakao.maps.LatLng(lat, lng);
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [lat, lng, ready]);

  if (error) {
    return (
      <p className="note" role="alert" style={{ margin: 0 }}>
        지도를 불러오지 못했어요. 위의 주소 검색으로 위치를 골라 주세요.
      </p>
    );
  }
  return (
    <div style={{ position: "relative" }}>
      <div
        ref={box}
        role="application"
        aria-label="위치를 고르는 지도"
        style={{ width: "100%", height: 260, background: "#dfe8f3", border: "2px solid", borderColor: "#808080 #fff #fff #808080" }}
      />
      {!ready && <div className="camMsg" style={{ color: "#333" }}>지도 불러오는 중…</div>}
    </div>
  );
}
