# CLAUDE.md

## 프로젝트 한 줄 요약
캠퍼스 분실물 서비스. 습득자가 **사이트 안에서 사진을 찍으면** AI가 시간·장소·물건을 읽어 게시글을 대신 써 주고,
분실물 주인은 **AI와 대화하면** 등록된 글 중 후보(최대 3개)를 "이것인가요?" 하고 보여준다.

- 해커톤 프로젝트 (주제: AI로 만드는 우리 주변의 문제 해결)
- 개발자: 빅데이터과 1학년. 설명은 쉬운 한국어로, 전문 용어는 짧게 풀어서 설명할 것
- 목표: 완벽함보다 **시연 가능한 완성도**. 단, 화면 퀄리티는 신경 쓴다

## 기술 스택
- Next.js (App Router, TypeScript) + Tailwind CSS — 모바일 우선 UI, 한국어 서비스
- Supabase: Auth(로그인), Postgres + pgvector(글·벡터 검색), Storage(사진), Realtime(쪽지)
- Vercel 배포 (GitHub push → 자동 배포), GitHub 레포
  - 배포 주소: https://jusweossda.vercel.app (Vercel 프로젝트 `jusweossda`, 2026-11-06 첫 배포)
  - **main에 push하면 자동 배포**됨. 환경변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)는 Vercel에 등록 완료
- 카카오 로컬 API: 좌표 → 주소·건물명 변환 (서버 API Route에서만 호출)
- 비전 LLM API: 사진 분석, 게시글 작성, 대화 (모델은 아직 미정 — 아래 "결정 대기" 참고)

## 습득자(글쓴이) 흐름
1. 로그인 → 사이트 내 카메라(getUserMedia)로 촬영. **갤러리 업로드 없음**
   - 카메라 진입과 동시에 `navigator.geolocation`(enableHighAccuracy) 요청 시작
   - 휴대폰은 후면 카메라(facingMode: "environment"), 노트북은 웹캠
   - 카메라 사용 불가 시 `<input type="file" accept="image/*" capture="environment">`로 대체
   - 촬영 후 긴 변 1280px JPEG로 리사이즈, 페이지 이탈 시 카메라 스트림 반드시 종료
2. 촬영 시각 + 좌표 → 서버에서 주소·건물명 변환
3. "📍 {주소} ({건물명}) 여기가 맞나요?"
   - 네 → 층수 / 호수 / 메모 입력
   - 아니요 → 지도 핀 이동 또는 주소 검색 후 다시 확인
   - 위치 권한 거부 → 바로 주소 검색. 정확도(오차 m)도 저장
4. AI가 사진 분석(종류, 브랜드, 색상, 크기, 특징 → JSON) + 위치 + 시간으로 게시글 초안 작성
   - 예: "한양여자대학교 도서관 1층에서 오후 2시 40분에 흰색 에어팟 프로를 주웠습니다."
5. 작성자 수정: 본문 편집, 상세 설명, 익명 여부, 현재 보관 위치(내가 보관 / 학생지원팀 / 기타),
   주인 확인 질문(선택, 정답이 되는 특징은 공개 글에서 숨김)
6. 등록 → 상태 `보관 중`

## 분실물 주인 흐름
1. 메인에서 바로 AI 대화창 (로그인 없이 가능)
2. AI가 대화에서 종류·색상·브랜드·모양·크기·장소·시간을 추출. "어제 오후" 같은 표현은 날짜 범위로 변환.
   부족한 정보는 되묻기
3. 검색: `status = 보관 중` + 날짜·종류 필터 → pgvector 유사도 → LLM 재정렬 → 후보 최대 3개 카드 (사진 블러)
4. [이거예요] → 확인 질문 답변 → 로그인 → 글쓴이와 쪽지 연결 (상태 `연락 중`)
   [아니에요] → 추가 질문 후 재검색. **2회 실패 시 직접 검색 화면으로 안내**
5. 글쓴이가 "반환 완료" 처리 → AI 후보·기본 검색에서 제외

## 게시글 상태
| 상태 | 바뀌는 시점 | 노출 |
|---|---|---|
| 보관 중 | 처음 등록 | AI 후보, 검색, 목록 |
| 연락 중 | 확인 질문 통과 + 쪽지 연결 | 검색·목록(표시), AI 후보 제외 |
| 반환 완료 | 글쓴이가 처리 | "반환 완료" 필터에서만 |

## 로그인 범위
- 로그인 없이: 글 보기, AI 대화, 검색
- 로그인 필요: 글 올리기, 쪽지
- 익명 선택 시 닉네임 대신 "익명" 표시

## 주요 테이블 (초안 — 생성 전 나에게 보여주고 승인받을 것)
- `profiles`: id, nickname
- `items`: author_id, found_at, lat, lng, accuracy, address, building_name, floor, room, location_note,
  image_path, category, brand, color, size, features, post_text, is_anonymous, storage_location,
  verify_question, verify_answer, status, embedding
- `conversations`: item_id, finder_id, owner_id
- `messages`: conversation_id, sender_id, content, created_at
- RLS(행 보안 정책)는 반드시 켤 것. `verify_answer`는 클라이언트에 절대 내려보내지 않음

