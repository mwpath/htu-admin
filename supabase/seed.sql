-- =====================================================================
-- HTU CMS · 초기 데이터 (현재 홈페이지 내용 그대로)
-- schema.sql 실행 후 1회 실행하세요. 다시 실행하면 데이터가 중복됩니다.
-- =====================================================================

-- ---------- 섹션 공통 문구/설정 ----------
insert into public.site_settings (key, value) values
('site', jsonb_build_object(
  'name', 'HTU GLOBAL',
  'site_url', 'https://htuglobal.com'
)),
('hero', jsonb_build_object(
  'intro_title', E'HTU는\n건강하고 아름다운\n세상을 만들어갑니다',
  'intro_body',  E'상업적으로 왜곡된 건강 정보가\n넘쳐나는 시대 속에서,\n\n올바른 정보에 기반한\n<b><u>현명한 소비자</u></b>를 만드는 것은\n건강한 사회를 위한\n가장 중요한 출발점입니다.'
)),
('partners', jsonb_build_object(
  'title', E'많은 파트너사와\n세상을 더 건강하게\n바꿔나가고 있습니다.',
  'rolling_speed', 40,
  'popup_label', '자세히 보기',
  'link_label', '바로가기'
)),
('publications', jsonb_build_object(
  'title', '정기 출간물',
  'popup_label', '자세히 보기',
  'link_label', '바로가기'
)),
('columns', jsonb_build_object(
  'title', '전문가 연재',
  'card_button', '연재 보기',
  'pdf_button', 'PDF 파일 보기',
  'auto_delay', 5000
)),
('reel', jsonb_build_object(
  'enabled', true,
  'shuffle', false,
  'reshuffle_each_loop', true
)),
('news', jsonb_build_object(
  'title', 'News & Event',
  'auto_interval', 4200,
  'show_notice_link', true,
  'show_source_badge', true
)),
('gallery', jsonb_build_object(
  'title', 'YouTube Video',
  'shuffle', false,
  'show_title', false,
  'auto_interval', 4200
))
on conflict (key) do update set value = excluded.value;

-- ---------- 패밀리사이트 그룹 ----------
insert into public.family_groups (key, sort, eyebrow, title, description, toolbar_title, toolbar_desc, note, meta) values
('health', 0, 'Health Consumer Network', '건강·소비자 관련 패밀리 사이트', '올바른 정보와 건강한 소비의 기준을 만들어 갑니다.',
  '건강 정보·소비자 관련 사이트', '', '', array['올바른 건강 기준 중심','소비자 친화적인 정보 구조','높은 신뢰도와 전문성']),
('innovation', 1, 'Business Innovation Lab', '혁신·성장 관련 사이트', '기업 혁신과 기업 성장을 돕습니다.',
  '혁신·기업 성장 관련 사이트', '기업 혁신과 실행 전략을 연결하는 사이트를 살펴보세요.',
  '혁신 연구소 중심의 패밀리 사이트는 컨설팅, 교육, 실행 프로젝트 등으로 쉽게 확장 가능합니다.',
  array['실행형 혁신 중심 플랫폼','지속 성장과 고용 창출 방향','기업 연결형 협업 구조']),
('htu', 2, 'HTU Global Holdings', 'HTU 연계 사이트', 'HTU 브랜드와 직접 연결되는 핵심 사이트를 확인해보세요.',
  'HTU 연계 사이트', 'HTU 브랜드와 직접 연결되는 핵심 사이트를 확인해보세요.', '',
  array['건강과 아름다움의 통합 가치','브랜드·연구·네트워크 연결','글로벌 확장형 구조']);

