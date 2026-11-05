// 아이디 ↔ 내부 이메일 변환과 입력 규칙. 이메일은 Supabase 내부에서만 쓰고 화면에는 절대 보이지 않아요.
// 이 변환은 이 파일 한 곳에서만 해요.
const EMAIL_DOMAIN = "users.jusweossda.app";

export const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;

const USERNAME_RE = /^[a-z0-9_]{4,20}$/;

// 규칙에 맞으면 null, 아니면 화면에 보여줄 안내 문구
export function checkUsername(v: string): string | null {
  if (!v) return null; // 비어 있을 땐 아직 안내하지 않음 (버튼만 꺼 둠)
  if (v.length < 4 || v.length > 20) return "아이디는 4~20자로 만들어 주세요.";
  if (!USERNAME_RE.test(v)) return "영어 소문자, 숫자, 밑줄(_)만 쓸 수 있어요.";
  return null;
}

export const isUsernameValid = (v: string) => USERNAME_RE.test(v);

export function checkPassword(v: string): string | null {
  if (!v) return null;
  if (v.length < 6) return "비밀번호는 6자 이상이어야 해요.";
  return null;
}

export function checkNickname(v: string): string | null {
  if (v.length > 20) return "닉네임은 20자까지 쓸 수 있어요.";
  return null;
}

// 로그인 후 돌아갈 곳은 우리 사이트 안의 주소만 허용 (다른 사이트로 새는 것 방지)
export function safeNext(next?: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
