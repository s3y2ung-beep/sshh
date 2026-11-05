"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkNickname, checkPassword, checkUsername, isUsernameValid, usernameToEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

const Err = ({ text }: { text: string | null }) => (text ? <p className="ferr" role="alert">{text}</p> : null);

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const wrong = "아이디 또는 비밀번호가 맞지 않아요."; // 어느 쪽이 틀렸는지는 알려주지 않음
    if (!isUsernameValid(username.trim().toLowerCase()) || !password) {
      setBusy(false);
      setError(wrong);
      return;
    }
    const { error } = await createClient().auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) {
      setBusy(false);
      setError(error.message.toLowerCase().includes("invalid login") ? wrong : "로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <label className="f">
        <span>아이디</span>
        <input type="text" value={username} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label className="f">
        <span>비밀번호</span>
        <input type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
      </label>
      <Err text={error} />
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="pill center" type="submit" disabled={busy || !username || !password}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
        <p className="note center" style={{ margin: 0 }}>
          아직 계정이 없나요? <Link className="lnk" href={`/signup?next=${encodeURIComponent(next)}`}>회원가입</Link>
        </p>
      </div>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const uErr = checkUsername(username);
  const pErr = checkPassword(password);
  const nErr = checkNickname(nickname.trim());
  const cErr = confirm && password !== confirm ? "비밀번호가 서로 달라요." : null;
  const ok = isUsernameValid(username) && password.length >= 6 && password === confirm && nickname.trim().length >= 1 && !nErr;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setError("");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      // 닉네임·아이디는 DB 트리거가 profiles 표에 저장해 줘요
      options: { data: { username, nickname: nickname.trim() } },
    });
    if (error) {
      setBusy(false);
      const m = error.message.toLowerCase();
      setError(
        m.includes("already") || m.includes("database error")
          ? "이미 사용 중인 아이디예요."
          : "가입하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
      return;
    }
    // 이메일 인증을 꺼 두었다면 가입과 동시에 로그인 상태. 아직 켜져 있으면 세션이 없어요.
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (e2) {
        setBusy(false);
        setError("가입은 됐지만 로그인되지 않았어요. 관리자 설정(이메일 인증 끄기)이 필요해요.");
        return;
      }
    }
    router.push(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <label className="f">
        <span>아이디 <small className="note">(영어 소문자·숫자·밑줄, 4~20자)</small></span>
        <input type="text" value={username} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          onChange={(e) => setUsername(e.target.value)} aria-invalid={!!uErr} />
        <Err text={uErr} />
      </label>
      <label className="f">
        <span>비밀번호 <small className="note">(6자 이상)</small></span>
        <input type="password" value={password} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} aria-invalid={!!pErr} />
        <Err text={pErr} />
      </label>
      <label className="f">
        <span>비밀번호 확인</span>
        <input type="password" value={confirm} autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} aria-invalid={!!cErr} />
        <Err text={cErr} />
      </label>
      <label className="f">
        <span>닉네임</span>
        <input type="text" value={nickname} maxLength={20} autoComplete="nickname" onChange={(e) => setNickname(e.target.value)} />
        <Err text={nErr} />
      </label>
      <Err text={error} />
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="pill center" type="submit" disabled={!ok || busy}>
          {busy ? "가입 중…" : "가입하기"}
        </button>
        <p className="note center" style={{ margin: 0 }}>
          이미 계정이 있나요? <Link className="lnk" href={`/login?next=${encodeURIComponent(next)}`}>로그인</Link>
        </p>
        <p className="note center" style={{ margin: 0 }}>⚠ 시제품이라 비밀번호를 잊으면 찾을 수 없어요. 꼭 기억해 주세요.</p>
      </div>
    </form>
  );
}
