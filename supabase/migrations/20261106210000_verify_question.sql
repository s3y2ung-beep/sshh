-- 6단계: ① 확인 질문이 있는 글은 "정답을 맞혀야" 대화방이 열리게 ② 반환 완료된 글에는 새 쪽지 금지

-- ============ ① 대화방 만들기를 두 겹으로 나눠요 ============
-- (안쪽) 실제로 대화방을 만들고 글 상태를 '연락 중'으로 바꾸는 일. 누구도 직접 부를 수 없고, 아래 두 함수만 불러요.
create function public._start_conversation(p_item_id bigint, p_owner_id uuid) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_item public.items;
  v_id   bigint;
begin
  select * into v_item from public.items where id = p_item_id;
  if not found then raise exception 'item not found'; end if;
  if v_item.author_id = p_owner_id then raise exception 'cannot contact own item'; end if;
  if v_item.status = '반환 완료' then raise exception 'item already returned'; end if;

  insert into public.conversations (item_id, finder_id, owner_id)
  values (p_item_id, v_item.author_id, p_owner_id)
  on conflict (item_id, owner_id) do nothing;

  select id into v_id from public.conversations where item_id = p_item_id and owner_id = p_owner_id;
  update public.items set status = '연락 중' where id = p_item_id and status = '보관 중';
  return v_id;
end $$;
revoke execute on function public._start_conversation(bigint, uuid) from public, anon, authenticated;

-- (바깥 1) 브라우저에서 부르는 기존 함수: 확인 질문이 없는 글만 바로 연결돼요. 질문이 있는 글은 거절.
create or replace function public.start_conversation(p_item_id bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_q text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select verify_question into v_q from public.items where id = p_item_id;
  if v_q is not null and btrim(v_q) <> '' then raise exception 'verification required'; end if;
  return public._start_conversation(p_item_id, auth.uid());
end $$;

-- (바깥 2) 서버 전용: 정답을 확인한 뒤(서버가 비밀 정답과 비교) 주인을 대신해 대화방을 열어 줘요.
-- service_role(서버 비밀 키)만 실행할 수 있어서, 브라우저에서는 부를 수 없어요.
create function public.start_conversation_verified(p_item_id bigint, p_owner_id uuid) returns bigint
language sql security definer set search_path = public as $$
  select public._start_conversation(p_item_id, p_owner_id);
$$;
revoke execute on function public.start_conversation_verified(bigint, uuid) from public, anon, authenticated;
grant  execute on function public.start_conversation_verified(bigint, uuid) to service_role;

-- ============ ② 반환 완료된 글의 대화방에는 새 쪽지를 보낼 수 없게 (화면뿐 아니라 DB 규칙으로도) ============
drop policy "msg_insert_participants" on public.messages;
create policy "msg_insert_participants" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.conversations c
      join public.items i on i.id = c.item_id
      where c.id = conversation_id
        and auth.uid() in (c.finder_id, c.owner_id)
        and i.status <> '반환 완료'
    )
  );