-- ---------- 패밀리사이트 목록 ----------
insert into public.family_sites (group_key, sort, badge, title, description, url_text, href, external) values
('health', 0, '패밀리 사이트', '헬스컨슈머', '건강한 삶은 건강한 소비가 중요한 만큼 대한민국의 양식 있는 전문인과, 의식 있는 소비자, 생각하는 언론인들이 모여 만든 언론', 'healthconsumer.com', 'https://www.healthumer.com/', true),
('health', 1, '패밀리 사이트', 'MD 저널', '26년간 200여 명의 의사들이 직접 참여하여 최신 의학 기사, 논문, 병원 정보, 전문가 칼럼 등을 통해 올바른 의료 정보를 제공하는 잡지', 'mdjournal.kr', 'https://mdjournal.kr', true),
('health', 2, '패밀리 사이트', 'ENDO 저널', '당뇨, 대사질환을 진료하는 개원의들이 참여하여 만든 내분비전문의학저널. 대사질환을 진료하는 개원의를 위한 진료정보 및 진료 현장에 도움주는 임상저널', 'endojournal.kr', 'https://endo365.kr/', true),
('health', 3, '패밀리 사이트', 'MAXQ', '피트니스 스타, 머슬마니아 대회 정보, 운동법, 영양 식단, 라이프스타일 등 건강한 아름다움의 올바른 콘텐츠를 제공', 'maxq.kr', 'https://maxq.kr', true),
('health', 4, '패밀리 사이트', '헬시에이징뉴스', '건강한 노화와 웰에이징 정보를 전달하는 전문 뉴스 플랫폼입니다.', 'healthyagingnews.com', 'https://www.healthyagingnews.kr/', true),
('innovation', 0, '패밀리 사이트', '맥스큐 밸런스랩', '건강한 몸의 균형과 라이프스타일을 연구하는 MAXQ 기반의 건강 연구 플랫폼입니다.', 'maxqbalancelab.com', 'https://maxqbalancelab.com', false),
('innovation', 1, '패밀리 사이트', '뷰티필라', '뷰티와 필라테스를 결합한 새로운 웰니스 프로그램과 교육 콘텐츠를 준비 중인 플랫폼입니다.', 'coming soon', '#', false),
('innovation', 2, '패밀리 사이트', '비만대사증후군연구소', '비만과 대사질환 예방을 위한 연구와 건강 정보를 제공하는 연구 플랫폼입니다.', 'coming soon', '#', false),
('htu', 0, '패밀리 사이트', '사피엔스 아일랜드', '지식 전문가의 인사이트와 초개인화 IT 기술을 결합해, 타인과 자신을 이해하고 삶의 복잡한 문제를 해소하는 솔루션을 제공', 'sapiensland.io', 'https://www.sapiensland.io/', true),
('htu', 1, '패밀리 사이트', '더유리아트앤컬쳐(TUANC)', '예술의 가치로 삶을 더 행복하게, 문화와 예술을 통해 사람과 사회의 건강한 변화를 만들어가는 기업', '홍보 영상', 'https://youtube.com/watch?v=-RH72Q9fbBs&si=bUZsQxWFUVuugi-P', true),
('htu', 2, '패밀리 사이트', '한국헬시에이징학회', '초고령 사회에서 학회는 시대적 사명감과 책임감을 가지고 우리나라 의료 실정에 맞는 "건강문화" 창달과 "헬시 에이징" 방법을 추구하며 초고령 건강사회의 길잡이가 되고자 합니다.', 'khealthyaging.com', 'https://khealthyaging.com/', true),
('htu', 3, '패밀리 사이트', '국제소셜인플루언서협회', '소셜 미디어 시대의 영향력 있는 창작자와 전문가를 연결하는 글로벌 인플루언서 네트워크입니다.', 'isia.or.kr', 'https://isia.or.kr/', true),
('htu', 4, '패밀리 사이트', '한국강사신문', '월 100만명 이상 방문하는 강사 전문 언론사입니다. 초개인화 시대에 맞춰 강사들의 권익을 보호하고 가치를 표현하는데 앞장서고 있습니다.', 'lecturernews.com', 'https://www.lecturernews.com/', true);

-- ---------- 메인 슬라이더 ----------
insert into public.hero_slides (sort, image_url, title, body, link_label, link_url, family_key, family_label) values
(0, './img/aa.jpeg', E'올바른 정보를 통해\n현명한 소비를 돕습니다.',
   E'건강한 사회가 되려면\n소비자가 먼저 현명해져야 하는 만큼\n\n현명한 소비자가 될 수 있도록\nHTU가 올바른 건강 기준을 만들어갑니다.',
   '건강소비자연대', 'http://hcn.or.kr/', 'health', '패밀리사이트'),
(1, './img/lab1.jpg', E'건강한 기업을 성장시켜\n지속 성장과 고용 창출을 도와',
   E'건강한 삶에 가장 큰 영향을 끼치는\n경제적 문제 해결에 기여합니다.',
   '비즈니스 혁신 연구소', 'https://biznovalab.com', 'innovation', '패밀리사이트'),
