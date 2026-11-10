// sections/*.html → (1) generated/home-template.js  : 홈페이지 서버 렌더용 템플릿
//                   (2) public/embed/*.html           : 다른 사이트에 붙여넣는 독립 섹션 조각
// npm run dev / npm run build 시 자동 실행됩니다.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'sections');
const outGen = path.join(root, 'generated');
const outEmbed = path.join(root, 'public', 'embed');
fs.mkdirSync(outGen, { recursive: true });
fs.mkdirSync(outEmbed, { recursive: true });

const resolve = (file) =>
  fs
    .readFileSync(path.join(dir, file), 'utf8')
    .replace(/\/\*@include ([\w./-]+)\*\//g, (_, f) => fs.readFileSync(path.join(dir, f), 'utf8'));

const files = fs.readdirSync(dir).filter((f) => /^\d\d-.+\.html$/.test(f)).sort();
const head = files.find((f) => f.startsWith('00-'));
const foot = files.find((f) => f.startsWith('99-'));
const body = files.filter((f) => f !== head && f !== foot);

const parts = body.map(resolve);
const html = resolve(head) + '\n' + parts.join('\n\n') + '\n' + resolve(foot);
fs.writeFileSync(path.join(outGen, 'home-template.js'), 'export default ' + JSON.stringify(html) + ';\n');

const banner = (name) => `<!--
  [HTU CMS 섹션] ${name}
  다른 사이트(아임웹/카페24/정적 HTML 등)에 붙여넣을 때는 이 섹션들보다 위쪽에 아래 한 줄을 1회만 넣어주세요.
  <script>window.HTU_CMS_ENDPOINT = 'https://관리자-배포-도메인';</script>
  내용 수정은 관리자 페이지(/admin)에서 하면 자동 반영됩니다.
-->
`;
body.forEach((f, i) => {
  const name = f.replace(/^\d\d-/, '');
  fs.writeFileSync(path.join(outEmbed, name), banner(name) + parts[i]);
});
fs.writeFileSync(path.join(outEmbed, 'all-sections.html'), banner('all-sections.html') + parts.join('\n\n'));

// (3) 기존 사이트(htuglobal.com)에 통째로 올리는 완성 페이지
const sDir = path.join(dir, 'standalone');
if (fs.existsSync(path.join(sDir, 'head.html'))) {
  const endpoint = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') || 'https://YOUR-CMS.vercel.app';
  const page =
    fs.readFileSync(path.join(sDir, 'head.html'), 'utf8').replace('__HTU_CMS_ENDPOINT__', endpoint) +
    parts.join('\n\n') +
    fs.readFileSync(path.join(sDir, 'foot.html'), 'utf8');
  fs.writeFileSync(path.join(outEmbed, 'index.html'), page);
}

console.log(`[sections] home-template.js + ${body.length} embeds + index.html built`);
