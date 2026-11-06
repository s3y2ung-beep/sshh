-- 로그인 아이디(username)가 로그인 없이도 읽히던 문제 수정
-- 닉네임·가입일은 계속 공개, 아이디는 아무도(본인 포함) 브라우저에서 읽지 못함.
-- (아이디는 로그인 입력에만 쓰이고, 앱 화면은 nickname만 읽어요. 가입 트리거는 security definer라 영향 없음)

revoke select on public.profiles from anon, authenticated;
grant select (id, nickname, created_at) on public.profiles to anon, authenticated;
