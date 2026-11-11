-- =====================================================================
-- 비어 있는 메뉴만 현재 사이트 메뉴로 채우기 (헤더 · 푸터 · 패밀리 사이트)
--   · 이미 관리자에서 만든 메뉴가 있으면 그 위치는 건드리지 않습니다 (덮어쓰지 않음)
--   · 여러 번 실행해도 안전합니다
-- =====================================================================
insert into public.site_settings (key, value) values
('header', jsonb_build_object('logo_url', './img/logo-g-htu.png', 'logo_light_url', './img/logo-w.png', 'logo_text', 'HTU GLOBAL HOLDINGS', 'logo_height', 36)),
('footer', jsonb_build_object(
  'logo_url', './img/logo-w.png', 'logo_text', 'HTU GLOBAL HOLDINGS',
  'slogan', E'세계를 더욱 아름답고 건강하게\n만들어가는 뷰티, 헬스 글로벌 플랫폼',
  'company', 'HTU GLOBAL HOLDINGS', 'biz_no', '581-81-03408', 'ceo', '이유리',
  'address', '강남구 역삼로 114, 현죽빌딩 8층 8016호', 'tel', '', 'fax', '', 'email', '', 'extra', '',
  'copyright', E'COPYRIGHT © 2025 HTU GLOBAL HOLDINGS\nALL RIGHTS RESERVED', 'related_label', '패밀리 사이트'))
on conflict (key) do nothing;

do $htu_menus$
declare p uuid;
begin
  -- 헤더 메뉴
  if not exists (select 1 from public.menu_items where location = 'header') then
    insert into public.menu_items (location, sort, label, link_type, url) values
      ('header', 0, '회사소개', 'internal', './introduce.html'),
      ('header', 1, '대표 인사말', 'internal', './ceo.html'),
      ('header', 2, '비전 & 철학', 'internal', './vision.html'),
      ('header', 5, '오시는 길', 'internal', './location.html');
    insert into public.menu_items (location, sort, label, link_type) values ('header', 3, '산하 독립 연구소', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url, new_tab) values ('header', p, 0, '비즈니스 혁신 연구소', 'external', 'https://biznovalab.com', true);
    insert into public.menu_items (location, sort, label, link_type) values ('header', 4, '소식', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values
      ('header', p, 0, 'News & Event', 'internal', './news.html'),
      ('header', p, 1, '이벤트', 'internal', './event.html'),
      ('header', p, 2, '공지사항', 'internal', './notice.html');
  end if;

  -- 푸터 메뉴 (제목 → 링크)
  if not exists (select 1 from public.menu_items where location = 'footer') then
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 0, '회사소개', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values ('footer', p, 0, '회사소개', 'internal', './introduce.html');
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 1, '대표 인사말', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values ('footer', p, 0, '대표 인사말', 'internal', './ceo.html');
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 2, '비전 & 철학', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values ('footer', p, 0, '비전 & 철학', 'internal', './vision.html');
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 3, '산하 독립 연구소', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url, new_tab) values ('footer', p, 0, '비즈니스 혁신 연구소', 'external', 'https://biznovalab.com', true);
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 4, '소식', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values
      ('footer', p, 0, 'News & Event', 'internal', './news.html'),
      ('footer', p, 1, '이벤트', 'internal', './event.html'),
      ('footer', p, 2, '공지사항', 'internal', './notice.html');
    insert into public.menu_items (location, sort, label, link_type) values ('footer', 5, '오시는 길', 'none') returning id into p;
    insert into public.menu_items (location, parent_id, sort, label, link_type, url) values ('footer', p, 0, '오시는 길', 'internal', './location.html');
  end if;

  -- 패밀리 사이트
  if not exists (select 1 from public.menu_items where location = 'related') then
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
  end if;
end $htu_menus$;
