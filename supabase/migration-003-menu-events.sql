-- =====================================================================
-- [추가 마이그레이션 003] 이벤트 게시판 · 첨부파일 · 헤더/푸터 메뉴
-- 기존 프로젝트: 이 파일만 SQL Editor 에서 1회 실행 (여러 번 실행해도 안전)
-- 새 프로젝트: schema.sql → seed.sql 에 포함되어 있으므로 실행 불필요
-- =====================================================================

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
-- (헤더/푸터 기본 메뉴는 migration-004-site-menus.sql 에서 현재 사이트 기준으로 설정합니다)
