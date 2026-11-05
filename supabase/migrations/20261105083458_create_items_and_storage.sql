-- 분실물 글(items) + 비밀 정보(item_secrets) + 사진 저장소(Storage)

-- ============ items: 누구나 볼 수 있는 공개 글 ============
create table public.items (
  id             bigint generated always as identity primary key,
  author_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),

  found_at       timestamptz not null,          -- 주운 시각
  lat            double precision,
  lng            double precision,
  accuracy       double precision,              -- 위치 오차(m)
  address        text,
  building_name  text,
  floor          text,
  room           text,
  location_note  text,

  image_path     text,                          -- Storage 경로 (item-photos 버킷)
  category       text not null,                 -- 전자기기, 학용품 … 또는 직접 입력한 값
  title          text not null,
  brand          text,
  color          text,
  size           text,
  features       text[] not null default '{}',  -- 해시태그
  post_text      text not null,                 -- 공개 본문 (정답은 ○○로 가려진 상태)

  is_anonymous     boolean not null default false,
  storage_location text not null default '내가 보관 중',
  verify_question  text,                        -- 질문만 공개, 정답은 item_secrets
  status           text not null default '보관 중'
                   check (status in ('보관 중', '연락 중', '반환 완료'))
);

create index items_status_found_at_idx on public.items (status, found_at desc);
create index items_category_idx on public.items (category);

-- ============ item_secrets: 정답·숨긴 특징 (브라우저로 내려가면 안 되는 값) ============
create table public.item_secrets (
  item_id        bigint primary key references public.items(id) on delete cascade,
  verify_answer  text,
  hidden_tags    text[] not null default '{}'
);

-- ============ RLS(행 보안 정책) ============
alter table public.items        enable row level security;
alter table public.item_secrets enable row level security;

-- items: 로그인 없이 누구나 읽기, 쓰기·수정·삭제는 글쓴이 본인만
create policy "items_select_all"   on public.items for select to anon, authenticated using (true);
create policy "items_insert_own"   on public.items for insert to authenticated with check (author_id = auth.uid());
create policy "items_update_own"   on public.items for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "items_delete_own"   on public.items for delete to authenticated using (author_id = auth.uid());

-- item_secrets: 읽기 정책을 일부러 만들지 않음 → 브라우저(anon·로그인 사용자)는 정답을 읽을 수 없음.
-- 정답 확인은 나중에 서버 API Route(service_role 키)에서만 한다. 글쓴이는 등록할 때 입력만 가능.
create policy "secrets_insert_own" on public.item_secrets for insert to authenticated
  with check (exists (select 1 from public.items i where i.id = item_id and i.author_id = auth.uid()));

-- ============ Storage: 사진 버킷 ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- 읽기는 누구나(공개 버킷), 업로드·삭제는 로그인한 사용자가 자기 폴더({user id}/파일명)에만
create policy "photos_insert_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos_delete_own_folder" on storage.objects for delete to authenticated
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
