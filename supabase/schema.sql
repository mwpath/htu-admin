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
