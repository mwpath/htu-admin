// 메뉴 링크 입력 시 추천 목록 (직접 입력도 가능)
export const LINK_SUGGESTIONS = [
  { value: './index.html', label: '홈' },
  { value: './news.html', label: 'News & Event 목록' },
  { value: './event.html', label: '이벤트 목록' },
  { value: './notice.html', label: '공지사항 목록' },
  { value: '#nwHero', label: '섹션: 인트로 영상' },
  { value: '#mainSliderPack', label: '섹션: 메인 슬라이더 (HTU 소개)' },
  { value: '#partner-logo-slider-section', label: '섹션: 파트너 로고' },
  { value: '#youtubeVideoSection', label: '섹션: 정기 출간물' },
  { value: '#bookshelf-gallery', label: '섹션: 전문가 연재' },
  { value: '#yt-autoplay-reel', label: '섹션: 오토플레이 영상' },
  { value: '#newsSlideSection', label: '섹션: News & Event' },
  { value: '#youtubePopupGallerySection', label: '섹션: YouTube Video' },
];

export const LINK_TYPES = [
  { value: 'internal', label: '사이트 내 페이지 · 섹션' },
  { value: 'external', label: '외부 링크 ↗' },
  { value: 'none', label: '링크 없음 (제목만)' },
];

export const linkFields = ({ allowNone = true } = {}) => [
  {
    name: 'link_type', label: '링크 종류', type: 'radio', default: 'internal',
    options: allowNone ? LINK_TYPES : LINK_TYPES.filter((o) => o.value !== 'none'),
  },
  {
    name: 'url', label: '페이지 · 섹션', type: 'link', required: true, suggestions: LINK_SUGGESTIONS,
    placeholder: './notice.html 또는 #partner-logo-slider-section',
    help: '목록에서 고르거나 직접 입력. #섹션ID 는 홈의 해당 섹션으로 부드럽게 이동합니다.',
    showIf: (f) => (f.link_type || 'internal') === 'internal',
  },
  {
    name: 'url', label: '외부 주소', type: 'url', required: true, placeholder: 'https://',
    showIf: (f) => f.link_type === 'external',
  },
  {
    name: 'new_tab', label: '새 창으로 열기', type: 'checkbox', switchLabel: '새 창', half: true,
    help: '외부 링크는 항상 새 창으로 열립니다.',
    showIf: (f) => (f.link_type || 'internal') === 'internal',
  },
];

export const linkSub = (r) =>
  r.link_type === 'none' ? '링크 없음' : `${r.link_type === 'external' ? '↗ ' : ''}${r.url || ''}${r.link_type === 'external' || r.new_tab ? ' · 새 창' : ''}`;