## 개발 단계 (진행 상황 체크)
- [x] 1. 기본 세팅: Next.js, GitHub 레포, Vercel 배포, Supabase 연결, 로그인
- [x] 2. 카메라 + 위치 확인 ("여기가 맞나요?" → 층/호수 입력까지)
- [x] 3. AI 글 작성 · 수정 · 등록 → 목록 표시 **(여기까지 되면 시연 가능)**
- [x] 4. 주인 AI 대화 + 후보 카드 + 재검색
- [x] 5. 쪽지 + 상태 관리
- [x] 6. 마무리: 확인 질문, 직접 검색, 디자인 다듬기, 시연용 샘플 글 10~20개

단계를 끝낼 때마다 이 체크리스트를 업데이트할 것.

## 결정 대기 (내가 정하기 전에는 임의로 정하지 말고 물어볼 것)
- ~~로그인 방식~~ → **아이디 + 비밀번호(내부 이메일 변환)로 결정** (2026-11-05, 구글 로그인에서 변경)
- ~~주인 확인 질문 기능 포함 여부~~ → **포함, 6단계에서 구현 완료**(2026-11-06). 정답은 `item_secrets`에만 저장, 서버가 service_role 키로 읽어 비교(글자가 같거나 AI가 같은 뜻이라고 판단하면 통과, 3번 틀리면 10분 잠금)
- ~~사용할 AI 모델~~ → **OpenAI `gpt-5.4-mini`**로 결정 (2026-11-06, Claude Sonnet 5.5에서 변경). 키는 `OPENAI_API_KEY`(서버 전용), 모델 이름은 `OPENAI_MODEL`로 바꿀 수 있음. 호출은 Chat Completions + JSON 스키마(structured output)
- ~~서비스 이름~~ → **찾아zoom으로 결정** (2026-11-05)

## 운영 메모 (현재 상태)
- 배포: https://jusweossda.vercel.app — Vercel 프로젝트 `jusweossda`, main에 push하면 자동 배포
- 환경변수(`.env.local`과 Vercel에 같은 이름으로): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용),
  `KAKAO_REST_API_KEY`(서버 전용), `NEXT_PUBLIC_KAKAO_JS_KEY`(공개용, 카카오에 도메인 등록), `OPENAI_API_KEY`(서버 전용)
  - Windows PowerShell 5.1에서 `|`로 값을 넘기면 BOM(보이지 않는 문자)이 붙어 URL·키가 망가짐 → 값은 BOM 없는 파일을 만들어 `< 파일`로 넘길 것
- DB 마이그레이션은 `supabase/migrations/`에 있고 Supabase 대시보드 SQL Editor에서 직접 실행함 (적용 완료: items·secrets·profiles, 아이디 숨김, 임베딩, 쪽지, 확인 질문)
- AI 검색: 임베딩(pgvector)은 OpenAI 프로젝트에 임베딩 모델 권한이 없어 지금은 못 씀 → **벡터 없이 AI가 최신 글 30개를 직접 비교**하는 방식으로 동작.
  권한이 열리면(`text-embedding-3-small`) 새 글부터 자동으로 벡터가 만들어지고 벡터 검색을 먼저 씀 (코드는 이미 준비됨)
- 시연용 샘플: 계정 `demo_sample`(닉네임 "샘플")이 올린 글 15개. 이 계정을 지우면 샘플 글도 함께 지워짐
- 시험용 계정: `zz_test_0001`, `zz_test_0002` (시연 전에 Supabase Authentication → Users에서 지워도 됨)
- 알려진 한계: 로그인 없는 AI 대화의 횟수 제한은 서버 메모리 방식(시연용), 확인 질문 잠금도 같은 방식
## 작업 규칙
- **한 번에 한 단계만** 진행. 큰 기능은 먼저 계획을 보여주고 승인받은 뒤 구현
- 각 작업이 끝나면: 무엇을 했는지 짧게 요약 + 내가 직접 확인하는 방법(어떤 화면에서 무엇을 눌러보면 되는지)
- 로그인, API 키 입력, 결제가 필요한 작업은 멈추고 나에게 요청
- 패키지 추가 전에는 왜 필요한지 한 줄로 설명
- 테이블 생성·삭제, 데이터 삭제, `git push --force` 같은 되돌리기 어려운 작업은 실행 전에 확인받기
- 비밀 키는 `.env.local`과 Vercel 환경변수에만. `.env*`는 반드시 `.gitignore`에 포함, 절대 커밋 금지
- AI·카카오 API 호출은 서버(API Route)에서만. 키가 브라우저 코드에 들어가면 안 됨
- 커밋 메시지는 한국어로 짧게 (예: `feat: 카메라 촬영 화면 추가`)
- 작업 단위가 끝날 때마다 한국어 커밋 메시지로 커밋할 것 (커밋하면 post-commit 훅이 자동으로 GitHub에 push함)
- 환경: Windows + PowerShell. 터미널 명령은 PowerShell 기준으로 안내
- 카메라·위치는 HTTPS에서만 동작 → 휴대폰 테스트는 Vercel 배포 주소나 cloudflared 터널 사용

## UI 원칙
- 모바일 우선, 큰 버튼, 한 화면에 한 가지 행동
- 로딩 중에는 무엇을 하고 있는지 표시 (예: "위치 확인 중…", "AI가 글을 쓰고 있어요…")
- 에러는 사용자가 이해할 수 있는 한국어 문장 + 다음에 할 행동 제시
