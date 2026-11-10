# HTU 홈페이지 CMS (Next.js 14 · Supabase · Vercel)

홈페이지 7개 섹션 + 공지사항 + 메인 팝업을 **관리자 페이지(/admin)** 에서 수정하는 프로젝트입니다.
섹션 HTML/CSS/JS는 기존 퍼즐 조각 구조(섹션 ID 스코프, 전역 CSS 없음)를 그대로 유지하고, 내용만 Supabase에서 불러옵니다.

```
/              홈페이지 (서버에서 데이터 주입 → 깜빡임 없음)
/admin         관리자 (Supabase 로그인)
/news/[id]     News & Event 내부 작성 글
/notice        공지사항 목록 / 상세
/embed/*.html  다른 사이트(아임웹·카페24·정적 HTML)에 붙여넣는 섹션 조각
/api/public/content  섹션용 공개 JSON (CORS 허용)
```

---

## 1. Supabase 설정 (10분)

1. https://supabase.com 에서 새 프로젝트 생성 (Region: Northeast Asia (Seoul))
2. **SQL Editor** → `supabase/schema.sql` 전체 붙여넣고 Run
3. **SQL Editor** → `supabase/seed.sql` 전체 붙여넣고 Run  ← 현재 홈페이지 내용이 그대로 들어갑니다
4. **Authentication → Users → Add user** 로 관리자 이메일/비밀번호 생성 (Auto Confirm 체크)
5. **SQL Editor** 에서 관리자 등록 (이메일만 바꿔서 실행)
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```
6. 권장: **Authentication → Providers → Email → Allow new users to sign up = OFF** (외부 가입 차단)
7. **Project Settings → API** 에서 `Project URL`, `anon public key` 복사

> 관리자를 추가할 때는 4~5번만 반복하면 됩니다.

## 2. 기존 이미지 옮기기

seed 데이터는 기존 경로(`./img/logo-1.png` 등)를 그대로 씁니다.
기존 사이트의 **img 폴더 안 파일 전부를 `public/img/` 에 복사**하면 그대로 보입니다.
(이후 새 이미지는 관리자에서 업로드하면 Supabase Storage `cms` 버킷에 저장됩니다.)

## 3. GitHub → Vercel 배포

```bash
cd htu-cms
git init && git add . && git commit -m "HTU CMS"
git branch -M main
git remote add origin https://github.com/<계정>/htu-cms.git
git push -u origin main
```

Vercel → **Add New Project** → 저장소 선택 → **Environment Variables** 3개 입력 → Deploy

| 이름 | 값 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_SITE_URL` | 배포 도메인 (예: `https://htu.vercel.app`, 끝에 `/` 없이) |

도메인 연결 후에는 `NEXT_PUBLIC_SITE_URL` 을 실제 도메인으로 바꾸고 Redeploy 하세요.

## 4. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 입력
npm run dev                  # http://localhost:3000 , /admin
```

---

## 관리자 메뉴 ↔ 홈페이지 위치

| 메뉴 | 수정 가능한 내용 |
|---|---|
| 기본 설정 · 섹션 문구 | 사이트 로고·이름, 모든 섹션 제목/버튼 문구, 자동 넘김 간격, 랜덤 재생 |
| ① 메인 슬라이더 | 인트로 문구, 슬라이드 추가/삭제/순서, 배경 이미지, 링크 버튼, 패밀리사이트 버튼 연결 |
| 패밀리사이트 팝업 | 팝업 그룹 문구(제목·설명·특징), 그룹별 사이트 목록·링크·새 창 여부 |
| ② 파트너 로고 | 롤링 로고 / 고정 로고 이미지, 클릭 동작(팝업·링크·없음), 팝업 이미지·문구·버튼 |
| ③ 정기 출간물 | 표지(로고) 이미지·이름·링크, 클릭 동작(링크·팝업), 팝업 문구 |
| ④ 전문가 연재 | 표지·이름·연재 제목·PDF 링크 추가/수정/삭제/순서 |
| ⑤ 영상 | 오토플레이 릴 영상 추가·순서·**랜덤 재생**, 유튜브 갤러리 영상 추가·순서·제목 |
| ⑥ News & Event | **외부 링크** 또는 **직접 작성(내부 글)** — 본문 에디터(이미지 업로드·유튜브 삽입) |
| 공지사항 | 작성/수정/삭제, 상단 고정, 게시일 |
| 메인 팝업 | 이미지·문구·링크, 게시 기간 예약, '오늘 하루 보지 않기' |

모든 목록 공통: 드래그 순서 변경 · ↑↓ · 노출/숨김 토글 · 복제 · 삭제 · 미리보기.
저장하면 `/api/revalidate` 가 캐시를 비워 **즉시** 반영됩니다 (대시보드의 '즉시 반영' 버튼도 동일).

### 클릭 인디케이터 (고정 로고 · 정기 출간물)
- 팝업으로 열리는 항목: 우측 상단 원형 칩에 **＋** 아이콘, 호버 시 '자세히 보기' 라벨이 펼쳐지며 그린 그라데이션으로 전환
- 링크로 이동하는 항목: **↗** 아이콘, 호버 시 '바로가기' 라벨
- 터치 기기: 아이콘만 항상 표시
- 라벨 문구는 기본 설정에서 변경

---

## 다른 사이트에 섹션만 붙여넣기

기존 사이트(빌더 등)를 계속 쓰고 섹션만 이 CMS로 관리하려면:

```html
<!-- 섹션들보다 위에 1회 -->
<script>window.HTU_CMS_ENDPOINT = 'https://htu.vercel.app';</script>

<!-- 이후 /embed/main-slider.html, /embed/partners.html … 코드를 그대로 붙여넣기
     (전체를 한 번에: /embed/all-sections.html) -->
```

## 폴더 구조

```
sections/               ← 홈페이지 섹션 원본 (수정은 여기서)
  css/*.css             ← 기존 섹션 CSS 원본 그대로
  01-main-slider.html … 08-layer-popup.html
scripts/build-home.mjs  ← sections → generated/home-template.js + public/embed/*.html (dev/build 시 자동)
app/route.js            ← 홈페이지 렌더 (데이터 주입)
app/admin/              ← 관리자
app/(public)/           ← 내부 뉴스 글 / 공지사항 페이지
components/admin/       ← CollectionEditor(범용 목록 편집기), RichEditor, SettingsForm …
lib/content.js          ← 섹션용 데이터 가공 (HTML 정화 포함)
supabase/schema.sql     ← 테이블·RLS·Storage
supabase/seed.sql       ← 현재 홈페이지 내용
```

### 섹션 순서 변경 / 새 섹션 추가
`sections/` 파일명 앞 번호 순서대로 홈페이지에 배치됩니다. 파일명 번호만 바꾸면 순서가 바뀝니다.

### 참고
- `Presentation-4`, `Presentation-9` 웹폰트를 쓰고 있다면 `sections/00-head.html` 에 폰트 링크를 추가하세요.
- 보안: 공개 페이지는 anon 키 + RLS(노출 항목만 읽기), 쓰기는 `admin_users` 에 등록된 계정만 가능합니다. 문구의 HTML은 서버에서 허용 태그만 남기고 정화됩니다.
