// sections/*.html → generated/site-files.js
//   기존 사이트(htuglobal.com)에 올릴 파일 템플릿: index.html / news.html / notice.html / sections.html
//   관리자 > 대시보드 '사이트 파일 다운로드' 에서 연결 주소가 자동으로 채워진 파일을 받습니다.
// npm run dev / npm run build 시 자동 실행됩니다.
import fs from 'node:fs';
import path from 'node:path';
import { LANG_LIST } from '../lib/i18n/langs.js';

const root = process.cwd();
const dir = path.join(root, 'sections');
const outGen = path.join(root, 'generated');
fs.mkdirSync(outGen, { recursive: true });

const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const resolve = (f) => read(f).replace(/\/\*@include ([\w./-]+)\*\//g, (_, inc) => read(inc));

const sectionFiles = fs.readdirSync(dir).filter((f) => /^\d\d-.+\.html$/.test(f)).sort();
const sections = sectionFiles.map(resolve).join('\n\n');

const headTpl = read('standalone/head.html');
const head = headTpl.replace('__MENU_THEME__', '');
const foot = read('standalone/foot.html');
const boardHead = headTpl
  .replace('__MENU_THEME__', ' data-theme="solid"')
  .replace(/\/\*PREFETCH\*\/[\s\S]*?\/\*\/PREFETCH\*\//, '')
  .replace(/\s*<link rel="canonical"[^>]*>/, '');
const board = (mode) => boardHead + read('board/board.html').replace('__BOARD_MODE__', mode) + foot;

const snippetBanner = `<!--
  [HTU CMS] 홈페이지 섹션 묶음 — 기존 페이지의 <body> 안 원하는 위치에 붙여넣으세요.
  섹션들보다 위에 아래 한 줄이 1회 있어야 합니다.
  <script>window.HTU_CMS_ENDPOINT = '__HTU_CMS_ENDPOINT__';</script>
-->
`;

const files = {
  'index.html': head + sections + foot,
  'news.html': board('news'),
  'notice.html': board('notice'),
  'event.html': board('event'),
  'sections.html': snippetBanner + sections,
  // 사이트 공용 스크립트 (메뉴 · 푸터 · 연결 설정)
  'menu3.js': resolve('standalone/menu3.js'),
  'footer.js': resolve('standalone/footer.js'),
  'htu-cms-config.js': read('standalone/htu-cms-config.js'),
  'htu-i18n.js': read('standalone/htu-i18n.js').replace(/\/\*__LANGS__\*\/[\s\S]*?\/\*__\/LANGS__\*\//, () => '/*__LANGS__*/' + JSON.stringify(Object.fromEntries(LANG_LIST.map((l) => [l.code, { name: l.name, short: l.short, html: l.html, locale: l.locale }]))) + '/*__/LANGS__*/'),
};
// ── 버전 표시 + 캐시 무효화: 파일 내용이 바뀌면 ?v= 값이 바뀌어 브라우저 · GitHub CDN 이 새 파일을 받습니다
import('node:crypto').then(({ createHash }) => {
  const SITE_VERSION = createHash('sha1').update(JSON.stringify(files)).digest('hex').slice(0, 8);
  const bust = (html) => html.replace(/(src=["'])(\.\/(?:menu3\.js|js\/footer\.js|js\/htu-i18n\.js|js\/htu-cms-config\.js))(?:\?v=[\w.-]*)?(["'])/g, `$1$2?v=${SITE_VERSION}$3`);
  for (const k of Object.keys(files)) if (k.endsWith('.html')) files[k] = bust(files[k]);
  files['menu3.js'] = `/*! HTU CMS site ${SITE_VERSION} */\nwindow.HTU_SITE_VERSION = '${SITE_VERSION}';\n` + files['menu3.js']
    .replace("loadScript('./js/htu-cms-config.js')", `loadScript('./js/htu-cms-config.js?v=${SITE_VERSION}')`)
    .replace("loadScript('./js/htu-i18n.js')", `loadScript('./js/htu-i18n.js?v=${SITE_VERSION}')`);
  for (const k of ['footer.js', 'htu-i18n.js', 'htu-cms-config.js']) files[k] = `/*! HTU CMS site ${SITE_VERSION} */\n` + files[k];
  // 사이트 저장소 안의 위치
  const SITE_PATHS = { 'index.html': 'index.html', 'news.html': 'news.html', 'notice.html': 'notice.html', 'event.html': 'event.html',
    'menu3.js': 'menu3.js', 'footer.js': 'js/footer.js', 'htu-i18n.js': 'js/htu-i18n.js', 'htu-cms-config.js': 'js/htu-cms-config.js' };
  fs.writeFileSync(path.join(outGen, 'site-files.js'),
    'export const SITE_VERSION = ' + JSON.stringify(SITE_VERSION) + ';\nexport const SITE_PATHS = ' + JSON.stringify(SITE_PATHS) + ';\nexport default ' + JSON.stringify(files) + ';\n');
  console.log('[build-home] site version', SITE_VERSION);
});
console.log(`[sections] site-files.js built: ${Object.keys(files).join(', ')}`);
