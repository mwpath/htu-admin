// 직원 권한 — 데이터베이스(RLS) 규칙과 같은 이름을 씁니다 (supabase/migration-007-accounts.sql)
export const ROLES = [
  { value: 'owner', label: '대표 관리자', desc: '모든 메뉴 + 직원 계정 · 연동 설정 관리' },
  { value: 'admin', label: '관리자', desc: '모든 메뉴 편집 (계정 관리 제외)' },
  { value: 'editor', label: '담당자', desc: '지정한 메뉴만 편집' },
];
export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

export const SECTIONS = [
  { key: 'settings', label: '기본 설정', group: '개요' },
  { key: 'intro', label: '인트로 영상', group: '홈페이지 섹션' },
  { key: 'hero', label: '메인 슬라이더', group: '홈페이지 섹션' },
  { key: 'family', label: '패밀리사이트 팝업', group: '홈페이지 섹션' },
  { key: 'partners', label: '파트너 로고', group: '홈페이지 섹션' },
  { key: 'publications', label: '정기 출간물', group: '홈페이지 섹션' },
  { key: 'columns', label: '전문가 연재', group: '홈페이지 섹션' },
  { key: 'videos', label: '영상 (릴 · 갤러리)', group: '홈페이지 섹션' },
  { key: 'news', label: 'News & Event', group: '홈페이지 섹션' },
  { key: 'notices', label: '공지사항', group: '게시 · 알림' },
  { key: 'events', label: '이벤트', group: '게시 · 알림' },
  { key: 'popups', label: '메인 팝업', group: '게시 · 알림' },
  { key: 'menu', label: '헤더 메뉴', group: '메뉴 · 링크' },
  { key: 'footer', label: '푸터 · 관련 사이트', group: '메뉴 · 링크' },
  { key: 'i18n', label: '번역 · 언어', group: '다국어' },
];
export const SECTION_LABEL = Object.fromEntries(SECTIONS.map((s) => [s.key, s.label]));

// site_settings.key → 권한 (SQL settings_section 과 동일)
export function settingsSection(key) {
  return ({ intro: 'intro', hero: 'hero', partners: 'partners', publications: 'publications', columns: 'columns',
    reel: 'videos', gallery: 'videos', news: 'news', popup: 'popups', header: 'menu', footer: 'footer', i18n: 'i18n' })[key] || 'settings';
}

export function canEdit(me, section) {
  if (!me || me.active === false) return false;
  if (me.role === 'owner' || me.role === 'admin') return true;
  return (me.permissions || []).includes(section);
}

// 관리자 화면 주소 → 필요한 권한 (null = 모든 직원, 'owner' = 대표만)
const PAGE = [
  ['/admin/accounts', 'owner'], ['/admin/integrations', 'owner'], ['/admin/account', null],
  ['/admin/settings', 'any-settings'], ['/admin/intro', 'intro'], ['/admin/hero', 'hero'], ['/admin/family', 'family'],
  ['/admin/partners', 'partners'], ['/admin/publications', 'publications'], ['/admin/columns', 'columns'],
  ['/admin/videos', 'videos'], ['/admin/news', 'news'], ['/admin/notices', 'notices'], ['/admin/events', 'events'],
  ['/admin/popups', 'popups'], ['/admin/menu', 'menu'], ['/admin/footer', 'footer'], ['/admin/i18n', 'i18n'],
];
export function pagePerm(path) {
  const hit = PAGE.find(([p]) => path === p || path.startsWith(p + '/'));
  return hit ? hit[1] : null;
}
const SETTINGS_KEYS = ['site', 'intro', 'hero', 'partners', 'publications', 'columns', 'reel', 'news', 'gallery', 'popup', 'header', 'footer'];
export function canOpen(me, path) {
  const need = pagePerm(path);
  if (!need) return !!me;
  if (need === 'owner') return me?.role === 'owner';
  if (need === 'any-settings') return SETTINGS_KEYS.some((k) => canEdit(me, settingsSection(k)));
  return canEdit(me, need);
}
