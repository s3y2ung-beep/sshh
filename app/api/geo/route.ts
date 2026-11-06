import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 카카오 로컬 API 호출은 여기(서버)에서만 해요. REST 키가 브라우저로 나가지 않아요.
//   GET /api/geo?lat=37.5&lng=127.0  → 좌표 → 주소·건물명
//   GET /api/geo?q=도서관            → 장소·주소 검색 (최대 8개)
const KAKAO = "https://dapi.kakao.com/v2/local";

type Kakao = Record<string, unknown>;

async function kakao(path: string, params: Record<string, string>) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("no-key");
  const res = await fetch(`${KAKAO}${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kakao-${res.status}`);
  return (await res.json()) as { documents?: Kakao[] };
}

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  // 로그인한 사람만 (키를 아무나 쓰지 못하게)
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return fail("로그인이 필요해요.", 401);

  const sp = new URL(request.url).searchParams;

  try {
    // 주소·장소 검색
    const q = sp.get("q")?.trim();
    if (q) {
      if (q.length > 50) return fail("검색어가 너무 길어요.", 400);
      const kw = await kakao("/search/keyword.json", { query: q, size: "8" });
      let docs = kw.documents ?? [];
      if (docs.length === 0) {
        const ad = await kakao("/search/address.json", { query: q, size: "8" });
        docs = (ad.documents ?? []).map((d) => ({
          place_name: (d.address_name as string) ?? q,
          road_address_name: (d.road_address as Kakao | null)?.address_name ?? "",
          address_name: d.address_name,
          x: d.x,
          y: d.y,
        }));
      }
      const results = docs
        .map((d) => ({
          name: String(d.place_name ?? ""),
          address: String(d.road_address_name || d.address_name || ""),
          lat: Number(d.y),
          lng: Number(d.x),
        }))
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
      return NextResponse.json({ results });
    }

    // 좌표 → 주소
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    if (!sp.get("lat") || !sp.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return fail("위치 정보가 올바르지 않아요.", 400);
    }
    const r = await kakao("/geo/coord2address.json", { x: String(lng), y: String(lat) });
    const doc = r.documents?.[0] as { road_address?: Kakao | null; address?: Kakao | null } | undefined;
    const road = doc?.road_address ?? null;
    const jibun = doc?.address ?? null;
    return NextResponse.json({
      address: String(road?.address_name ?? jibun?.address_name ?? ""),
      building: String(road?.building_name ?? ""),
      lat,
      lng,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "no-key") return fail("서버에 카카오 키가 설정되지 않았어요.", 500);
    return fail("주소를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.", 502);
  }
}
