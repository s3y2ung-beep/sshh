import Link from "next/link";

// 상단 오른쪽의 로그인 상태 표시. 로그인했으면 이름 + 로그아웃, 아니면 로그인 링크.
export default function AuthChip({ name }: { name: string | null }) {
  if (!name) {
    return (
      <Link className="chip authchip" href="/login">
        🔑 로그인
      </Link>
    );
  }
  return (
    <form className="authform" action="/auth/signout" method="post">
      <span className="authname">👤 {name}</span>
      <button className="chip authchip" type="submit">
        로그아웃
      </button>
    </form>
  );
}
