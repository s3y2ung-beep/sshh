// 아주 간단한 요청 횟수 제한 (서버 메모리 방식 → 시연용). 로그인 없는 AI 대화가 비용을 쓰는 걸 막아요.
const hits = new Map<string, number[]>();

export function tooMany(request: Request, limit = 20, windowMs = 10 * 60_000): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // 메모리 보호
  return false;
}
