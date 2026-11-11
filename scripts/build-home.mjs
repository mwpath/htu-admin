// sections/*.html → generated/site-files.js
//   기존 사이트(htuglobal.com)에 올릴 파일 템플릿: index.html / news.html / notice.html / sections.html
//   관리자 > 대시보드 '사이트 파일 다운로드' 에서 연결 주소가 자동으로 채워진 파일을 받습니다.
// npm run dev / npm run build 시 자동 실행됩니다.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'sections');
const outGen = path.join(root, 'generated');
fs.mkdirSync(outGen, { recursive: true });

const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const resolve = (f) => read(f).replace(/\/\*@include ([\w./-]+)\*\//g, (_, inc) => read(inc));

const all = fs.readdirSync(dir).filter((f) => /^\d\d-.+\.html$/.test(f)).sort();
const headerFile = all.find((f) => f.startsWith('00-'));
const footerFile = all.find((f) => f.startsWith('99-'));
const sectionFiles = all.filter((f) => f !== headerFile && f !== footerFile);
const sections = sectionFiles.map(resolve).join('\n\n');
const header = (theme) => (headerFile ? resolve(headerFile).replace('__HEADER_THEME__', theme) + '\n\n' : '');
const footer = footerFile ? '\n\n' + resolve(footerFile) : '';

const head = read('standalone/head.html');
const foot = read('standalone/foot.html');
const boardHead = head
  .replace(/\/\*PREFETCH\*\/[\s\S]*?\/\*\/PREFETCH\*\//, '')
  .replace(/\s*<link rel="canonical"[^>]*>/, '');
const board = (mode) => boardHead + header('solid') + read('board/board.html').replace('__BOARD_MODE__', mode) + footer + foot;

const snippetBanner = `<!--
  [HTU CMS] 홈페이지 섹션 묶음 — 기존 페이지의 <body> 안 원하는 위치에 붙여넣으세요.
  섹션들보다 위에 아래 한 줄이 1회 있어야 합니다.
  <script>window.HTU_CMS_ENDPOINT = '__HTU_CMS_ENDPOINT__';</script>
-->
`;

const files = {
  'index.html': head + header('transparent') + sections + footer + foot,
  'news.html': board('news'),
  'notice.html': board('notice'),
  'event.html': board('event'),
  'sections.html': snippetBanner + sections,
};
fs.writeFileSync(path.join(outGen, 'site-files.js'), 'export default ' + JSON.stringify(files) + ';\n');
console.log(`[sections] site-files.js built (${sectionFiles.length} sections + news/notice pages)`);
