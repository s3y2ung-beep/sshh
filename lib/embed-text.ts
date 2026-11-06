// 글(또는 주인의 설명)을 "한 덩어리 문장"으로 만들어요. 이 문장의 뜻을 숫자(벡터)로 바꿔 비교해요.
// 글과 검색어를 같은 모양으로 만들어야 비교가 잘 돼요.
type Parts = {
  category?: string | null;
  title?: string | null;
  kind?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  features?: string[] | null;
  place?: string | null;
  text?: string | null;
};

export function embeddingText(p: Parts): string {
  const line = (label: string, v?: string | null) => (v && v.trim() ? `${label}: ${v.trim()}` : "");
  return [
    line("종류", p.category),
    line("물건", p.title || p.kind),
    line("브랜드", p.brand),
    line("색상", p.color),
    line("크기", p.size),
    line("특징", p.features?.length ? p.features.join(", ") : ""),
    line("장소", p.place),
    line("설명", p.text),
  ]
    .filter(Boolean)
    .join("\n");
}
