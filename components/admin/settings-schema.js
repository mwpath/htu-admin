// site_settings 의 key 별 입력 항목 정의
export const SETTING_GROUPS = [
  {
    key: 'site',
    title: '사이트 기본 정보',
    desc: '공지사항·내부 뉴스 페이지 상단 로고와 브라우저 제목에 사용됩니다.',
    fields: [
      { name: 'name', label: '사이트 이름', type: 'text', default: 'HTU Global Holdings', half: true },
      { name: 'home_url', label: '홈 링크', type: 'text', default: '/', half: true, help: '로고 클릭 시 이동할 주소. 기존 홈페이지 도메인을 넣어도 됩니다.' },
      { name: 'logo_url', label: '사이트 로고', type: 'image', folder: 'logo' },
      { name: 'meta_description', label: '검색 설명 (meta description)', type: 'textarea', rows: 2, default: '' },
    ],
  },
  {
    key: 'hero',
    title: '메인 슬라이더 · 인트로 문구',
    desc: '첫 화면 가운데 큰 문구입니다.',
    fields: [
      { name: 'intro_title', label: '인트로 제목', type: 'lite', rows: 3 },
      { name: 'intro_body', label: '인트로 본문', type: 'lite', rows: 7 },
    ],
  },
  {
    key: 'partners',
    title: '파트너 로고 섹션',
    fields: [
      { name: 'title', label: '섹션 제목', type: 'lite', rows: 3 },
      { name: 'rolling_speed', label: '롤링 속도 (초, 클수록 느림)', type: 'number', default: 40, half: true },
      { name: 'popup_label', label: '팝업 로고 인디케이터 문구', type: 'text', default: '자세히 보기', half: true },
      { name: 'link_label', label: '링크 로고 인디케이터 문구', type: 'text', default: '바로가기', half: true },
    ],
  },
  {
    key: 'publications',
    title: '정기 출간물 섹션',
    fields: [
      { name: 'title', label: '섹션 제목', type: 'text', default: '정기 출간물', half: true },
      { name: 'popup_label', label: '팝업 인디케이터 문구', type: 'text', default: '자세히 보기', half: true },
      { name: 'link_label', label: '링크 인디케이터 문구', type: 'text', default: '바로가기', half: true },
    ],
  },
  {
    key: 'columns',
    title: '전문가 연재 섹션',
    fields: [
      { name: 'title', label: '섹션 제목', type: 'text', default: '전문가 연재', half: true },
      { name: 'card_button', label: '카드 버튼 문구', type: 'text', default: '연재 보기', half: true },
      { name: 'pdf_button', label: '팝업 PDF 버튼 문구', type: 'text', default: 'PDF 파일 보기', half: true },
      { name: 'auto_delay', label: '자동 넘김 간격 (ms, 0 = 끔)', type: 'number', default: 5000, half: true },
    ],
  },
  {
    key: 'reel',
    title: '오토플레이 영상 (메인 릴)',
    desc: '등록된 영상이 끝나면 다음 영상이 자동 재생됩니다.',
    fields: [
      { name: 'enabled', label: '섹션 사용', type: 'checkbox', default: true, half: true, switchLabel: '사용' },
      { name: 'shuffle', label: '랜덤 재생', type: 'checkbox', default: false, half: true, switchLabel: '방문할 때마다 순서를 섞어서 재생' },
      { name: 'reshuffle_each_loop', label: '한 바퀴 돌면 다시 섞기', type: 'checkbox', default: true, half: true, switchLabel: '랜덤 재생일 때만 적용' },
    ],
  },
  {
    key: 'news',
    title: 'News & Event 섹션',
    fields: [
      { name: 'title', label: '섹션 제목', type: 'text', default: 'News & Event', half: true },
      { name: 'auto_interval', label: '자동 넘김 간격 (ms, 0 = 끔)', type: 'number', default: 4200, half: true },
      { name: 'show_notice_link', label: '공지사항 버튼 표시', type: 'checkbox', default: true, half: true, switchLabel: '섹션 우측 상단에 표시' },
      { name: 'show_source_badge', label: '출처 배지 표시', type: 'checkbox', default: true, half: true, switchLabel: "썸네일에 'HTU 소식 / 외부 기사' 표시" },
    ],
  },
  {
    key: 'gallery',
    title: 'YouTube Video 갤러리 섹션',
    fields: [
      { name: 'title', label: '섹션 제목', type: 'text', default: 'YouTube Video', half: true },
      { name: 'auto_interval', label: '자동 넘김 간격 (ms, 0 = 끔)', type: 'number', default: 4200, half: true },
      { name: 'shuffle', label: '랜덤 순서', type: 'checkbox', default: false, half: true, switchLabel: '방문할 때마다 순서 섞기' },
      { name: 'show_title', label: '제목/설명 표시', type: 'checkbox', default: false, half: true, switchLabel: '썸네일 아래 제목 표시' },
    ],
  },
];
