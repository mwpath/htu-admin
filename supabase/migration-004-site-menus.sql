-- =====================================================================
-- [추가 마이그레이션 004] 헤더 메뉴 · 푸터를 현재 htuglobal.com 사이트 내용으로 설정
-- migration-003 을 실행했던 프로젝트에서 1회 실행하세요.
-- ⚠️ 헤더 메뉴 · 푸터 메뉴 · 패밀리 사이트 목록, 헤더/푸터 설정을 아래 내용으로 덮어씁니다.
--    (이미 관리자에서 메뉴를 직접 고쳤다면 실행하지 마세요)
-- =====================================================================

-- ---------- 헤더 / 푸터 설정 (현재 사이트 기준) ----------
insert into public.site_settings (key, value) values
('header', jsonb_build_object(
  'logo_url', './img/logo-g-htu.png', 'logo_light_url', './img/logo-w.png',
  'logo_text', 'HTU GLOBAL HOLDINGS', 'logo_height', 36
)),
('footer', jsonb_build_object(
  'logo_url', './img/logo-w.png', 'logo_text', 'HTU GLOBAL HOLDINGS',
  'slogan', E'세계를 더욱 아름답고 건강하게\n만들어가는 뷰티, 헬스 글로벌 플랫폼',
  'company', 'HTU GLOBAL HOLDINGS', 'biz_no', '581-81-03408', 'ceo', '이유리',
  'address', '강남구 역삼로 114, 현죽빌딩 8층 8016호',
  'tel', '', 'fax', '', 'email', '', 'extra', '',
  'copyright', E'COPYRIGHT © 2025 HTU GLOBAL HOLDINGS\nALL RIGHTS RESERVED',
  'related_label', '패밀리 사이트'
))
on conflict (key) do update set value = excluded.value;

-- ---------- 메뉴 (현재 사이트 menu3.js / footer.js 기준 + '소식' 메뉴 추가) ----------
do $$
declare h_lab uuid; h_news uuid; f_lab uuid; f_news uuid;
begin
  delete from public.menu_items where location in ('header','footer','related');

  -- 헤더
  insert into public.menu_items (location, sort, label, link_type, url) values
    ('header', 0, '회사소개', 'internal', './introduce.html'),
    ('header', 1, '대표 인사말', 'internal', './ceo.html'),
    ('header', 2, '비전 & 철학', 'internal', './vision.html');
  insert into public.menu_items (location, sort, label, link_type) values ('header', 3, '산하 독립 연구소', 'none') returning id into h_lab;
  insert into public.menu_items (location, sort, label, link_type) values ('header', 4, '소식', 'none') returning id into h_news;
  insert into public.menu_items (location, sort, label, link_type, url) values ('header', 5, '오시는 길', 'internal', './location.html');
  insert into public.menu_items (location, parent_id, sort, label, link_type, url, new_tab) values
    ('header', h_lab, 0, '비즈니스 혁신 연구소', 'external', 'https://biznovalab.com', true),
    ('header', h_news, 0, 'News & Event', 'internal', './news.html', false),
    ('header', h_news, 1, '이벤트', 'internal', './event.html', false),
    ('header', h_news, 2, '공지사항', 'internal', './notice.html', false);

  -- 푸터 메뉴 (컬럼 → 링크)
  with cols(sort, label, child, url, ext) as (values
    (0, '회사소개', '회사소개', './introduce.html', false),
    (1, '대표 인사말', '대표 인사말', './ceo.html', false),
    (2, '비전 & 철학', '비전 & 철학', './vision.html', false),
    (5, '오시는 길', '오시는 길', './location.html', false)
  ), ins as (
    insert into public.menu_items (location, sort, label, link_type)
    select 'footer', sort, label, 'none' from cols returning id, label
  )
  insert into public.menu_items (location, parent_id, sort, label, link_type, url)
  select 'footer', ins.id, 0, cols.child, 'internal', cols.url from ins join cols on cols.label = ins.label;

  insert into public.menu_items (location, sort, label, link_type) values ('footer', 3, '산하 독립 연구소', 'none') returning id into f_lab;
  insert into public.menu_items (location, sort, label, link_type) values ('footer', 4, '소식', 'none') returning id into f_news;
  insert into public.menu_items (location, parent_id, sort, label, link_type, url, new_tab) values
    ('footer', f_lab, 0, '비즈니스 혁신 연구소', 'external', 'https://biznovalab.com', true),
    ('footer', f_news, 0, 'News & Event', 'internal', './news.html', false),
    ('footer', f_news, 1, '이벤트', 'internal', './event.html', false),
    ('footer', f_news, 2, '공지사항', 'internal', './notice.html', false);

  -- 패밀리 사이트 (푸터 드롭다운)
  insert into public.menu_items (location, sort, label, link_type, url, new_tab) values
    ('related', 0, '건강소비자 연대', 'external', 'http://hcn.or.kr/', true),
    ('related', 1, '비즈니스 혁신 연구소', 'external', 'https://biznovalab.com', true),
    ('related', 2, 'MAXQ', 'external', 'https://www.maxq.kr/', true),
    ('related', 3, 'MD 저널', 'external', 'https://www.mdjournal.kr/', true),
    ('related', 4, 'ENDO 저널', 'external', 'https://endo365.kr/', true),
    ('related', 5, '헬스컨슈머', 'external', 'https://www.healthumer.com/', true),
    ('related', 6, '한국뷰티헬시에이징국제교류회', 'external', 'https://kbhga.com/', true),
    ('related', 7, '한국헬시에이징학회', 'external', 'https://khealthyaging.com/', true),
    ('related', 8, '사피엔스 아일랜드', 'external', 'https://www.sapiensland.io/', true);
end $$;
