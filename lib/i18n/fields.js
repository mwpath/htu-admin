// 번역 대상 필드 정의 — 관리자에서 수정 가능한 '글자'만 (주소·이미지·링크 제외)
// type: 'text' | 'html' (서식 유지) | 'array' (문자열 목록)
import { LANG_LIST } from './langs';
export { LANGS, enabledLangs } from './langs';
export const LANG_NAMES = Object.fromEntries(LANG_LIST.map((l) => [l.code, l.name]));

export const TABLE_FIELDS = {
  intro_slides: { eyebrow: 'text', title: 'text' },
  hero_slides: { title: 'text', body: 'text', link_label: 'text', family_label: 'text' },
  family_groups: { eyebrow: 'text', title: 'text', description: 'text', toolbar_title: 'text', toolbar_desc: 'text', note: 'text', meta: 'array' },
  family_sites: { badge: 'text', title: 'text', description: 'text', url_text: 'text' },
  partner_logos: { alt: 'text', name: 'text', sub: 'text', headline: 'text', description: 'text', button_label: 'text' },
  publications: { caption: 'text', popup_title: 'text', popup_desc: 'text', button_label: 'text' },
  expert_columns: { title: 'text', card_title: 'text', subtitle: 'text' },
  videos: { title: 'text', excerpt: 'text' },
  news: { title: 'text', excerpt: 'text', content_html: 'html' },
  notices: { title: 'text', content_html: 'html' },
  events: { title: 'text', summary: 'text', location: 'text', apply_label: 'text', content_html: 'html' },
  popups: { title: 'text', body: 'text', link_label: 'text' },
  menu_items: { label: 'text' },
};

export const SETTINGS_FIELDS = {
  hero: { intro_title: 'text', intro_body: 'text' },
  partners: { title: 'text', popup_label: 'text', link_label: 'text' },
  publications: { title: 'text', popup_label: 'text', link_label: 'text' },
  columns: { title: 'text', card_button: 'text', pdf_button: 'text' },
  news: { title: 'text' },
  notices_main: { title: 'text', more_label: 'text' },
  gallery: { title: 'text' },
  header: { logo_text: 'text' },
  footer: { slogan: 'text', company: 'text', address: 'text', extra: 'text', copyright: 'text', related_label: 'text', logo_text: 'text' },
};

export const TABLE_LABELS = {
  settings: '섹션 문구 · 헤더 · 푸터 설정',
  intro_slides: '인트로 영상', hero_slides: '메인 슬라이더', family_groups: '패밀리사이트 팝업 그룹', family_sites: '패밀리사이트',
  partner_logos: '파트너 로고', publications: '정기 출간물', expert_columns: '전문가 연재', videos: '영상',
  news: 'News & Event', notices: '공지사항', events: '이벤트', popups: '메인 팝업', menu_items: '메뉴 · 링크',
  page: '페이지 고정 문구',
};

