import Link from "next/link";

// 상단 오른쪽의 로그인 상태 표시. 로그인했으면 "닉네임 님" + 로그아웃, 아니면 로그인 버튼.
export default function AuthChip({ nickname }: { nickname: string | null }) {
  if (!nickname) {
    return (
      <Link className="chip authchip" href="/login">
        🔑 로그인
      </Link>
    );
  }
  return (
    <form className="authform" action="/auth/signout" method="post">
      <span className="authname">👤 {nickname} 님</span>
      <button className="chip authchip" type="submit">
        로그아웃
      </button>
    </form>
  );
}
