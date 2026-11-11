# HTU 홈페이지 관리자 (Next.js 14 · Supabase · Vercel)

```
Vercel 주소 (예: https://htu-cms.vercel.app)
 ├─ /            → 관리자 페이지로 자동 이동
 ├─ /admin       → 관리자 (로그인 필요)
 └─ /api/public  → 기존 사이트가 내용을 받아가는 주소

기존 사이트 (https://htuglobal.com — 지금 서버 그대로)
 ├─ index.html   → 홈페이지 (관리자에서 받은 파일로 교체)
 ├─ news.html    → News & Event 목록 / 내부 작성 글
 ├─ notice.html  → 공지사항 목록 / 상세 (첨부파일)
 └─ event.html   → 이벤트 목록 / 상세 (진행중·예정·종료 자동, 신청 버튼, 첨부파일)

모든 페이지 공통: 헤더 메뉴 · 푸터를 관리자에서 편집 (menu3.js / footer.js 대체)
```

Vercel에서는 **관리자 페이지만** 열립니다. 사이트 화면은 기존 서버에서 그대로 서비스되고, 내용만 관리자에서 받아옵니다.

---

## 1. Supabase

1. 새 프로젝트를 만듭니다 (Region: Seoul).
2. **SQL Editor**에서 `supabase/schema.sql` → `supabase/seed.sql` 순서로 실행합니다. 현재 홈페이지 내용이 그대로 들어갑니다.
   - 예전 버전 SQL을 이미 실행했다면 아직 실행하지 않은 마이그레이션만 순서대로 실행하세요.
     `migration-002-intro.sql` (인트로 영상) → `migration-003-menu-events.sql` (이벤트·메뉴·푸터·첨부파일)
     여러 번 실행해도 중복되지 않습니다.
3. **Authentication → Users → Add user**로 관리자 계정을 만듭니다 (Auto Confirm 체크).
4. SQL Editor에서 관리자로 등록합니다 (이메일만 바꿔서 실행).
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'admin@example.com'
   on conflict (user_id) do nothing;
   ```
5. 권장: **Authentication → Providers → Email → Allow new users to sign up = OFF**
6. **Project Settings → API Keys → Legacy API Keys** 탭에서 `anon public` 키, **Data API**에서 Project URL을 복사합니다.

## 2. GitHub → Vercel

Vercel에 로그인한 GitHub 계정(같은 계정)에 저장소를 만들고 올립니다.
```bash
git init
git config user.email "Vercel에 연결된 GitHub 계정 이메일"
git add . && git commit -m "HTU CMS"
git branch -M main
git remote add origin https://github.com/<계정>/htu-cms.git
git push -u origin main
```
Vercel → Add New → Project → 저장소 선택 → **Environment Variables**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 |
| `NEXT_PUBLIC_SITE_URL` | (선택) Vercel 주소. 비워두면 자동 |

배포 후 Vercel 주소로 접속 → 관리자 로그인 화면이 나오면 성공입니다.

## 3. 기존 사이트 연결

1. 관리자 **대시보드 → 기존 사이트 연결**에서 `index.html` · `news.html` · `notice.html` · `event.html` 을 다운로드합니다.
   연결 주소(`HTU_CMS_ENDPOINT`)는 이미 들어가 있습니다.
2. 기존 서버에 올립니다. 기존 index.html 은 백업한 뒤 교체하세요.
   img · video · css · js 폴더는 그대로 둡니다. 메뉴·푸터는 관리자에서 관리하므로 menu3.js · footer.js 는 더 이상 불러오지 않습니다.
3. **기본 설정 → 기존 사이트 주소**가 실제 도메인(`https://htuglobal.com`)인지 확인합니다.
   내부 뉴스 글·공지 링크와 미리보기에 쓰입니다.

> 관리자에서 문구나 이미지를 바꿀 때는 파일을 다시 받을 필요가 없습니다. 파일을 다시 받는 건 섹션 디자인(코드)을 바꿨을 때뿐입니다.

---

## 관리자 메뉴

| 메뉴 | 수정 가능한 내용 |
|---|---|
| 기본 설정 | 기존 사이트 주소, 섹션 제목·버튼 문구, 자동 넘김 간격, 랜덤 재생 |
| ⓪ 인트로 영상 | 맨 위 전체화면 슬라이드 — Vimeo / mp4 업로드 / 이미지, 문구, 포스터 |
| ① 메인 슬라이더 | 인트로 문구, 슬라이드, 배경 이미지, 링크·패밀리사이트 버튼 |
| 패밀리사이트 팝업 | 그룹 문구, 사이트 목록·링크 |
| ② 파트너 로고 | 롤링 / 고정 로고, 클릭 동작(팝업·링크), 팝업 내용 |
| ③ 정기 출간물 | 표지·이름·링크, 클릭 동작(링크·팝업) |
| ④ 전문가 연재 | 표지·이름·연재 제목·PDF 링크 |
| ⑤ 영상 | 오토플레이 릴(랜덤 재생), 유튜브 갤러리 |
| ⑥ News & Event | 외부 링크 / 직접 작성 (이미지·유튜브 삽입 에디터) |
| 공지사항 | 작성·수정·삭제, 상단 고정, 첨부파일 |
| 이벤트 | 기간·장소·대표 이미지·신청 링크·상세 내용·첨부파일, 외부 페이지 연결 |
| 헤더 메뉴 | 로고(기본/흰색), 상위·하위 2단 메뉴, 강조 버튼 — 링크 종류: 내부 페이지 · #섹션 · 외부(새 창) |
| 푸터 · 관련 사이트 | 회사 정보, 메뉴 컬럼, FAMILY SITE 드롭다운, SNS 아이콘, 개인정보처리방침 등 정책 링크 |
| 메인 팝업 | 이미지 팝업, 게시 기간 예약, 오늘 보지 않기, PC 위치 |

목록마다 드래그로 순서 변경, 노출/숨김, 복제, 삭제, 미리보기가 됩니다. 저장 후 약 30초 안에 기존 사이트에 반영됩니다.

## 폴더 구조
```
app/admin/              관리자 화면
app/admin/files/[file]  기존 사이트용 파일 다운로드 (로그인 필요)
app/api/public/         기존 사이트가 호출하는 공개 API (CORS 허용)
sections/               기존 사이트 섹션 코드 원본 (디자인 수정은 여기서)
  standalone/           기존 사이트 head(메타·메뉴) / foot(푸터)
  00-site-header.html   헤더 (메뉴)
  99-site-footer.html   푸터
  board/board.html      news.html · notice.html · event.html 화면
scripts/build-home.mjs  sections → 다운로드용 파일 (빌드 시 자동)
supabase/               DB 스키마 · 초기 데이터
```