(2, './img/bg-htu.jpg', E'건강과 아름다움을\n함께 누릴 수 있는 세상',
   E'HTU는 더 나은 삶의 기준을 만드는\n글로벌 헬스·뷰티 파트너입니다.',
   '한국뷰티헬시에이징국제교류회', 'https://kbhga.com/', 'htu', '패밀리사이트');

-- ---------- 정기 출간물 ----------
insert into public.publications (sort, cover_url, caption, image_border, action, link_url, popup_title, popup_desc) values
(0, './img/maxq-10.jpg', 'MAXQ',      'none',  'link', 'https://maxq.kr/', 'MAXQ', null),
(1, './img/md-9.jpg',    'MD 저널',   'dark',  'link', 'https://mdjournal.kr', 'MD 저널', null),
(2, './img/endo-9.jpg',  'ENDO 저널', 'light', 'link', 'https://endo365.kr/', 'ENDO 저널', null);

-- ---------- 공지사항 예시 ----------
insert into public.notices (title, content_html, pinned, active) values
('홈페이지 관리자 시스템이 오픈되었습니다.', '<p>관리자 페이지에서 공지사항을 작성·수정·삭제할 수 있습니다.</p>', true, true);

-- 현재 사이트 콘텐츠 시드 (schema.sql 실행 후 1회 실행)
-- 자동 생성: 원본 섹션 코드에서 추출

