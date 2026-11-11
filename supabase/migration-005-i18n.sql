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
