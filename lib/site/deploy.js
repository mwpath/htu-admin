// 관리자 → 사이트 GitHub 저장소로 연동 파일을 직접 배포 (수동 업로드 불필요)
import SITE_FILES, { SITE_VERSION, SITE_PATHS } from '@/generated/site-files';
import { gh, ghError } from '../media/github';

const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

export function renderSiteFiles(endpoint, snapshot) {
  const out = {};
  for (const [name, path] of Object.entries(SITE_PATHS)) out[path] = SITE_FILES[name].split('__HTU_CMS_ENDPOINT__').join(endpoint);
  if (snapshot) {
    const js = snapshotJs(snapshot);
    out['js/htu-cms-data.js'] = js;
    // 홈페이지에는 콘텐츠를 직접 내장 → 관리자 서버 응답을 기다리지 않고 첫 화면을 바로 그림
    if (out['index.html']) {
      const inline = '<script>' + js.replace(/^\/\*![^\n]*\n/, '').replace(/<\/script/gi, '<\\/script') + '</script>';
      out['index.html'] = out['index.html'].replace(/<!--HTU_INLINE_DATA-->[\s\S]*?<!--\/HTU_INLINE_DATA-->/, () => inline);
    }
  }
  return out;
}

// 공개 콘텐츠 백업 — 관리자 API 에 연결되지 않을 때만 사용 (사이트가 빈 화면이 되지 않게)
export function snapshotJs(content) {
  const layout = { settings: { header: content.settings?.header || {}, footer: content.settings?.footer || {}, i18n: content.settings?.i18n || {} }, menus: content.menus || {} };
  const json = JSON.stringify({ content, layout }).replace(/</g, '\\u003c');
  return `/*! HTU CMS 콘텐츠 백업 ${SITE_VERSION} — 관리자 API 에 연결되지 않을 때만 사용됩니다 */\nwindow.HTU_CMS_SNAPSHOT = ${json};\n`;
}

