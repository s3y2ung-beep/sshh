-- 회원 프로필: 아이디(username) + 닉네임. 로그인은 Supabase Auth(내부 이메일), 이 표는 화면에 보이는 정보만.

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique check (username ~ '^[a-z0-9_]{4,20}$'),
  nickname   text not null check (char_length(nickname) between 1 and 20),
  created_at timestamptz not null default now()
);

-- RLS: 읽기는 누구나, 쓰기·수정·삭제는 본인만
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select to anon, authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (id = auth.uid());

-- 가입하면 profiles 줄을 자동으로 만들어 줌 (가입과 프로필 저장이 한 번에 되거나 둘 다 안 되게)
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, nickname)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'nickname');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
