-- =====================================================================
-- [추가 마이그레이션] 인트로 영상 슬라이더(#nwHero) + 팝업 설정
-- 이미 schema.sql / seed.sql 을 실행한 프로젝트라면 이 파일만 1회 실행하세요.
-- (처음 설치라면 schema.sql → seed.sql 에 이미 포함되어 있으므로 실행하지 않아도 됩니다.)
-- =====================================================================

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
-- ---------- 인트로 영상 슬라이더 (#nwHero) ----------
insert into public.site_settings (key, value) values
('intro', jsonb_build_object('duration', 6000, 'video_pos', 'center', 'show_scroll_hint', true)),
('popup', jsonb_build_object('align', 'left', 'pc_max_w', 540, 'pc_max_h', 720))
on conflict (key) do nothing;

insert into public.intro_slides (sort, eyebrow, title, media_type, video_url, vimeo_url, poster_url)
select * from (values
  (0, 'HTU GLOBAL HOLDINGS', E'건강한 아름다움\n새로운 기회의 시작', 'local-video', './video/htu-001.mp4', null, './img/htu-1.jpg'),
  (1, 'HTU GLOBAL HOLDINGS', E'올바른 건강 정보와\n소비의 기준을 만들고', 'vimeo', null, 'https://vimeo.com/1172820402', './img/forum1.jpg'),
  (2, 'HTU GLOBAL HOLDINGS', E'건강한 기업의 성장을 도와\n혁신과 일자리를 창출하는', 'vimeo', null, 'https://vimeo.com/1167068855', './img/intro3-3.jpg'),
  (3, 'HTU GLOBAL HOLDINGS', E'글로벌 뷰티·헬스\n비즈니스 파트너', 'vimeo', null, 'https://vimeo.com/1167074197', './img/program1.jpg'),
  (4, '에이치티유 글로벌 홀딩스', 'HTU GLOBAL HOLDINGS', 'vimeo', null, 'https://vimeo.com/1167069196', './img/earth.jpg')
) as v(sort, eyebrow, title, media_type, video_url, vimeo_url, poster_url)
where not exists (select 1 from public.intro_slides);

-- ---------- 기존 메인 팝업(10-poster) 이미지 팝업으로 등록 (비노출 상태) ----------
insert into public.popups (sort, active, title, image_url, link_url, link_new_tab)
select 0, false, '10회 컨퍼런스 포스터', './img/10-poster.jpg', 'https://mindwellpath.co.kr/conference-10-htu.html', false
where not exists (select 1 from public.popups where image_url = './img/10-poster.jpg');
