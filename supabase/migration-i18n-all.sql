-- 다국어 설치 (migration-005 + 006 통합본) — 이 파일 하나만 실행하면 됩니다. 여러 번 실행해도 안전합니다.
-- 전제: schema.sql 은 이미 실행된 상태 (관리자 테이블이 있는 DB)

-- ===== 1) 번역 테이블 · 다국어 설정 (migration-005) =====
-- =====================================================================
-- [추가 마이그레이션 005] 다국어 (영어 · 중국어 · 일본어) 자동 번역
-- 기존 프로젝트: 1회 실행 (여러 번 실행해도 안전)
-- =====================================================================

-- 관리자 콘텐츠 번역 (테이블 · 행 · 필드 · 언어 단위)
create table if not exists public.translations (
  id           uuid primary key default gen_random_uuid(),
  source_table text not null,          -- 'notices', 'settings', 'menu_items' ...
  source_id    text not null,          -- 행 id 또는 settings key
  field        text not null,
  lang         text not null check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko'),
  value        jsonb,                  -- 문자열 또는 배열
  source_hash  text not null,          -- 번역 당시 한국어 원문 지문
  status       text not null default 'auto' check (status in ('auto','manual')),
  locked       boolean not null default false,  -- true 면 자동 번역이 덮어쓰지 않음
  updated_at   timestamptz not null default now(),
  unique (source_table, source_id, field, lang)
);
create index if not exists idx_tr_lookup on public.translations (lang, source_table, source_id);

-- 페이지 고정 문구 번역 메모리 (회사소개 등 HTML 에 직접 쓰인 글, 버튼 문구)
create table if not exists public.text_memory (
  id          uuid primary key default gen_random_uuid(),
  hash        text not null,
  lang        text not null check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko'),
  source      text not null,
  value       text not null,
  status      text not null default 'auto' check (status in ('auto','manual')),
  locked      boolean not null default false,
  last_path   text,
  updated_at  timestamptz not null default now(),
  unique (hash, lang)
);

alter table public.translations enable row level security;
drop policy if exists "translations public read" on public.translations;
create policy "translations public read" on public.translations for select to anon, authenticated using (true);
drop policy if exists "translations admin all" on public.translations;
create policy "translations admin all" on public.translations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.text_memory enable row level security;
drop policy if exists "text_memory admin all" on public.text_memory;
create policy "text_memory admin all" on public.text_memory for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 언어 설정
insert into public.site_settings (key, value) values
('i18n', jsonb_build_object('en', true, 'zh', true, 'ja', true, 'detect', 'geo', 'translate_pages', true,
  'glossary', E'HTU GLOBAL HOLDINGS = HTU GLOBAL HOLDINGS (번역하지 않음)\nMAXQ = MAXQ\nMD 저널 = MD Journal\nENDO 저널 = ENDO Journal'))
on conflict (key) do nothing;

-- ===== 2) 20개 언어 · 접속 국가별 자동 언어 (migration-006) =====
-- migration-006: 사이트 언어 확장 (최대 20개 언어) + 접속 국가 기준 자동 언어 선택
-- 이미 migration-005 를 실행한 경우에만 실행하세요. (새로 설치는 schema.sql 에 포함)

alter table public.translations drop constraint if exists translations_lang_check;
alter table public.translations add constraint translations_lang_check check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko');

alter table public.text_memory drop constraint if exists text_memory_lang_check;
alter table public.text_memory add constraint text_memory_lang_check check (lang ~ '^[a-z]{2}(-[a-z]{2})?$' and lang <> 'ko');

-- 자동 선택 방식: 접속 국가 기준(geo) — 기존 '브라우저 언어 자동 선택'이 꺼져 있었다면 그대로 끔
update public.site_settings
set value = value || jsonb_build_object('detect', case when value->>'auto_detect' = 'false' then 'off' else 'geo' end)
where key = 'i18n' and not (value ? 'detect');
