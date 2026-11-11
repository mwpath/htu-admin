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
-- ---------- 헤더 / 푸터 설정 ----------
insert into public.site_settings (key, value) values
('header', jsonb_build_object(
  'logo_url', '', 'logo_light_url', '', 'logo_text', 'HTU GLOBAL', 'logo_height', 34
)),
('footer', jsonb_build_object(
  'logo_url', '', 'logo_text', 'HTU GLOBAL HOLDINGS',
  'company', '(주)에이치티유 글로벌 홀딩스', 'ceo', '', 'address', '', 'biz_no', '',
  'tel', '', 'fax', '', 'email', '', 'extra', '',
  'copyright', 'Copyright © HTU GLOBAL HOLDINGS. All rights reserved.',
  'related_label', 'FAMILY SITE'
))
on conflict (key) do nothing;

-- ---------- 기본 메뉴 (관리자 > 메뉴 관리에서 자유롭게 수정) ----------
do $$
declare h1 uuid; h2 uuid; h3 uuid; h4 uuid; f1 uuid; f2 uuid; f3 uuid;
begin
  if exists (select 1 from public.menu_items) then return; end if;

  insert into public.menu_items (location, sort, label, link_type, url) values ('header', 0, 'HTU 소개', 'internal', '#mainSliderPack') returning id into h1;
  insert into public.menu_items (location, sort, label, link_type, url) values ('header', 1, '파트너', 'internal', '#partner-logo-slider-section') returning id into h2;
  insert into public.menu_items (location, sort, label, link_type, url) values ('header', 2, '출간·연재', 'none', null) returning id into h3;
  insert into public.menu_items (location, sort, label, link_type, url) values ('header', 3, '소식', 'none', null) returning id into h4;
  insert into public.menu_items (location, parent_id, sort, label, link_type, url) values
    ('header', h3, 0, '정기 출간물', 'internal', '#youtubeVideoSection'),
    ('header', h3, 1, '전문가 연재', 'internal', '#bookshelf-gallery'),
    ('header', h4, 0, 'News & Event', 'internal', './news.html'),
    ('header', h4, 1, '이벤트', 'internal', './event.html'),
    ('header', h4, 2, '공지사항', 'internal', './notice.html'),
    ('header', h4, 3, 'YouTube', 'internal', '#youtubePopupGallerySection');

  insert into public.menu_items (location, sort, label, link_type) values ('footer', 0, 'HTU', 'none') returning id into f1;
  insert into public.menu_items (location, sort, label, link_type) values ('footer', 1, '미디어', 'none') returning id into f2;
  insert into public.menu_items (location, sort, label, link_type) values ('footer', 2, '고객지원', 'none') returning id into f3;
  insert into public.menu_items (location, parent_id, sort, label, link_type, url) values
    ('footer', f1, 0, 'HTU 소개', 'internal', './index.html#mainSliderPack'),
    ('footer', f1, 1, '파트너', 'internal', './index.html#partner-logo-slider-section'),
    ('footer', f2, 0, 'News & Event', 'internal', './news.html'),
    ('footer', f2, 1, '전문가 연재', 'internal', './index.html#bookshelf-gallery'),
    ('footer', f3, 0, '공지사항', 'internal', './notice.html'),
    ('footer', f3, 1, '이벤트', 'internal', './event.html');

  insert into public.menu_items (location, sort, label, link_type, url, new_tab)
  select 'related', row_number() over (order by g.sort, s.sort) - 1, s.title, 'external', s.href, true
    from public.family_sites s join public.family_groups g on g.key = s.group_key
   where s.href is not null and s.href <> '#' and s.href ~ '^https?://';

  insert into public.menu_items (location, sort, label, link_type, url, active) values
    ('policy', 0, '개인정보처리방침', 'internal', '#', false),
    ('policy', 1, '이용약관', 'internal', '#', false);
end $$;
