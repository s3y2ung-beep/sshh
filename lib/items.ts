export const CATEGORIES = ["전자기기", "지갑·카드", "가방", "의류", "학용품", "열쇠", "기타"] as const;
export const STORAGE_PLACES = ["내가 보관 중", "학생지원팀", "기타"] as const;
export const STATUSES = ["보관 중", "연락 중", "반환 완료"] as const;
export type Status = (typeof STATUSES)[number];

export type Item = {
  id: number;
  author_id: string;
  created_at: string;
  found_at: string;
  address: string | null;
  building_name: string | null;
  floor: string | null;
  room: string | null;
  location_note: string | null;
  image_path: string | null;
  category: string;
  title: string;
  brand: string | null;
  color: string | null;
  size: string | null;
  features: string[];
  post_text: string;
  is_anonymous: boolean;
  storage_location: string;
  status: Status;
};

// 목록·상세에서 쓰는 열 (verify_answer 같은 비밀 값은 items에 없어요)
export const ITEM_COLUMNS =
  "id,author_id,created_at,found_at,address,building_name,floor,room,location_note,image_path,category,title,brand,color,size,features,post_text,is_anonymous,storage_location,status";

const TZ = "Asia/Seoul"; // 서버(UTC)에서도 한국 시간으로 보이게

export function koTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const min = Number(get("minute"));
  return `${get("dayPeriod")} ${get("hour")}시${min ? ` ${min}분` : ""}`;
}

export function koDateTime(iso: string): string {
  const d = new Intl.DateTimeFormat("ko-KR", { timeZone: TZ, month: "long", day: "numeric" }).format(new Date(iso));
  return `${d} ${koTime(iso)}`;
}

export function placeText(i: { building_name?: string | null; address?: string | null; floor?: string | null; room?: string | null }): string {
  const base = i.building_name || i.address || "위치 미상";
  const extra = [i.floor, i.room].filter(Boolean).join(" ");
  return extra ? `${base} ${extra}` : base;
}

// AI 글 작성이 붙기 전(또는 AI가 실패했을 때)에 쓰는 기본 초안
export function makeDraftText(p: {
  place: string;
  takenAt: string;
  color?: string;
  brand?: string;
  category?: string;
}): string {
  const what = [p.color, p.brand, p.category].filter(Boolean).join(" ") || "물건";
  return `${p.place}에서 ${koTime(p.takenAt)}에 ${what}을(를) 주웠습니다.`;
}

export function makeTitle(p: { color?: string; brand?: string; category?: string }): string {
  return [p.color, p.brand, p.category].filter(Boolean).join(" ") || "주운 물건";
}

// 사진 공개 주소 (item-photos 버킷은 읽기 공개). 브라우저·서버 어디서나 사용 가능
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/item-photos/${path}` : null;
}
