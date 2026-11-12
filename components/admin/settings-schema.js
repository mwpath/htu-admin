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
      { name: 'show_source_badge', label: '출처 배지 표시', type: 'checkbox', default: true, half: true, switchLabel: "썸네일에 'HTU 소식 / 외부 기사 / 이벤트' 표시" },
      { name: 'include_events', label: '이벤트도 함께 표시', type: 'checkbox', default: true, half: true, switchLabel: '이벤트 글을 News & Event 슬라이드에 최신순으로 섞어서 표시' },
    ],
  },
  {
    key: 'notices_main',
    title: '메인 공지사항 섹션 (News & Event 아래)',
    fields: [
      { name: 'show', label: '메인에 표시', type: 'checkbox', default: true, half: true, switchLabel: 'News & Event 바로 아래에 최신 공지 목록 표시' },
      { name: 'title', label: '섹션 제목', type: 'text', default: '공지사항', half: true },
      { name: 'count', label: '표시할 공지 수', type: 'number', default: 6, half: true, help: '상단 고정 공지가 먼저 나오고, 나머지는 최신순 (3개씩 한 줄)' },
      { name: 'more_label', label: '전체 보기 버튼 문구', type: 'text', default: '전체 보기', half: true },
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
    desc: '화면 맨 위(영상·이미지 위)에서는 흰색 로고, 스크롤하거나 메뉴에 마우스를 올리면 기본 로고가 표시됩니다. 오른쪽 햄버거 버튼은 PC 전체 메뉴 / 모바일 메뉴를 엽니다.',
    fields: [
      { name: 'logo_url', label: '기본 로고 (흰 배경용, 어두운 색)', type: 'image', folder: 'logo' },
      { name: 'logo_light_url', label: '흰색 로고 (영상 위)', type: 'image', folder: 'logo', help: '비워두면 기본 로고를 흰색으로 자동 변환합니다.' },
      { name: 'logo_text', label: '로고 대체 텍스트', type: 'text', default: 'HTU GLOBAL', half: true, help: '로고 이미지가 없으면 이 글자가 표시됩니다.' },
      { name: 'logo_height', label: '로고 높이 (px)', type: 'number', default: 34, half: true },
      { name: 'lang_button', label: '언어 선택 버튼 (🌐)', type: 'checkbox', default: true, half: true, switchLabel: '헤더 오른쪽에 표시',
        help: '끄면 PC 헤더와 모바일 메뉴의 언어 선택이 모두 숨겨집니다 (방문자는 접속 국가 언어로 자동 표시).' },
    ],
  },
  {
    key: 'footer',
    title: '푸터 회사 정보',
    fields: [
      { name: 'logo_url', label: '푸터 로고 (어두운 배경용, 흰색)', type: 'image', folder: 'logo' },
      { name: 'slogan', label: '로고 아래 문구', type: 'textarea', rows: 2 },
      { name: 'logo_text', label: '로고 대체 텍스트', type: 'text', default: 'HTU GLOBAL HOLDINGS', half: true },
      { name: 'related_label', label: '패밀리 사이트 버튼 문구', type: 'text', default: '패밀리 사이트', half: true },
      { name: 'company', label: '상호', type: 'text', half: true },
      { name: 'ceo', label: '대표자', type: 'text', half: true },
      { name: 'address', label: '주소', type: 'text' },
      { name: 'biz_no', label: '사업자등록번호', type: 'text', half: true },
      { name: 'tel', label: '전화', type: 'text', half: true },
      { name: 'fax', label: '팩스', type: 'text', half: true },
      { name: 'email', label: '이메일', type: 'text', half: true },
      { name: 'extra', label: '추가 문구 (통신판매업 신고번호 등)', type: 'textarea', rows: 2 },
      { name: 'copyright', label: '저작권 문구 (줄바꿈 가능)', type: 'textarea', rows: 2 },
    ],
  },
  {
    key: 'i18n',
    title: '사이트 언어',
    desc: '켜진 언어가 사이트 언어 선택 메뉴에 표시되고, 관리자에서 저장하는 모든 한국어 내용이 자동 번역됩니다.',
    fields: [
      { name: '__langs', label: '사용할 언어 (클릭해서 켜기 · 끄기)', type: 'langs', virtual: true,
        help: '켠 언어는 사이트 언어 메뉴에 나타나고, 저장된 모든 한국어 내용이 그 언어로 자동 번역됩니다. 새 언어를 켜면 ‘지금 전체 번역’을 눌러주세요.' },
      { name: 'detect', label: '첫 방문 시 언어 자동 선택', type: 'radio', default: 'geo',
        options: [{ value: 'geo', label: '접속 국가 기준 (권장)' }, { value: 'browser', label: '브라우저 언어 기준' }, { value: 'off', label: '항상 한국어' }],
        help: '국가 기준: 일본에서 접속하면 일본어, 베트남이면 베트남어… 그 나라 언어가 꺼져 있으면 영어로 보입니다. 방문자가 직접 고른 언어는 항상 우선합니다.' },
      { name: 'country_map', label: '국가별 언어 직접 지정 (선택)', type: 'textarea', rows: 3, placeholder: 'SG = zh\nIN = en\nPH = en',
        help: '기본 규칙을 바꾸고 싶은 나라만 한 줄에 하나씩: 국가코드(2자리) = 언어코드. 예) SG = zh, IN = en' },
      { name: 'translate_pages', label: '페이지 고정 문구 번역', type: 'checkbox', default: true, switchLabel: '회사소개 · 대표 인사말 등 HTML 에 직접 쓰인 글과 버튼 문구도 자동 번역' },
      { name: 'glossary', label: '번역 용어집 (Claude 번역에 적용)', type: 'textarea', rows: 5, help: '한 줄에 하나씩: 한국어 = 번역어. 회사명·브랜드명처럼 번역하면 안 되는 단어를 적어두세요.' },
    ],
  },
];
