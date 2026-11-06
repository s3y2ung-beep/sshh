-- 5단계: 쪽지(대화방 + 메시지) + 글 상태 자동 변경(보관 중 → 연락 중)

-- ============ conversations: "이 글에 대해 주인이 글쓴이에게 연락한 대화방" ============
create table public.conversations (
  id         bigint generated always as identity primary key,
  item_id    bigint not null references public.items(id) on delete cascade,
  finder_id  uuid   not null references auth.users(id) on delete cascade,  -- 글쓴이(주운 사람)
  owner_id   uuid   not null references auth.users(id) on delete cascade,  -- 분실물 주인
  created_at timestamptz not null default now(),
  unique (item_id, owner_id),          -- 같은 글에 같은 주인은 대화방 1개
  check (finder_id <> owner_id)
);

-- ============ messages: 대화방 안의 쪽지 ============
create table public.messages (
  id              bigint generated always as identity primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id       uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  content         text   not null check (char_length(content) between 1 and 500),
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ============ RLS(행 보안 정책): 대화에 참여한 두 사람만 읽고 쓸 수 있어요 ============
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

create policy "conv_select_participants" on public.conversations for select to authenticated
  using (auth.uid() in (finder_id, owner_id));
-- conversations에는 insert 정책이 없어요 → 대화방은 아래 start_conversation 함수로만 만들 수 있어요

create policy "msg_select_participants" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and auth.uid() in (c.finder_id, c.owner_id)));
create policy "msg_insert_participants" on public.messages for insert to authenticated
  with check (sender_id = auth.uid()
              and exists (select 1 from public.conversations c
                          where c.id = conversation_id and auth.uid() in (c.finder_id, c.owner_id)));
-- 쪽지는 수정·삭제 정책이 없어요 (보낸 쪽지는 바꿀 수 없음)

-- ============ 대화방 만들기 + 글 상태 변경 ============
-- 주인은 글을 직접 수정할 수 없어서(RLS), 이 함수가 대신 "보관 중 → 연락 중"으로 바꿔 줘요.
-- security definer = 함수 주인 권한으로 실행. 대신 아래에서 자격을 꼼꼼히 확인해요.
create function public.start_conversation(p_item_id bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_item public.items;
  v_id   bigint;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into v_item from public.items where id = p_item_id;
  if not found then raise exception 'item not found'; end if;
  if v_item.author_id = auth.uid() then raise exception 'cannot contact own item'; end if;
  if v_item.status = '반환 완료' then raise exception 'item already returned'; end if;

  insert into public.conversations (item_id, finder_id, owner_id)
  values (p_item_id, v_item.author_id, auth.uid())
  on conflict (item_id, owner_id) do nothing;

  select id into v_id from public.conversations where item_id = p_item_id and owner_id = auth.uid();
  update public.items set status = '연락 중' where id = p_item_id and status = '보관 중';
  return v_id;
end $$;

revoke execute on function public.start_conversation(bigint) from public, anon;
grant  execute on function public.start_conversation(bigint) to authenticated;

-- ============ 실시간(Realtime): 새 쪽지가 화면에 바로 나타나게 ============
alter publication supabase_realtime add table public.messages;
