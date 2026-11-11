# HTU 홈페이지 관리자 (Next.js 14 · Supabase · Vercel)

```
Vercel 주소 (예: https://htu-cms.vercel.app)
 ├─ /            → 관리자 페이지로 자동 이동
 ├─ /admin       → 관리자 (로그인 필요)
 └─ /api/public  → 기존 사이트가 내용을 받아가는 주소

기존 사이트 (https://htuglobal.com — 지금 서버 그대로)
 ├─ js/htu-cms-config.js → 관리자 연결 주소 (사이트 전체가 이 파일 하나 사용)
 ├─ menu3.js · js/footer.js → 기존 디자인 그대로, 메뉴·푸터를 관리자 데이터로 표시 (모든 페이지)
 ├─ index.html   → 홈페이지 (관리자에서 받은 파일로 교체)
 ├─ news.html    → News & Event 목록 / 내부 작성 글
 ├─ notice.html  → 공지사항 목록 / 상세 (첨부파일)
 └─ event.html   → 이벤트 목록 / 상세 (진행중·예정·종료 자동, 신청 버튼, 첨부파일)

회사소개·대표 인사말·비전·오시는 길 등 기존 서브 페이지는 HTML 수정 없이 menu3.js / footer.js 교체만으로 연동됩니다.
```

Vercel에서는 **관리자 페이지만** 열립니다. 사이트 화면은 기존 서버에서 그대로 서비스되고, 내용만 관리자에서 받아옵니다.

---

## 1. Supabase

1. 새 프로젝트를 만듭니다 (Region: Seoul).
2. **SQL Editor**에서 `supabase/schema.sql` → `supabase/seed.sql` 순서로 실행합니다. 현재 홈페이지 내용이 그대로 들어갑니다.
   - 예전 버전 SQL을 이미 실행했다면 아직 실행하지 않은 마이그레이션만 순서대로 실행하세요.
     `migration-002-intro.sql` (인트로 영상) → `migration-003-menu-events.sql` (이벤트·메뉴·첨부파일)
     → `migration-004-site-menus.sql` (헤더·푸터를 현재 htuglobal.com 메뉴로 설정 — 메뉴를 덮어씀)
     → `migration-005-i18n.sql` (다국어 자동 번역) → `migration-006-languages.sql` (20개 언어 · 접속 국가별 자동 언어)
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

1. 전달받은 사이트 완성본(htu-site.zip)을 서버에 덮어쓰거나, 관리자 **대시보드 → 기존 사이트 연결**에서
   `js/htu-cms-config.js` · `menu3.js` · `js/footer.js` · `index.html` · `news.html` · `notice.html` · `event.html` 을 받아 올립니다.
2. 연결 주소는 `js/htu-cms-config.js` 한 곳에만 있습니다. 관리자에서 받은 파일은 주소가 이미 들어가 있습니다.
   img · video · css 폴더는 그대로 둡니다.
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
  standalone/           기존 사이트 head / foot, menu3.js · footer.js (관리자 연동판), htu-cms-config.js
  board/board.html      news.html · notice.html · event.html 화면
