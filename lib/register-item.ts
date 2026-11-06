import { createClient } from "@/lib/supabase/client";

export type NewItem = {
  found_at: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  address: string;
  building_name: string;
  floor: string;
  room: string;
  location_note: string;
  category: string;
  title: string;
  brand: string;
  color: string;
  size: string;
  features: string[];
  post_text: string;
  is_anonymous: boolean;
  storage_location: string;
  verify_question: string; // 비우면 확인 질문 없음
  verify_answer: string; // 정답은 item_secrets에 따로 저장 (브라우저에서 다시 읽을 수 없어요)
};

const nul = (s: string) => (s.trim() ? s.trim() : null);

// 사진 올리기 → 글 저장. 저장이 실패하면 올린 사진을 지워요. 성공하면 새 글 번호를 돌려줘요.
export async function registerItem(photoDataUrl: string, n: NewItem): Promise<{ id?: number; error?: string }> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "로그인이 필요해요. 다시 로그인해 주세요." };

  const blob = await (await fetch(photoDataUrl)).blob();
  const path = `${auth.user.id}/${Date.now()}.jpg`;
  const up = await supabase.storage.from("item-photos").upload(path, blob, { contentType: "image/jpeg" });
  if (up.error) return { error: "사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요." };

  const { data, error } = await supabase
    .from("items")
    .insert({
      found_at: n.found_at,
      lat: n.lat,
      lng: n.lng,
      accuracy: n.accuracy,
      address: nul(n.address),
      building_name: nul(n.building_name),
      floor: nul(n.floor),
      room: nul(n.room),
      location_note: nul(n.location_note),
      image_path: path,
      category: n.category.trim(),
      title: n.title.trim(),
      brand: nul(n.brand),
      color: nul(n.color),
      size: nul(n.size),
      features: n.features,
      post_text: n.post_text.trim(),
      is_anonymous: n.is_anonymous,
      storage_location: n.storage_location,
      verify_question: nul(n.verify_question),
    })
    .select("id")
    .single();

  if (error || !data) {
    await supabase.storage.from("item-photos").remove([path]);
    return { error: "글을 등록하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }

  // 확인 질문이 있으면 정답을 비밀 표(item_secrets)에 저장. 실패하면 글도 되돌려요(정답 없는 질문이 남으면 아무도 못 맞혀요)
  if (n.verify_question.trim() && n.verify_answer.trim()) {
    const sec = await supabase.from("item_secrets").insert({ item_id: data.id, verify_answer: n.verify_answer.trim() });
    if (sec.error) {
      await supabase.from("items").delete().eq("id", data.id);
      await supabase.storage.from("item-photos").remove([path]);
      return { error: "확인 질문을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
    }
  }
  return { id: data.id as number };
}
