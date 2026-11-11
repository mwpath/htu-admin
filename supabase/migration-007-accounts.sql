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
