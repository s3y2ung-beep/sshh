import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/openai";
import { embeddingText } from "@/lib/embed-text";
import { placeText } from "@/lib/items";

// 내가 올린 글의 "뜻"을 벡터로 만들어 저장해요. (검색할 때 비슷한 글을 찾는 데 쓰여요)
//   POST { id: 12 }          → 글 12번
//   POST { missing: true }   → 내 글 중 아직 벡터가 없는 것 전부 (예전에 올린 글 채우기)
// RLS(행 보안 정책) 때문에 본인 글만 고칠 수 있어요.
const COLS = "id,category,title,brand,color,size,features,post_text,building_name,address,floor,room";

type Row = {
  id: number;
  category: string;
  title: string;
  brand: string | null;
  color: string | null;
  size: string | null;
  features: string[];
  post_text: string;
  building_name: string | null;
  address: string | null;
  floor: string | null;
  room: string | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  let body: { id?: unknown; missing?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* 빈 요청이면 아래에서 걸러져요 */
  }

  let q = supabase.from("items").select(COLS).eq("author_id", auth.user.id);
  if (body.missing === true) q = q.is("embedding", null).limit(20);
  else if (typeof body.id === "number" && Number.isInteger(body.id)) q = q.eq("id", body.id);
  else return NextResponse.json({ error: "요청이 올바르지 않아요." }, { status: 400 });

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "글을 읽지 못했어요." }, { status: 500 });

  let done = 0;
  for (const r of (data ?? []) as Row[]) {
    try {
      const vec = await embed(
        embeddingText({
          category: r.category,
          title: r.title,
          brand: r.brand,
          color: r.color,
          size: r.size,
          features: r.features,
          place: placeText(r),
          text: r.post_text,
        }),
      );
      const { error: upErr } = await supabase
        .from("items")
        .update({ embedding: vec as unknown as string })
        .eq("id", r.id)
        .eq("author_id", auth.user.id);
      if (!upErr) done++;
    } catch {
      /* 이 글은 건너뛰고 계속해요 (다음에 다시 시도돼요) */
    }
  }
  return NextResponse.json({ done });
}
