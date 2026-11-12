// 실제 사이트(htuglobal.com)가 지금 무엇을 내보내는지 서버에서 직접 확인
import { SITE_VERSION } from '@/generated/site-files';
import { isDeploymentUrl } from './endpoint';

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

  const ep = ((conf.text.match(/HTU_CMS_ENDPOINT\s*=\s*['"]([^'"]+)['"]/) || [])[1] || '').replace(/\/+$/, '') || null;
  add(ep === endpoint, '관리자 주소 연결', ep ? `사이트가 부르는 관리자: ${ep}` : 'js/htu-cms-config.js 를 찾을 수 없습니다',
    ep ? `고정 관리자 주소(${endpoint})와 다릅니다 → "사이트 파일 자동 업데이트"를 누르세요.` : '"사이트 파일 자동 업데이트"를 누르세요.');
  if (ep) {
    // 방문자 입장에서 그 주소의 데이터가 열리는지 (Vercel 로그인 보호 · 삭제된 배포 주소 · 서버 오류 감지)
    const t0 = Date.now();
    const api = await get(`${ep}/api/public/content?check=${Date.now()}`);
    const ms = Date.now() - t0;
    let j = null; try { j = JSON.parse(api.text); } catch { /* noop */ }
    const okJson = api.status === 200 && j && !j.error && j.settings;
    const why = api.status === 401 || api.status === 403 ? `${api.status} (Vercel 로그인 보호)` : j?.error ? `서버 오류 ${j.error}` : api.status ? `HTTP ${api.status}` : '응답 없음';
    add(okJson, '방문자 데이터 수신', okJson ? `${ep} 에서 콘텐츠를 정상으로 받습니다 (${ms}ms · 슬라이드 ${(j.intro || []).length + (j.heroSlides || []).length}개 · 소식 ${(j.news || []).length}개)`
      : `${ep} → ${why}. 이 상태면 홈 화면이 내장 콘텐츠로만 보이거나 비어 보입니다`,
      isDeploymentUrl(ep) ? '배포별 임시 주소가 들어가 있습니다. "사이트 파일 자동 업데이트"를 누르면 고정 주소로 바뀝니다.'
        : j?.error === 'SUPABASE_ENV_MISSING' ? 'Vercel 에 Supabase 연결이 빠졌습니다. Vercel → Storage 에서 Supabase 를 다시 연결하고 재배포하세요.'
          : j?.error === 'FETCH_FAILED' ? 'DB 조회가 실패했습니다. 연동 설정 → DB 자동 업데이트를 실행하고, Supabase 프로젝트가 일시중지(Paused) 상태가 아닌지 확인하세요.'
            : '"사이트 파일 자동 업데이트"를 누르거나 Vercel → Settings → Deployment Protection 을 확인하세요.');
    if (okJson) add(ms < 1500, '관리자 서버 응답 속도', `${ms}ms${ms < 600 ? ' (빠름)' : ms < 1500 ? ' (보통)' : ' (느림)'}`, 'Vercel 함수 지역을 서울(icn1)로 두었습니다. 재배포 후 다시 점검하세요. 홈 화면은 내장 콘텐츠로 먼저 그려지므로 방문자 체감에는 영향이 적습니다.');
  }

  const mv = ver(menu.text), fv = ver(foot.text);
  const menuCms = /__htuFetchLayout|htu_layout_v1/.test(menu.text);
  add(mv === SITE_VERSION, '헤더 메뉴 파일 (menu3.js)',
    !menuCms ? '관리자 연동판이 아닌 예전 메뉴 파일입니다' : mv ? `버전 ${mv}${mv === SITE_VERSION ? ' (최신)' : ` — 최신은 ${SITE_VERSION}`}` : '버전 표시 없는 이전 연동판 (언어 버튼 · 소식 기본값 일부 빠짐)',
    '"사이트 파일 자동 업데이트"를 누르세요. 이미 올렸다면 GitHub Pages 반영(1~2분)을 기다린 뒤 다시 점검하세요.');
  add(fv === SITE_VERSION, '푸터 파일 (js/footer.js)', fv ? `버전 ${fv}` : '버전 표시 없는 이전 파일', '"사이트 파일 자동 업데이트"를 누르세요.');
  const idxV = (index.text.match(/menu3\.js\?v=([\w]+)/) || [])[1] || null;
  const inl = /window\.HTU_CMS_SNAPSHOT\s*=/.test(index.text);
  add(inl, '홈 내장 콘텐츠 (빠른 첫 화면)', inl ? '홈페이지에 최신 콘텐츠가 들어 있어 관리자 서버를 기다리지 않고 바로 표시됩니다' : '아직 없습니다', '"사이트 파일 자동 업데이트"를 한 번 누르세요. 이후에는 관리자에서 저장할 때마다 자동 갱신됩니다.');
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
