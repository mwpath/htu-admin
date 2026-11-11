// site_settings 의 key 별 입력 항목 정의
export const SETTING_GROUPS = [
  {
    key: 'site',
    title: '기존 사이트 연결',
    desc: '내부 뉴스 글·공지사항 링크와 관리자 미리보기에 사용됩니다.',
    fields: [
      { name: 'site_url', label: '기존 사이트 주소', type: 'url', default: 'https://htuglobal.com', half: true, help: '끝에 / 없이. 예) https://htuglobal.com' },
      { name: 'name', label: '사이트 이름', type: 'text', default: 'HTU GLOBAL', half: true },
    ],
  },
  {
    key: 'intro',
    title: '인트로 영상 슬라이더',
    desc: '홈페이지 맨 위 전체화면 영상 슬라이드입니다.',
    fields: [
      { name: 'duration', label: '슬라이드 전환 간격 (ms)', type: 'number', default: 6000, half: true },
      {
        name: 'video_pos', label: '영상 가로 위치', type: 'select', default: 'center', half: true,
        options: [{ value: 'left', label: '왼쪽' }, { value: 'center', label: '가운데' }, { value: 'right', label: '오른쪽' }],
      },
      { name: 'show_scroll_hint', label: '스크롤 화살표 표시', type: 'checkbox', default: true, half: true, switchLabel: '하단 ↓ 표시' },
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
  {
    key: 'popup',
    title: '메인 팝업 표시 방식',
    fields: [
      {
        name: 'align', label: 'PC 위치', type: 'select', default: 'left', half: true,
        options: [{ value: 'left', label: '왼쪽 (기본)' }, { value: 'center', label: '가운데' }],
      },
      { name: 'pc_max_w', label: 'PC 최대 가로 (px)', type: 'number', default: 540, half: true },
      { name: 'pc_max_h', label: 'PC 최대 세로 (px, 하단 바 포함)', type: 'number', default: 720, half: true },
    ],
  },
  {
    key: 'header',
    title: '헤더 로고',
    desc: '홈 첫 화면(영상 위)에서는 흰색 로고, 스크롤하거나 다른 페이지에서는 기본 로고가 표시됩니다.',
    fields: [
      { name: 'logo_url', label: '기본 로고 (흰 배경용, 어두운 색)', type: 'image', folder: 'logo' },
      { name: 'logo_light_url', label: '흰색 로고 (영상 위)', type: 'image', folder: 'logo', help: '비워두면 기본 로고를 흰색으로 자동 변환합니다.' },
      { name: 'logo_text', label: '로고 대체 텍스트', type: 'text', default: 'HTU GLOBAL', half: true, help: '로고 이미지가 없으면 이 글자가 표시됩니다.' },
      { name: 'logo_height', label: '로고 높이 (px)', type: 'number', default: 34, half: true },
    ],
  },
  {
    key: 'footer',
    title: '푸터 회사 정보',
    fields: [
      { name: 'logo_url', label: '푸터 로고 (어두운 배경용, 흰색)', type: 'image', folder: 'logo' },
      { name: 'logo_text', label: '로고 대체 텍스트', type: 'text', default: 'HTU GLOBAL HOLDINGS', half: true },
      { name: 'related_label', label: '관련 사이트 버튼 문구', type: 'text', default: 'FAMILY SITE', half: true },
      { name: 'company', label: '상호', type: 'text', half: true },
      { name: 'ceo', label: '대표자', type: 'text', half: true },
      { name: 'address', label: '주소', type: 'text' },
      { name: 'biz_no', label: '사업자등록번호', type: 'text', half: true },
      { name: 'tel', label: '전화', type: 'text', half: true },
      { name: 'fax', label: '팩스', type: 'text', half: true },
      { name: 'email', label: '이메일', type: 'text', half: true },
      { name: 'extra', label: '추가 문구 (통신판매업 신고번호 등)', type: 'textarea', rows: 2 },
      { name: 'copyright', label: '저작권 문구', type: 'text', default: 'Copyright © HTU GLOBAL HOLDINGS. All rights reserved.' },
    ],
  },
];