-- 파트너 로고 (롤링 / 고정)
insert into public.partner_logos (kind, sort, active, logo_url, alt, action, name, sub, headline, description, hero_url, homepage_url) values
  ('rolling', 0, true, './img/logo-16.png', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 1, true, './img/logo-21.jpg', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 2, true, './img/logo-22.jpg', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 3, true, './img/vixxi.jpg', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 4, true, './img/tuanc.png', 'tuanc', 'none', null, null, null, null, null, null),
  ('rolling', 5, true, 'https://cdn.healthyagingnews.kr/image/logo/toplogo_20250917055858.png', '국민대학교', 'none', null, null, null, null, null, null),
  ('rolling', 6, true, 'https://cdn.quv.kr/ucgyltcdv%2Fup%2F662550ded955f_1920.png', '국민대학교', 'none', null, null, null, null, null, null),
  ('rolling', 7, true, 'https://1644-7484.com/img/layout6/logo5.jpg', '국민대학교', 'none', null, null, null, null, null, null),
  ('rolling', 8, true, 'https://cdn.lecturernews.com/image/logo/toplogo_20200721092355.png', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 9, true, './img/smt-logo.jpeg', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 10, true, './img/logo-10.png', 'KB Investment 로고', 'none', null, null, null, null, null, null),
  ('rolling', 11, true, './img/logo-11.png', 'posco 로고', 'none', null, null, null, null, null, null),
  ('rolling', 12, true, './img/logo-12.png', '화성도시공사 로고', 'none', null, null, null, null, null, null),
  ('rolling', 13, true, './img/logo-14.png', 'Qcells 로고', 'none', null, null, null, null, null, null),
  ('rolling', 14, true, './img/logo-15.png', 'CHEIL TECH 로고', 'none', null, null, null, null, null, null),
  ('rolling', 15, true, './img/logo-ccn.png', '화성도시공사 로고', 'none', null, null, null, null, null, null),
  ('rolling', 16, true, './img/logo-19.png', 'Qcells 로고', 'none', null, null, null, null, null, null),
  ('fixed', 0, true, './img/logo-1.png', '국민대학교 로고', 'popup', '국민대학교', '국민대학교건강미용경영학부', '파트너 소개', '경영학 전반에 대한 학문적 배경과 실무경험을 기반으로 다양한 비즈니스 문제를 파악하고 해결할 수 있는 전문경영인 양성', 'https://kookmin.ac.kr/comm/cmfile/download.do?encFileGrpSeq=9cbff721bda9a64e7a301f1959278d41&encFileSeq=a53bc191e35044c56026b4bb20e06b9c', 'https://healthbeauty.kookmin.ac.kr/lifehb/index.do'),
  ('fixed', 1, true, './img/logo-9.png', '경기도일자리재단 로고', 'popup', '경기도일자리재단', '한 사람의 생명과 삶을 살리는 일자리재단', '파트너 소개', '경기도일자리재단은 경기도민들을 위해 다양한 일자리 정보를 제공하는 기관으로서, 「일할 기회」와 「고용할 기회」를 확대하기 위해 노력하고 있습니다.', 'https://www.jonghapnews.com/news/photo/202506/458564_368372_1743.jpg', 'https://www.gjf.or.kr/main/intro.do'),
  ('fixed', 2, true, './img/logo-3.png', '을지대학교 로고', 'popup', '을지대학교', null, '파트너 소개', '인간사랑, 생명존중’ 을 실천하고 있는 을지대학교의료원으로 국민의료에 앞장서는 인재를 양성하고 있습니다.', 'https://www.uemc.ac.kr/upload/editor/2025_05_28_134327.jpg', 'https://www.eulji.or.kr/'),
  ('fixed', 3, true, './img/logo-4.png', '호서대학교 로고', 'popup', '호서대학교', null, '파트너 소개', '모델 아티스트로서의 실무능력을 기르며 크리에이티브적 교육을 기반으로
모델 이외의 패션전문인으로도 나아갈 수 있도록 교육', 'https://flexible.img.hani.co.kr/flexible/normal/720/464/imgdb/original/2020/0908/211599549133667.png', 'https://koreaart.ac.kr/faculty/model/main.asp'),
  ('fixed', 4, true, './img/logo-5.png', '맥스큐 로고', 'popup', '맥스큐', null, '파트너 소개', '<맥스큐>는 국내 최고의 피트니스 대회인 머슬마니아를 비롯해 국내 및 세계 피트니스 대회 수상자와 몸짱 변신에 성공한 셀럽, 그리고 최강의 전투력을 자랑하는 군 장병 및 간부들의 운동법과 효과적인 다이어트 방법 등을 소개함으로써 국민 건강과 삶의 질 향상을 위해 노력하고 있습니다.', 'https://maxq.kr/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F11545_24884_170-768x432.jpg&w=1200&q=75', 'https://maxq.kr/'),
  ('fixed', 5, true, './img/logo-6.png', 'MD 저널 로고', 'popup', 'MD 저널', '좋은의사·좋은만남', '파트너 소개', '엠디저널은 의사들이 참여하여 만든 의료 ∙ 건강전문지로서 23년간의 의료∙ 건강정보 콘텐츠와 노하우, 그리고 2백여 명의 의사 주주가 의료 ∙ 건강문화 창달에 기여하고 있습니다.', 'https://contents.kyobobook.co.kr/sih/fit-in/400x0/pdt/3904000325361.jpg', 'https://www.mdjournal.kr/'),
  ('fixed', 6, true, './img/logo-13.png', '한국뷰티헬시에이징국제교류회 로고', 'popup', '한국뷰티헬시에이징국제교류회', null, '파트너 소개', '뷰티헬시에이징교류회는 미용과 건강을 결합하여 건강한 미모의 추구를 목표로 하는 국제적인 단체입니다.
우리는 국제적인 최신의 미용 기술과 건강에 대한 과학적 연구를 통해 개인의 외모와 건강을 동시에 촉진하는 데 주 력하고 있습니다.
우리는 모든 사람들이 가능한 한 최고의 건강수준에 도달하는 것(the attainment by all peoples of the highest possible level of health)을 목적으로 설립된 세계보건기구(World Health Organization, WHO)의 신념과 목표를 지지하며 모두의 건강과 더나은 미래를 옹호합니다.', 'https://cdn.imweb.me/upload/S202403144961f3086847e/05523ef512962.jpg', 'https://kbhga.com/'),
  ('fixed', 7, true, './img/logo-8.png', '사피엔스 아일랜드 로고', 'popup', '사피엔스 아일랜드', null, '파트너 소개', '파편화된 지식을 모아 통합적으로 제공하고 인사이트 도출로 이끄는 기업이다. 당금 한국에는 수많은 석학들이 있지만, 이들의 지식을 제대로 정리해 전달할 수 있는 시스템은 없는 것이 현실이다. 그래서 사피엔스아일랜드는 대한민국을 대표하는 지식 전문가들의 강연을 모아, 국민들에게 효율적이고 효과적으로 전달하는 역할을 하고 있다.', './img/sapi.jpg', 'https://www.sapiensland.io/'),
  ('fixed', 8, true, './img/vixxi.jpg', '빅시다이어트 로고', 'popup', '빅시다이어트', 'VIXXI · 분당 정자동 4050 여성 소그룹 운동', '파트너 소개', '갱년기 4050 여성을 위한 5인 이하 소그룹 운동 센터. 덤벨 근력·인터벌 러닝·타바타·매트 필라테스로 구성된 50분 정규 수업(미토온)과 온라인 1:1 코칭으로, 덜 먹어도 늘어나는 체지방을 운동 습관으로 관리합니다.', 'https://www.vixxidiet.com/assets/img/og/og-home.jpg', 'https://www.vixxidiet.com/'),
  ('fixed', 9, true, './img/logo-ksha.png', '한국헬시에이징학회 로고', 'popup', '한국헬시에이징학회', null, '파트너 소개', '국민의 건강관리를 위한 과학적 지침을 수립, 계몽, 홍보, 교육하여 질병을 미리 차단함으로써
건강한 세상을 구현, 서로 행복을 나누어 공유할 수 있는 녹색 건강 혁명을 지향합니다.
연령대, 질환별 예방대책을 체계적으로 수립하여 대중을 파고드는 건강방책을 구축, 개인의 행복과 부강한 국가의 터전을 마련할 것입니다.
사회 원로 및 문화 예술인 그리고 각계각층의 전문가 그룹으로 구성된 센티네리안 포럼(Centenarian Forum)은
정례 행사를 통해 인간의 품위를 고양하는 지적 건강(知的建康)을 함양합니다.', 'https://www.shinmoongo.net/imgdata/shinmoongo_net/202407/2024070222081860.jpg', 'https://khealthyaging.com/'),
  ('fixed', 10, true, './img/logo-7.png', '엔도저널 로고', 'popup', '엔도저널', null, '파트너 소개', 'ENDO CLINIC DOCTOR 커뮤니티가 만든 내분비 전문 저널', 'https://data.endo365.kr/popup/202602/1770018824_a58b8fe789f3111922f8.png', 'https://endo365.kr/'),
  ('fixed', 11, true, './img/logo-hcn.png', '건강소비자연대 로고', 'popup', '건강소비자연대', null, '파트너 소개', '건강한 소비를 위한 정확한 과학적 지식(정보)를 공유하고 확산시키며, 시중에서 건강하고 올바른 제품과 서비스가 확산되게 함으로써 우리들 소비자 스스로가 건강관리의 주체가 될 환경을 조성', 'https://cdn.mdjournal.kr/news/photo/202411/41219_22181_364.jpg', 'http://hcn.or.kr/');

-- 전문가 연재
insert into public.expert_columns (sort, active, image_url, title, card_title, subtitle, pdf_url) values
  (0, true, './img/column1.jpg', '김경일 교수', '김경일 교수', '당신의 얼굴은 당신의 뇌가 만듭니다.', 'https://drive.google.com/file/d/1ymT9M-kdGsT6mSInTX81itOXbqBW-ta1/view?usp=drive_link'),
  (1, true, './img/column5.jpg', '이유리 대표', '이유리 대표', '아름다움은 건강에서 시작됩니다', 'https://drive.google.com/file/d/1l5OxKvSQ57Wsj76fLOy5X8UKAqkHJC-e/view?usp=drive_link'),
  (2, true, './img/column3.jpg', '김경호 박사', '김경호 박사', '몸의 구조가 마음의 구조를 만듭니다', 'https://drive.google.com/file/d/1yMPzL5-nfD7oudweLFrvLsNZVUU1Z7lb/view?usp=drive_link'),
  (3, true, './img/column2.jpg', '유영만 교수', '유영만 교수', '근테크 절대로 망하지 않는 투자', 'https://drive.google.com/file/d/1nBTvYoIG2gQ7FoBrmmpVC4eQ7UDxMrPr/view?usp=drive_link'),
  (4, true, './img/column4.jpg', '조지 더럼', '조지 더럼', '기능적 아름다움 제대로 기능하는 것이 아름답다', 'https://drive.google.com/file/d/1Lk7ogY4s9bvv6klcFhpP7IYslQdk_9bo/view?usp=drive_link'),
  (5, true, './img/column-7.jpg', 'MAXQ 뷰티 멤버', 'MAXQ 뷰티 멤버', 'FIVE VOICES, ONE TRUTH', 'https://drive.google.com/file/d/1_hmG-ASDrEasy6J8pLVxGQjhgzLHb3ZX/view'),
  (6, true, './img/column-lee.png', '이명길 연애코치', '이명길 연애코치', 'CHANGE THE ROOM, NOT THE MAN', 'https://drive.google.com/file/d/1IJwdtgP5_4gCaXhJgi4vD40CQRKZGyMV/view'),
  (7, true, './img/pos-8.jpg', '안현배 예술사학자', '안현배 예술사학자', 'THE ART OF LOOKING
LONGER', 'https://drive.google.com/file/d/18jvoMTzH_RUNOKsd2uRY3n9rHX24L3JA/view?usp=sharing'),
  (8, true, './img/column7.jpg', '이호준 리앤여울 청담점 대표', '이호준 리앤여울 청담 대표', 'THE ART OF LOOKING
LONGER', 'https://drive.google.com/file/d/1NXTybC_vbQzWzb-xAETR6PyVobhwltpV/view?usp=drive_link'),
  (9, true, './img/c-13.jpg', '이재용 배우', '이재용 배우', 'A FACE, MADE BY WORK', 'https://drive.google.com/file/d/1eMaT4TuHRNntGlMf2VAESVkxgi4tNTDk/view?usp=sharing'),
  (10, true, './img/c-12.jpg', '신동엽 (세브란스병원 내분비내과 교수)', '신동엽 (세브란스병원 내분비내과 교수)', 'A FACE, MADE BY WORK', 'https://drive.google.com/file/d/1ssXKN7G1ePiYo5uO9FNiMw607x7MyF7E/view?usp=sharing');

-- 영상 (오토플레이 릴 / 유튜브 갤러리)
insert into public.videos (placement, sort, active, youtube_url, title, excerpt) values
  ('reel', 0, true, 'https://youtu.be/KYl6gc4_6wE', null, null),
  ('reel', 1, true, 'https://youtu.be/ufwNfp5KGT0', null, null),
  ('reel', 2, true, 'https://youtu.be/Hhz9KihAZIE', null, null),
  ('reel', 3, true, 'https://youtu.be/O7HgwKDpVTY', null, null),
  ('reel', 4, true, 'https://youtu.be/5gZPWLko0Ng', null, null),
  ('gallery', 0, true, 'https://youtu.be/vzYs2azDi0s', '유튜브 영상 제목 7', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 1, true, 'https://youtu.be/2TgN2F9zHZ0', '유튜브 영상 제목 7', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 2, true, 'https://www.youtube.com/watch?v=eOxR6Yu_bzE', '유튜브 영상 제목 8', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 3, true, 'https://youtu.be/7LRI62qwTCU', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 4, true, 'https://youtu.be/tYTyRFhQqug', '유튜브 영상 제목 9', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 5, true, 'https://youtu.be/Ih-dimdhARY', '유튜브 영상 제목 10', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 6, true, 'https://www.youtube.com/watch?v=pPQRVndCgPo', '유튜브 영상 제목 9', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 7, true, 'https://youtu.be/oN_VVQlF1F4', '유튜브 영상 제목 10', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 8, true, 'https://youtu.be/b0yyiCBOozY', '유튜브 영상 제목 1', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 9, true, 'https://www.youtube.com/watch?v=WM1HFWKuOh4', '유튜브 영상 제목 2', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 10, true, 'https://youtu.be/FgEszUc-V4A', '유튜브 영상 제목 3', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 11, true, 'https://www.youtube.com/watch?v=44HN81MtUWQ', '유튜브 영상 제목 4', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 12, true, 'https://youtu.be/2t4D4ZKLQNs', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 13, true, 'https://www.youtube.com/watch?app=desktop&v=w-Tagdeu4qM&t=5s', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 14, true, 'https://www.youtube.com/watch?app=desktop&v=FZxCqUi13nA&t=3s&pp=2AEDkAIB', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 15, true, 'https://www.youtube.com/watch?v=iCypnqsUSyA', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 16, true, 'https://youtu.be/NbkmT3eHWWE', '유튜브 영상 제목 6', '여기에 유튜브 영상 설명을 입력하세요.'),
  ('gallery', 17, true, 'https://www.youtube.com/watch?v=YZdvGiYsOls', '유튜브 영상 제목 5', '여기에 유튜브 영상 설명을 입력하세요.');

-- News & Event (외부 링크)
insert into public.news (sort, active, type, title, excerpt, thumbnail_url, external_url) values
  (0, true, 'external', '''건강소비자연대 자원봉사기자단, 워크샵 개최… 기사 작성법부터 ''화제의 기업''과의 만남까지', '건강소비자연대(이하 ''건소연'')의 기관지 헬스컨슈머(주)의 자원봉사 특임기자(이하 특임기자)단 워크숍이 지난 8월 29일 워크숍을 열고, 기사 작성 실무 교육과 기업 특별 강연을 함께 진행했다.', './img/thumbnail.jpeg', 'https://naver.me/F8lzCyja'),
  (1, true, 'external', '''스포츠 재활 산업 발전 논의'' 2026 국가웰니스정책포럼 개최', '민주당 정일영 국회의원이 주최한 ''2026 국가웰니스정책포럼''이 한국피트니스교육연수원에서 열렸습니다. 사단법인 건강소비자연대와 한국피트니스교육연수원이 공동 주관한 이번 포럼에서는 스포츠 재활 산업의 발전 방향과 정책 지원 방안이 논의됐습니다.', 'https://img.vod.mbn.co.kr/vod2/683/2026/05/14/20260514101308_20_683_1418937_1080_7_s1.jpg', 'https://naver.me/x4lFrnHG'),
  (2, true, 'external', '인체조직 스킨부스터 법적 사각지대 미용 목적 사용 철저히 규제해야', '기증 인체조직의 올바른 사용을 위한 합리적 규제 방안 포럼 개최 인체조직 미용 목적 사용 문제 최대 쟁점 규제 시급 한목소리', 'https://www.k-health.com/news/photo/202604/91641_98183_100.jpg', 'https://www.k-health.com/news/articleView.html?idxno=91641'),
  (3, true, 'external', 'KBHGA 2026 한일 국제 뷰티헬시에이징 선포식&전문교육 성료', '2026 KBHGA 한일 국제 뷰티헬시에이징 선포식 및 전문 교육 프로그램’을 성황리에 진행했다고 밝혔다.', 'https://cdn.mdjournal.kr/news/photo/202603/41731_23406_3245.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41731'),
  (4, true, 'external', '뷰티와 헬시에이징, 그리고 삶의 균형을 향해', '대한민국은 급격히 고령화가 진행되는 중, 아니 이미 인구의 20% 이상이 만65세 이상으로 초고령 사회에 돌입했다. 물론 이러한 상황을 그저 슬퍼하고만 있을 필요는 없다. 피할 수 없다면 즐기라는 말처럼, 더 젊고 건강하게 사는 방법을 고민하면 그만이다.', 'https://cdn.mdjournal.kr/news/photo/202510/41577_23057_2719.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41577'),
  (5, true, 'external', '건강소비자연대-숙명여대, 업무협약 체결', '시니어 돌봄 서비스 질 향상 목표... 교육과정 공동 개발 및 취업 연계 ', 'https://healthumer.mycafe24.com/data/editor/2507/69b4d8887d9d595dc4c03c4cb3518b27_1751950880_0171.jpg', 'http://hcn.or.kr/bbs/board.php?bo_table=News&wr_id=32&page=1'),
  (6, true, 'external', '한국뷰티헬시에이징국제교류회 특별 세미나 경희대병원에서 개최', '한국뷰티헬시에이징국제교류회의 특별 세미나가 6월 13일 경희대병원 정보행정동 제1세미나실에서 개최되었다.', 'https://cdn.mdjournal.kr/news/photo/202406/41053_21825_1848.png', 'https://www.mdjournal.kr/news/articleView.html?idxno=41053'),
  (7, true, 'external', '퍼스널 오행 아로마테라피 힐링 콘서트 개최', '국민대학교 장매화 교수[KBHGA 총괄책임교수], 정심권대표[KBHGA 튀르키예 대사]', 'https://cdn.imweb.me/upload/S202403144961f3086847e/10aa1d786e6d1.jpg', 'https://kbhga.com/34/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&bmode=view&idx=109934774&t=board'),
  (8, true, 'external', '건강소비자연대, 국회서 인조육·인공육 포럼 개최', '세포배양육의 국내 산업화를 두고 안전성 검증과 투명한 정보 공개부터 선행돼야 한다는 목소리가 국회에서 제기됐다.', 'https://cdn.mdjournal.kr/news/photo/202512/41646_23197_3919.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41646'),
  (9, true, 'external', '(주)사피엔스아일랜드와 업무협약 체결', '국민 인사이트 플랫폼 기업 ㈜사피엔스아일랜드(대표 송상윤)간에 전략적 업무협약(MOU) 체결식이 진행되었다.', 'https://cdn.mdjournal.kr/news/photo/202511/41606_23120_537.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41606'),
  (10, true, 'external', '한국 뷰티헬시에이징 국제교류회 & 맥스큐 MOU 체결', '2025 맥스큐 머슬매니아·인플루언서 코리아 대회와 함께 진행돼', 'https://cdn.mdjournal.kr/news/photo/202507/41497_22876_2519.jpeg', 'https://kbhga.com/34/?bmode=view&idx=166036234'),
  (11, true, 'external', '제15회 일본 헬시에이징학회 학술 대회 개최', '일본 사단법인 헬시에이징 학회 주최로 제15회 헬시에이징학회 학술대회(학술집회, 學術集會)가 지난해 12월 03일(토) 일본 도쿄 분쿄 시빅 센터에서 거행됐다.', 'https://cdn.mdjournal.kr/news/photo/202401/40803_21402_448.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=40803'),
  (12, true, 'external', 'KBHGA B&H INNOVATION CONCERT 리포트', '‘소비자가 곧 건강한 삶의 주체’라는 주장을 통해 건강 시장에서의 소비자의 인식 전환에 대해 강조했다.', 'https://cdn.mdjournal.kr/news/photo/202504/41411_22693_3717.jpeg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41411'),
  (13, true, 'external', '더유리아트앤컬쳐(TUANC) 이유리 대표를 만나다.', '옛것의 그리움이 담긴 도자기 예술 작품에 마케팅 감성을 더해 문화사업을 펼치다.', 'https://cdn.mdjournal.kr/news/photo/202304/40283_20411_456.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=40283'),
  (14, true, 'external', '(주)헬스투유, 대한생활체육골프협회와 업무협약 체결', '건강과 아름다움, 그리고 스포츠를 통한 새로운 일자리 창출과 국민 건강 증진에 박차', 'https://cdn.mdjournal.kr/news/photo/202508/41524_22940_3554.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41524'),
  (15, true, 'external', '한국뷰티헬시에이징국제교류회 창립 첫 공식 행사 성료', '한류가 전세계에 돌풍을 일으킨지 어언 십수년, 이젠 글로벌 뷰티 시장에서 독보적인 위치로 자리잡은 ''K-뷰티’의 체계적인 시스템 화를 도모하는 취지에서 본 교류회가 시작되었다.', 'https://cdn.mdjournal.kr/news/photo/202404/40987_21691_4642.jpeg', 'https://www.mdjournal.kr/news/articleView.html?idxno=40987'),
  (16, true, 'external', '2025 KBHGA 한일 국제뷰티헬시에이징 선포식 프로그램 성료', '한국뷰티헬시에이징국제교류회 소속 교수진이 주도하여, 일본 연수생들에게 K-뷰티의 핵심 기술과 최신 트렌드를 체계적으로 전달하는 자리로 마련되었다.', 'https://cdn.mdjournal.kr/news/photo/202503/41339_22531_1216.jpeg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41339'),
  (17, true, 'external', 'KBHGA와 라파스 업무협약 체결', '한국뷰티헬시에이징국제교류회(KBHGA)는 한국 뷰티 산업의 혁신과 국제적 확장을 목표로 설립된 단체로, 뷰티와 헬시에이징을 중심으로 다양한 연구와 교류 활동을 활발히 전개하고 있다.', 'https://cdn.mdjournal.kr/news/photo/202502/41311_22438_5432.jpg', 'https://www.mdjournal.kr/news/articleView.html?idxno=41311');

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

-- ---------- 다국어 설정 ----------
insert into public.site_settings (key, value) values
('i18n', jsonb_build_object('en', true, 'zh', true, 'ja', true, 'detect', 'geo', 'translate_pages', true,
  'glossary', E'HTU GLOBAL HOLDINGS = HTU GLOBAL HOLDINGS (번역하지 않음)\nMAXQ = MAXQ\nMD 저널 = MD Journal\nENDO 저널 = ENDO Journal'))
on conflict (key) do nothing;

-- ---------- 관리자 계정 등록 ----------
-- 1) Supabase Dashboard → Authentication → Users → "Add user" 로 이메일/비밀번호 계정 생성
-- 2) 아래 이메일을 바꿔서 실행
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing;
