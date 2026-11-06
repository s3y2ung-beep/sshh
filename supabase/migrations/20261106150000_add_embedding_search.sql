-- 4단계: 의미 검색(pgvector). 글의 "뜻"을 숫자 묶음(벡터)으로 저장해 두고, 주인이 말한 설명과 비슷한 글을 찾아요.

create extension if not exists vector with schema extensions;

-- 글마다 벡터 1개 (OpenAI text-embedding-3-small = 1536개 숫자). 글을 등록할 때 서버가 채워 줘요.
alter table public.items add column embedding extensions.vector(1536);

-- 비슷한 글을 빨리 찾기 위한 색인
create index items_embedding_idx on public.items using hnsw (embedding extensions.vector_cosine_ops);

-- 검색 함수: "보관 중"인 글만, 날짜·종류 조건에 맞는 것 중 뜻이 가장 비슷한 순서로 돌려줘요.
-- security invoker = 호출한 사람의 권한(RLS)으로 실행 → 로그인 없이 볼 수 있는 글만 검색돼요.
create or replace function public.match_items(
  query_embedding extensions.vector(1536),
  match_count     int         default 10,
  date_from       timestamptz default null,
  date_to         timestamptz default null,
  cat             text        default null,
  exclude_ids     bigint[]    default '{}'
) returns table (id bigint, similarity double precision)
language sql stable security invoker
set search_path = public, extensions
as $$
  select i.id, 1 - (i.embedding <=> query_embedding) as similarity
  from public.items i
  where i.status = '보관 중'
    and i.embedding is not null
    and (date_from is null or i.found_at >= date_from)
    and (date_to   is null or i.found_at <= date_to)
    and (cat       is null or i.category = cat)
    and not (i.id = any(exclude_ids))
  order by i.embedding <=> query_embedding
  limit match_count;
$$;