scripts/build-home.mjs  sections → 다운로드용 파일 (빌드 시 자동)
supabase/               DB 스키마 · 초기 데이터
```


---

## 다국어 (최대 20개 언어 자동 번역 · 접속 국가별 자동 언어)

관리자에서 **한국어로만** 저장하면 영어·중국어·일본어가 자동으로 만들어지고, 사이트 헤더의 🌐 버튼에서 언어를 고르면 그 언어로 보입니다.

**자동 번역되는 것**
- 관리자에서 관리하는 모든 글: 섹션 문구, 슬라이드, 로고 설명, 출간물, 연재, 영상 제목, News & Event, 공지사항, 이벤트, 팝업, 헤더·푸터 메뉴, 푸터 정보
- 회사소개 · 대표 인사말 등 HTML 에 직접 쓰인 페이지 문구와 버튼 문구 (처음 방문할 때 한 번 번역 후 저장)

**설정 (한 번만)**
1. Supabase SQL Editor 에서 `supabase/migration-005-i18n.sql` → `migration-006-languages.sql` 실행 (새로 설치는 schema.sql 에 포함됨)
2. Vercel → Settings → Environment Variables 추가 후 **Redeploy**
   | 이름 | 값 |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` (**secret**, `NEXT_PUBLIC_` 붙이지 말 것) |
   | `TRANSLATE_PROVIDER` | `anthropic` (기본) · `deepl` · `google` 중 하나 |
   | `ANTHROPIC_API_KEY` | console.anthropic.com 에서 발급 (provider 가 anthropic 일 때) |
   | `DEEPL_API_KEY` / `GOOGLE_TRANSLATE_API_KEY` | 해당 엔진을 쓸 때만 |
   | `CRON_SECRET` | 아무 긴 임의 문자열 (매일 새벽 3시 자동 점검용) |
3. 사이트에 `js/htu-i18n.js` 를 올리고 (언어 목록이 들어 있으므로 언어를 추가한 뒤에는 이 파일도 새로 받아 올리세요) `menu3.js`, `js/footer.js`, `index.html`, `news.html`, `notice.html`, `event.html` 을 새 버전으로 교체
   (관리자 대시보드 → 사이트 연동 파일에서 내려받거나 htu-site.zip 사용)
4. 관리자 → **다국어 → 🌐 번역 관리** → `지금 전체 번역` 한 번 실행

**동작 방식**
- 저장할 때마다 바뀐 한국어 문구만 골라 번역합니다 (나머지는 그대로 → 비용 최소).
- 번역을 직접 고치면 **잠금**되어 자동 번역이 덮어쓰지 않습니다. 한국어 원문이 바뀌면 ‘검토 필요’로 표시됩니다.
- 번역 용어집에 `한국어 = 번역어` 형식으로 회사명·브랜드명을 적어두면 그대로 지켜집니다.
- 이미지 안에 들어간 글자는 번역되지 않습니다. 필요하면 언어별 이미지를 따로 만드세요.

**접속 국가별 자동 언어**
- 처음 방문하면 Vercel 이 알려주는 접속 국가로 언어를 정합니다: 한국 → 한국어, 일본 → 일본어, 베트남 → 베트남어, 대만·홍콩 → 번체, 브라질 → 포르투갈어 …
- 그 나라 언어가 꺼져 있으면 브라우저 언어 → 영어 순으로 대신 보여줍니다.
- 방문자가 🌐 메뉴에서 직접 고른 언어는 항상 우선하고 계속 유지됩니다. 자동 선택 결과는 7일마다 다시 확인합니다.
- 관리자 → 번역 관리 → 사이트 언어에서: 사용할 언어 켜기/끄기(20개), 자동 선택 방식(국가 · 브라우저 · 항상 한국어), 국가별 예외(`SG = zh`).
- 지원 언어: 한국어, 영어, 일본어, 중국어(간체·번체), 베트남어, 태국어, 인도네시아어, 말레이어, 필리핀어, 힌디어, 몽골어, 러시아어, 우즈베크어, 스페인어, 포르투갈어, 프랑스어, 독일어, 아랍어, 튀르키예어.
  언어를 더 추가하려면 `lib/i18n/langs.js` 의 목록에 한 줄 추가하면 관리자 · 사이트 모두 자동 반영됩니다.
- DeepL 은 베트남어·태국어·말레이어·필리핀어·힌디어·몽골어·우즈베크어를 지원하지 않습니다. DeepL 을 쓰면 이 언어들은 `GOOGLE_TRANSLATE_API_KEY` 또는 `ANTHROPIC_API_KEY` 가 있을 때 자동으로 그 엔진을 사용합니다.
- 여러 언어를 동시에 번역합니다 (`TRANSLATE_CONCURRENCY`, 기본 4).
