// 실제 사이트(htuglobal.com)가 지금 무엇을 내보내는지 서버에서 직접 확인
import { SITE_VERSION } from '@/generated/site-files';

async function get(url) {
  try {
    const r = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'htu-cms-check' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    return { status: r.status, text: r.ok ? await r.text() : '' };
  } catch (e) { return { status: 0, text: '', error: String(e.message || e) }; }
}

export async function checkSite(siteBase, endpoint, menus) {
  const bust = `?check=${Date.now()}`;
  const [menu, foot, conf, index, notice] = await Promise.all([
    get(`${siteBase}/menu3.js${bust}`), get(`${siteBase}/js/footer.js${bust}`), get(`${siteBase}/js/htu-cms-config.js${bust}`),
    get(`${siteBase}/index.html${bust}`), get(`${siteBase}/notice.html${bust}`),
  ]);
  const ver = (t) => (t.match(/HTU CMS site ([0-9a-f]{8})/) || [])[1] || null;
  const items = [];
  const add = (ok, title, detail, fix) => items.push({ ok, title, detail, fix: ok === true ? null : fix });
  const reach = menu.status === 200 || index.status === 200;
  add(reach, '사이트 접속', reach ? `${siteBase} 응답 정상` : `${siteBase} 에 접속할 수 없습니다 (${menu.status || menu.error})`, '기본 설정의 "기존 사이트 주소"를 확인하세요.');
  if (!reach) return { version: SITE_VERSION, items };

  const ep = (conf.text.match(/HTU_CMS_ENDPOINT\s*=\s*['"]([^'"]+)['"]/) || [])[1] || null;
  add(ep === endpoint, '관리자 주소 연결', ep ? `사이트가 부르는 관리자: ${ep}` : 'js/htu-cms-config.js 를 찾을 수 없습니다',
    ep ? `지금 관리자 주소(${endpoint})와 다릅니다 → "사이트 파일 자동 업데이트"를 누르세요.` : '"사이트 파일 자동 업데이트"를 누르세요.');

  const mv = ver(menu.text), fv = ver(foot.text);
  const menuCms = /__htuFetchLayout|htu_layout_v1/.test(menu.text);
  add(mv === SITE_VERSION, '헤더 메뉴 파일 (menu3.js)',
    !menuCms ? '관리자 연동판이 아닌 예전 메뉴 파일입니다' : mv ? `버전 ${mv}${mv === SITE_VERSION ? ' (최신)' : ` — 최신은 ${SITE_VERSION}`}` : '버전 표시 없는 이전 연동판 (언어 버튼 · 소식 기본값 일부 빠짐)',
    '"사이트 파일 자동 업데이트"를 누르세요. 이미 올렸다면 GitHub Pages 반영(1~2분)을 기다린 뒤 다시 점검하세요.');
  add(fv === SITE_VERSION, '푸터 파일 (js/footer.js)', fv ? `버전 ${fv}` : '버전 표시 없는 이전 파일', '"사이트 파일 자동 업데이트"를 누르세요.');
  const idxV = (index.text.match(/menu3\.js\?v=([\w]+)/) || [])[1] || null;
  add(idxV === SITE_VERSION, '홈페이지 (index.html)', idxV ? `menu3.js?v=${idxV} 로 불러옴` : 'menu3.js 를 버전 없이 불러옴 → 브라우저가 예전 파일을 계속 쓸 수 있음', '"사이트 파일 자동 업데이트"를 누르세요.');
  add(notice.status === 200, '공지사항 페이지 (notice.html)', notice.status === 200 ? '있음' : `없음 (${notice.status})`, '"사이트 파일 자동 업데이트"를 누르세요.');

  const header = (menus?.header || []).map((m) => m.label);
  const footer = (menus?.footer || []).map((m) => m.label);
  add(header.length > 0, '관리자 헤더 메뉴 데이터', header.length ? header.join(' · ') : '비어 있음 → 사이트에는 파일 안 기본 메뉴가 표시됨', '헤더 메뉴 화면에서 "현재 사이트 메뉴 불러오기"를 누르세요.');
  add(footer.length > 0, '관리자 푸터 메뉴 데이터', footer.length ? footer.join(' · ') : '비어 있음 → 사이트에는 파일 안 기본 메뉴가 표시됨', '푸터 → 푸터 메뉴 탭에서 "현재 사이트 메뉴 불러오기"를 누르세요.');
  const hasNews = header.includes('소식') || (!header.length && mv === SITE_VERSION);
  add(hasNews, '"소식" 메뉴', hasNews ? '표시됨' : '헤더 메뉴 데이터에 "소식"이 없습니다', '헤더 메뉴 화면에서 "＋ 소식 메뉴 추가"를 누르세요.');
  return { version: SITE_VERSION, items };
}
