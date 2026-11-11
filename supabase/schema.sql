-- =====================================================================
-- HTU CMS · Supabase schema
-- Supabase Dashboard → SQL Editor 에서 이 파일 전체를 1회 실행하세요.
-- 실행 순서: schema.sql → seed.sql → (관리자 계정 등록 SQL)
-- =====================================================================

-- gen_random_uuid() 는 Postgres 13+ 기본 내장

-- ---------- 관리자 ----------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- updated_at 공용 트리거 ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- 섹션 공통 문구/설정 (key-value) ----------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- 메인 슬라이더 ----------
create table if not exists public.hero_slides (
  id           uuid primary key default gen_random_uuid(),
  sort         int  not null default 0,
  active       boolean not null default true,
  image_url    text,
  title        text,
  body         text,
  link_label   text,
  link_url     text,
  link_new_tab boolean not null default false,
  family_key   text,
  family_label text default '패밀리사이트',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 패밀리사이트 팝업 (그룹 / 사이트) ----------
create table if not exists public.family_groups (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  sort          int  not null default 0,
  active        boolean not null default true,
  eyebrow       text,
  title         text,
  description   text,
  toolbar_title text,
  toolbar_desc  text,
  note          text,
  meta          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.family_sites (
  id          uuid primary key default gen_random_uuid(),
  group_key   text not null references public.family_groups(key) on update cascade on delete cascade,
  sort        int  not null default 0,
  active      boolean not null default true,
  badge       text default '패밀리 사이트',
  title       text,
  description text,
  url_text    text,
  href        text,
  external    boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- 파트너 로고 (rolling: 무한 롤링 / fixed: 고정 그리드) ----------
create table if not exists public.partner_logos (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'fixed' check (kind in ('rolling','fixed')),
  sort         int  not null default 0,
  active       boolean not null default true,
  logo_url     text,
  alt          text,
  action       text not null default 'popup' check (action in ('popup','link','none')),
  name         text,
  sub          text,
  headline     text default '파트너 소개',
  description  text,
  hero_url     text,
  homepage_url text,
  button_label text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 정기 출간물 ----------
create table if not exists public.publications (
  id           uuid primary key default gen_random_uuid(),
  sort         int  not null default 0,
  active       boolean not null default true,
  cover_url    text,
  caption      text,
  image_border text not null default 'none' check (image_border in ('none','dark','light')),
  action       text not null default 'link' check (action in ('link','popup','none')),
  link_url     text,
  popup_title  text,
  popup_desc   text,
  button_label text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 전문가 연재 ----------
create table if not exists public.expert_columns (
  id         uuid primary key default gen_random_uuid(),
  sort       int  not null default 0,
  active     boolean not null default true,
  image_url  text,
  title      text,          -- 팝업 제목 (data-t)
  card_title text,          -- 카드 위 표시 이름
  subtitle   text,          -- 팝업 부제 (data-s)
  pdf_url    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 영상 (reel: 오토플레이 / gallery: 유튜브 갤러리) ----------
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  placement   text not null default 'gallery' check (placement in ('reel','gallery')),
  sort        int  not null default 0,
  active      boolean not null default true,
  youtube_url text not null,
  title       text,
  excerpt     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- News & Event (external: 외부 링크 / internal: 내부 작성 글) ----------
create table if not exists public.news (
  id            uuid primary key default gen_random_uuid(),
  sort          int  not null default 0,
  active        boolean not null default true,
  type          text not null default 'external' check (type in ('external','internal')),
  title         text not null default '',
  excerpt       text,
  thumbnail_url text,
  external_url  text,
  content_html  text,
  published_at  timestamptz not null default now(),
  view_count    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- 공지사항 ----------
create table if not exists public.notices (
  id           uuid primary key default gen_random_uuid(),
  sort         int  not null default 0,
  active       boolean not null default true,
  pinned       boolean not null default false,
  title        text not null default '',
  content_html text,
  published_at timestamptz not null default now(),
  view_count   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 메인 레이어 팝업 ----------
create table if not exists public.popups (
  id           uuid primary key default gen_random_uuid(),
  sort         int  not null default 0,
  active       boolean not null default false,
  title        text,
  image_url    text,
  body         text,
  link_url     text,
  link_label   text default '자세히 보기',
  link_new_tab boolean not null default true,
  starts_at    timestamptz,
  ends_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 조회수 증가 (내부 글 / 공지) ----------
create or replace function public.bump_view(p_table text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_table = 'news' then
    update public.news set view_count = view_count + 1 where id = p_id and active and type = 'internal';
  elsif p_table = 'notices' then
    update public.notices set view_count = view_count + 1 where id = p_id and active;
  end if;
end $$;
grant execute on function public.bump_view(text, uuid) to anon, authenticated;

-- ---------- 인덱스 ----------
create index if not exists idx_hero_sort      on public.hero_slides (sort);
create index if not exists idx_fsite_group    on public.family_sites (group_key, sort);
create index if not exists idx_partner_kind   on public.partner_logos (kind, sort);
create index if not exists idx_videos_place   on public.videos (placement, sort);
create index if not exists idx_news_sort      on public.news (sort);
create index if not exists idx_notices_order  on public.notices (pinned desc, published_at desc);

-- ---------- RLS + 트리거 일괄 적용 ----------
alter table public.admin_users enable row level security;
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

alter table public.site_settings enable row level security;
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['site_settings','hero_slides','family_groups','family_sites','partner_logos',
                           'publications','expert_columns','videos','news','notices','popups']
  loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$I
                    for each row execute function public.touch_updated_at()', t);
  end loop;

  foreach t in array array['hero_slides','family_groups','family_sites','partner_logos',
                           'publications','expert_columns','videos','news','notices','popups']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s public read" on public.%1$I', t);
    execute format('create policy "%1$s public read" on public.%1$I for select to anon, authenticated using (active)', t);
    execute format('drop policy if exists "%1$s admin all" on public.%1$I', t);
    execute format('create policy "%1$s admin all" on public.%1$I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------- 인트로 영상 슬라이더 (#nwHero) ----------
create table if not exists public.intro_slides (
  id          uuid primary key default gen_random_uuid(),
  sort        int  not null default 0,
  active      boolean not null default true,
  eyebrow     text,
  title       text,
  media_type  text not null default 'vimeo' check (media_type in ('local-video','vimeo','image')),
  video_url   text,          -- mp4 주소 (local-video)
  vimeo_url   text,          -- vimeo 주소 또는 숫자 ID
  poster_url  text,          -- 포스터(로딩 전 / 이미지 슬라이드)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_intro_sort on public.intro_slides (sort);

drop trigger if exists trg_touch_intro_slides on public.intro_slides;
create trigger trg_touch_intro_slides before update on public.intro_slides
  for each row execute function public.touch_updated_at();

alter table public.intro_slides enable row level security;
drop policy if exists "intro_slides public read" on public.intro_slides;
create policy "intro_slides public read" on public.intro_slides for select to anon, authenticated using (active);
drop policy if exists "intro_slides admin all" on public.intro_slides;
create policy "intro_slides admin all" on public.intro_slides for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- 이벤트 ----------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  sort          int  not null default 0,
  active        boolean not null default true,
  title         text not null default '',
  summary       text,
  thumbnail_url text,
  start_date    date,
  end_date      date,
  location      text,
  link_type     text not null default 'internal' check (link_type in ('internal','external')),
  external_url  text,
  apply_url     text,
  apply_label   text default '신청하기',
  content_html  text,
  attachments   jsonb not null default '[]'::jsonb,
  published_at  timestamptz not null default now(),
  view_count    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_events_sort on public.events (sort);

-- ---------- 공지 첨부파일 ----------
alter table public.notices add column if not exists attachments jsonb not null default '[]'::jsonb;

-- ---------- 메뉴 (header / footer / related / sns / policy) ----------
create table if not exists public.menu_items (
  id         uuid primary key default gen_random_uuid(),
  location   text not null check (location in ('header','footer','related','sns','policy')),
  parent_id  uuid references public.menu_items(id) on delete cascade,
  sort       int  not null default 0,
  active     boolean not null default true,
  label      text not null default '',
  link_type  text not null default 'internal' check (link_type in ('internal','external','none')),
  url        text,
  new_tab    boolean not null default false,
  icon       text,           -- sns 아이콘 키 (youtube, instagram, blog, facebook, kakao, x, linkedin, tiktok)
  highlight  boolean not null default false,  -- 헤더 강조 버튼
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_menu_loc on public.menu_items (location, parent_id, sort);

-- ---------- 트리거 / RLS ----------
do $$
declare t text;
begin
  foreach t in array array['events','menu_items'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s public read" on public.%1$I', t);
    execute format('create policy "%1$s public read" on public.%1$I for select to anon, authenticated using (active)', t);
    execute format('drop policy if exists "%1$s admin all" on public.%1$I', t);
    execute format('create policy "%1$s admin all" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------- 조회수: 이벤트 추가 ----------
create or replace function public.bump_view(p_table text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_table = 'news' then
    update public.news set view_count = view_count + 1 where id = p_id and active and type = 'internal';
  elsif p_table = 'notices' then
    update public.notices set view_count = view_count + 1 where id = p_id and active;
  elsif p_table = 'events' then
    update public.events set view_count = view_count + 1 where id = p_id and active;
  end if;
end $$;
grant execute on function public.bump_view(text, uuid) to anon, authenticated;

-- ---------- 다국어 ----------
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


-- ---------- Storage: 이미지 업로드 버킷 ----------
insert into storage.buckets (id, name, public)
values ('cms', 'cms', true)
on conflict (id) do update set public = true;

drop policy if exists "cms admin insert" on storage.objects;
create policy "cms admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cms' and public.is_admin());
drop policy if exists "cms admin update" on storage.objects;
create policy "cms admin update" on storage.objects for update to authenticated
  using (bucket_id = 'cms' and public.is_admin());
drop policy if exists "cms admin delete" on storage.objects;
create policy "cms admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cms' and public.is_admin());
drop policy if exists "cms public read" on storage.objects;
create policy "cms public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'cms');

-- ===== (자동 포함) migration-006 · 007 =====
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

-- =====================================================================
-- migration-007: 관리자 계정 · 직원 권한 · 연동 키 보관
--   · 첫 대표 관리자 가입 (관리자가 아무도 없을 때만)
--   · 역할: owner(대표 — 전체 + 계정 관리) / admin(전체 편집) / editor(지정한 메뉴만)
--   · 권한은 데이터베이스(RLS)에서 강제됩니다 — 화면을 우회해도 편집 불가
--   · 번역 API 키 · GitHub 업로드 토큰 등은 Vercel 환경변수 대신 이 DB(app_secrets)에 보관
-- 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------- 관리자 계정 ----------
alter table public.admin_users add column if not exists role text not null default 'owner'; -- 기존 관리자는 대표로
alter table public.admin_users alter column role set default 'editor';
alter table public.admin_users add column if not exists permissions text[] not null default '{}';
alter table public.admin_users add column if not exists name text;
alter table public.admin_users add column if not exists active boolean not null default true;
alter table public.admin_users add column if not exists created_by uuid;
alter table public.admin_users add column if not exists updated_at timestamptz not null default now();
-- 로그인 아이디 (영문 소문자 · 숫자 · . _ -  3~30자). 예전 계정은 비어 있을 수 있음(이메일로 로그인)
alter table public.admin_users add column if not exists username text;
alter table public.admin_users drop constraint if exists admin_users_username_check;
alter table public.admin_users add constraint admin_users_username_check check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
create unique index if not exists admin_users_username_key on public.admin_users (username) where username is not null;
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check check (role in ('owner','admin','editor'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and active);
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and active and role = 'owner');
$$;

-- 이 메뉴(섹션)를 편집할 수 있는가
create or replace function public.can_edit(p_section text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and active
      and (role in ('owner','admin') or p_section = any(permissions))
  );
$$;

-- 섹션 설정(site_settings.key) → 권한 이름
create or replace function public.settings_section(p_key text)
returns text language sql immutable as $$
  select case p_key
    when 'intro' then 'intro' when 'hero' then 'hero' when 'partners' then 'partners'
    when 'publications' then 'publications' when 'columns' then 'columns'
    when 'reel' then 'videos' when 'gallery' then 'videos'
    when 'news' then 'news' when 'popup' then 'popups'
    when 'header' then 'menu' when 'footer' then 'footer' when 'i18n' then 'i18n'
    else 'settings' end;
$$;

create or replace function public.menu_section(p_location text)
returns text language sql immutable as $$
  select case when p_location = 'header' then 'menu' else 'footer' end;
$$;

grant execute on function public.is_admin(), public.is_owner(), public.can_edit(text),
  public.settings_section(text), public.menu_section(text) to anon, authenticated;

-- ---------- 첫 가입 ----------
-- 관리자가 한 명이라도 있는가 (로그인 화면에서 '처음 설정' 표시 여부)
create or replace function public.has_any_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users);
$$;
grant execute on function public.has_any_admin() to anon, authenticated;

-- 로그인: 아이디 → 내부 로그인 주소 (이메일을 입력하면 그대로)
create or replace function public.login_email(p_login text)
returns text language sql stable security definer set search_path = public as $$
  select case when position('@' in coalesce(p_login, '')) > 0 then lower(trim(p_login))
              else (select email from public.admin_users where username = lower(trim(p_login)) limit 1) end;
$$;
grant execute on function public.login_email(text) to anon, authenticated;

-- 로그인한 사용자를 첫 대표 관리자로 등록 (관리자가 아무도 없을 때만 성공)
drop function if exists public.claim_first_owner(text);
create or replace function public.claim_first_owner(p_name text default null, p_username text default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); em text;
begin
  if uid is null then return false; end if;
  lock table public.admin_users in share row exclusive mode;
  if exists (select 1 from public.admin_users) then return false; end if;
  select email into em from auth.users where id = uid;
  insert into public.admin_users (user_id, email, name, username, role, active)
  values (uid, em, nullif(trim(coalesce(p_name, '')), ''), nullif(lower(trim(coalesce(p_username, ''))), ''), 'owner', true);
  return true;
end $$;
revoke all on function public.claim_first_owner(text, text) from public, anon;
grant execute on function public.claim_first_owner(text, text) to authenticated;

-- 서버(설치 화면)용: 계정을 만든 뒤 첫 대표로 등록 — 서버 키로만 실행 가능
drop function if exists public.bootstrap_owner(uuid, text, text);
create or replace function public.bootstrap_owner(p_user uuid, p_email text, p_name text, p_username text default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  lock table public.admin_users in share row exclusive mode;
  if exists (select 1 from public.admin_users) then return false; end if;
  insert into public.admin_users (user_id, email, name, username, role, active)
  values (p_user, p_email, nullif(trim(coalesce(p_name, '')), ''), nullif(lower(trim(coalesce(p_username, ''))), ''), 'owner', true);
  return true;
end $$;
revoke all on function public.bootstrap_owner(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_owner(uuid, text, text, text) to service_role;

-- 내 이름 바꾸기 (역할 · 권한은 대표만 변경)
create or replace function public.update_my_profile(p_name text)
returns void language sql security definer set search_path = public as $$
  update public.admin_users set name = nullif(trim(coalesce(p_name, '')), ''), updated_at = now()
  where user_id = auth.uid();
$$;
revoke all on function public.update_my_profile(text) from public, anon;
grant execute on function public.update_my_profile(text) to authenticated;

-- ---------- admin_users 접근 ----------
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin_users owner read" on public.admin_users;
create policy "admin_users owner read" on public.admin_users
  for select to authenticated using (public.is_owner());
drop policy if exists "admin_users owner write" on public.admin_users;
create policy "admin_users owner write" on public.admin_users
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- 마지막 대표 관리자는 삭제 · 강등 · 비활성화 불가
create or replace function public.protect_last_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner' and old.active
     and (tg_op = 'DELETE' or new.role <> 'owner' or not new.active)
     and not exists (select 1 from public.admin_users
                     where role = 'owner' and active and user_id <> old.user_id) then
    raise exception '마지막 대표 관리자는 삭제하거나 권한을 낮출 수 없습니다. 다른 대표 관리자를 먼저 지정하세요.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
drop trigger if exists trg_protect_last_owner on public.admin_users;
create trigger trg_protect_last_owner before update or delete on public.admin_users
  for each row execute function public.protect_last_owner();

-- ---------- 콘텐츠 테이블: 메뉴별 편집 권한 ----------
do $$
declare
  r record; t text; sec text;
  sections constant text[][] := array[
    ['hero_slides','hero'], ['intro_slides','intro'], ['family_groups','family'], ['family_sites','family'],
    ['partner_logos','partners'], ['publications','publications'], ['expert_columns','columns'],
    ['videos','videos'], ['news','news'], ['notices','notices'], ['popups','popups'],
    ['events','events'], ['translations','i18n'], ['text_memory','i18n']];
  i int;
begin
  -- 예전 '관리자 전체 허용' 정책 제거
  for r in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and policyname ilike '%admin%'
      and tablename in ('site_settings','hero_slides','intro_slides','family_groups','family_sites','partner_logos',
                        'publications','expert_columns','videos','news','notices','popups','events','menu_items',
                        'translations','text_memory')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;

  -- 모든 직원: 비공개 항목까지 읽기
  foreach t in array array['site_settings','hero_slides','intro_slides','family_groups','family_sites','partner_logos',
                           'publications','expert_columns','videos','news','notices','popups','events','menu_items',
                           'translations','text_memory'] loop
    execute format('drop policy if exists "%1$s staff read" on public.%1$I', t);
    execute format('create policy "%1$s staff read" on public.%1$I for select to authenticated using (public.is_admin())', t);
    execute format('drop policy if exists "%1$s staff edit" on public.%1$I', t);
  end loop;

  -- 편집: 권한이 있는 메뉴만
  for i in 1 .. array_length(sections, 1) loop
    t := sections[i][1]; sec := sections[i][2];
    execute format('create policy "%1$s staff edit" on public.%1$I for all to authenticated using (public.can_edit(%2$L)) with check (public.can_edit(%2$L))', t, sec);
  end loop;
  create policy "site_settings staff edit" on public.site_settings for all to authenticated
    using (public.can_edit(public.settings_section(key))) with check (public.can_edit(public.settings_section(key)));
  create policy "menu_items staff edit" on public.menu_items for all to authenticated
    using (public.can_edit(public.menu_section(location))) with check (public.can_edit(public.menu_section(location)));
end $$;

-- ---------- 연동 키 보관 (번역 API 키 등) ----------
-- 직원 · 방문자는 읽을 수 없고, 서버(서버 키)만 읽습니다. 저장은 대표 관리자만.
create table if not exists public.app_secrets (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

create or replace function public.set_app_secret(p_key text, p_value text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '대표 관리자만 변경할 수 있습니다.'; end if;
  if p_key not in ('translate_provider','translate_model','anthropic_api_key','deepl_api_key','google_api_key',
                   'github_token','github_repo','github_branch','github_folder','media_url_mode') then
    raise exception '알 수 없는 항목: %', p_key;
  end if;
  if p_value is null or trim(p_value) = '' then
    delete from public.app_secrets where key = p_key;
  else
    insert into public.app_secrets (key, value, updated_at, updated_by) values (p_key, trim(p_value), now(), auth.uid())
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  end if;
end $$;
revoke all on function public.set_app_secret(text, text) from public, anon;
grant execute on function public.set_app_secret(text, text) to authenticated;

-- 저장 여부만 보여줌 (키 값은 끝 4자리만)
create or replace function public.app_secret_status()
returns table (key text, hint text, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.key,
         case when s.key like '%\_key' or s.key like '%\_token' then '••••' || right(s.value, 4) else s.value end,
         s.updated_at
  from public.app_secrets s
  where public.is_owner();
$$;
revoke all on function public.app_secret_status() from public, anon;
grant execute on function public.app_secret_status() to authenticated;

-- ---------- DB 버전 (관리자 화면이 업데이트 필요 여부를 확인) ----------
create or replace function public.htu_schema_version()
returns int language sql immutable as $$ select 9 $$;
grant execute on function public.htu_schema_version() to anon, authenticated;