// 기존 서브 페이지(회사소개 등) 보정: 스크립트 주소에 버전 붙이기 + 페이지에 직접 박힌 푸터를 관리자 연동 푸터로
export function patchSubpage(html) {
  let s = html;
  s = s.replace(/(src=["'])(\.?\/?)(menu3\.js|js\/footer\.js|js\/htu-i18n\.js|js\/htu-cms-config\.js)(?:\?v=[\w.-]*)?(["'])/g, (_, a, dot, file, z) => `${a}./${file}?v=${SITE_VERSION}${z}`);
  if (/<section id="footerElite"/.test(s) && !/id="footer_template"/.test(s)) {
    const start = s.indexOf('<section id="footerElite"');
    const bodyEnd = s.indexOf('</body>', start);
    const lastScript = s.lastIndexOf('</script>', bodyEnd);
    const end = s.indexOf('</section>', lastScript > start ? lastScript : start);
    if (end > start) s = s.slice(0, start) + '<div id="footer_template"></div>' + s.slice(end + '</section>'.length);
  }
  if (/id="footer_template"/.test(s) && !/js\/footer\.js/.test(s)) {
    s = s.replace(/<\/html>\s*$/i, `<script src="./js/footer.js?v=${SITE_VERSION}"></script>\n</html>\n`);
  }
  return s;
}

/** GitHub Pages 가 쓰는 브랜치 · 폴더 찾기 (권한이 없으면 main/master 중 있는 것 모두) */
export async function pagesTargets(cfg) {
  const pages = await gh(cfg, `/repos/${cfg.repo}/pages`);
  if (pages.ok && pages.json?.source?.branch) {
    return { targets: [{ branch: pages.json.source.branch, dir: (pages.json.source.path || '/').replace(/^\/|\/$/g, '') }], how: 'pages' };
  }
  const br = await gh(cfg, `/repos/${cfg.repo}/branches?per_page=100`);
  if (!br.ok) throw new Error(ghError(br));
  const names = br.json.map((b) => b.name);
  const pick = ['main', 'master', 'gh-pages'].filter((n) => names.includes(n));
  if (cfg.branch && names.includes(cfg.branch) && !pick.includes(cfg.branch)) pick.unshift(cfg.branch);
  if (!pick.length) throw new Error('main / master 브랜치를 찾지 못했습니다. 연동 설정에서 브랜치를 입력하세요.');
  return { targets: pick.map((b) => ({ branch: b, dir: '' })), how: 'branches' };
}

async function readText(cfg, branch, path) {
  const r = await gh(cfg, `/repos/${cfg.repo}/contents/${enc(path)}?ref=${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github.raw' } });
  return r.ok ? r.text : null;
}

/** 한 브랜치에 한 번의 커밋으로 배포 */
export async function deployBranch(cfg, { branch, dir }, endpoint, snapshot) {
  const prefix = dir ? dir + '/' : '';
  const files = renderSiteFiles(endpoint, snapshot);
  // 기존 서브 페이지 보정
  const list = await gh(cfg, `/repos/${cfg.repo}/contents/${enc(dir || '')}?ref=${encodeURIComponent(branch)}`);
  const changes = {};
  if (list.ok && Array.isArray(list.json)) {
    for (const f of list.json) {
      if (f.type !== 'file' || !/\.html?$/i.test(f.name) || files[f.name] || /copy/i.test(f.name)) continue;
      const html = await readText(cfg, branch, prefix + f.name);
      if (!html || !/menu3\.js|footer_template|footerElite/.test(html)) continue;
      const next = patchSubpage(html);
      if (next !== html) changes[f.name] = next;
    }
  }
  Object.assign(changes, files);

  const r = await commitChanges(cfg, { branch, dir }, changes, [], `HTU CMS 사이트 연동 파일 업데이트 (${SITE_VERSION})`);
  return { ...r, files: r.upToDate ? Object.keys(changes).length : Object.keys(changes) };
}

/** 브랜치에 파일 추가 · 수정 · 삭제를 한 번의 커밋으로 (내용이 같으면 커밋하지 않음) */
export async function commitChanges(cfg, { branch, dir }, changes, deletes, message) {
  const prefix = dir ? dir + '/' : '';
  const ref = await gh(cfg, `/repos/${cfg.repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  if (!ref.ok) throw new Error(ghError(ref));
  const head = ref.json.object.sha;
  const commit = await gh(cfg, `/repos/${cfg.repo}/git/commits/${head}`);
  if (!commit.ok) throw new Error(ghError(commit));
  const entries = [
    ...Object.entries(changes).map(([p, content]) => ({ path: prefix + p, mode: '100644', type: 'blob', content })),
    ...(deletes || []).map((p) => ({ path: prefix + p, mode: '100644', type: 'blob', sha: null })),
  ];
  if (!entries.length) return { branch, dir, changed: 0, upToDate: true };
  const tree = await gh(cfg, `/repos/${cfg.repo}/git/trees`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base_tree: commit.json.tree.sha, tree: entries }),
  });
  if (!tree.ok) throw new Error(ghError(tree));
  if (tree.json.sha === commit.json.tree.sha) return { branch, dir, changed: 0, upToDate: true };
  const nc = await gh(cfg, `/repos/${cfg.repo}/git/commits`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, tree: tree.json.sha, parents: [head] }),
  });
  if (!nc.ok) throw new Error(ghError(nc));
  const up = await gh(cfg, `/repos/${cfg.repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sha: nc.json.sha }) });
  if (!up.ok) {
    if (up.status === 422 || up.status === 409) { // 그 사이 다른 커밋이 들어옴 → 한 번 더
      return commitChanges(cfg, { branch, dir }, changes, deletes, message);
    }
    throw new Error(ghError(up));
  }
  return { branch, dir, changed: entries.length, commit: nc.json.sha.slice(0, 7) };
}

export async function listDir(cfg, branch, dir) {
  const r = await gh(cfg, `/repos/${cfg.repo}/contents/${enc(dir || '')}?ref=${encodeURIComponent(branch)}`);
  return r.ok && Array.isArray(r.json) ? r.json : [];
}
export { readText }

