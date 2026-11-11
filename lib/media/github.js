// 업로드 파일을 GitHub 저장소에 커밋합니다 (서버 전용).
// 설정은 관리자 '연동 설정 → 파일 저장소'에서 저장하며 Supabase(app_secrets)에 보관됩니다.
import { getSecrets } from '../secrets';

const API = process.env.GITHUB_API_URL || 'https://api.github.com'; // 테스트용으로만 바꿀 수 있음
export const MAX_MB = 50; // GitHub 는 50MB 넘는 파일에 경고, 100MB 부터 거부

export const ALLOWED_EXT = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico',
  'mp4', 'webm', 'mov', 'm4v', 'mp3', 'm4a',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp', 'hwpx', 'zip', 'txt', 'csv',
]);

export async function getGithubConfig(opts) {
  const s = await getSecrets(opts);
  const repo = String(s.github_repo || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
  const token = String(s.github_token || '').trim();
  return {
    enabled: !!(token && /^[\w.-]+\/[\w.-]+$/.test(repo)),
    repo,
    token,
    branch: String(s.github_branch || '').trim(),
    folder: String(s.github_folder || 'uploads').trim().replace(/^\/+|\/+$/g, '') || 'uploads',
    urlMode: s.media_url_mode === 'cdn' ? 'cdn' : 'site',
  };
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'htu-cms' };
}

async function gh(cfg, path, init = {}) {
  const res = await fetch(API + path, { ...init, headers: { ...headers(cfg.token), ...(init.headers || {}) }, cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* noop */ }
  return { ok: res.ok, status: res.status, json, text };
}

const branchCache = new Map();
export async function resolveBranch(cfg) {
  if (cfg.branch) return cfg.branch;
  if (branchCache.has(cfg.repo)) return branchCache.get(cfg.repo);
  const r = await gh(cfg, `/repos/${cfg.repo}`);
  if (!r.ok) throw new Error(ghError(r));
  branchCache.set(cfg.repo, r.json.default_branch);
  return r.json.default_branch;
}

export function ghError(r) {
  const m = r.json?.message || r.text?.slice(0, 200) || '';
  if (r.status === 401) return 'GitHub 토큰이 올바르지 않거나 만료되었습니다.';
  if (r.status === 403) return `GitHub 권한이 없습니다 (토큰에 Contents: Read and write 권한이 필요). ${m}`;
  if (r.status === 404) return '저장소를 찾을 수 없습니다. 저장소 이름과 토큰의 저장소 선택을 확인하세요.';
  return `GitHub ${r.status}: ${m}`;
}

const slug = (name) => String(name || 'file').normalize('NFKD').replace(/\.[^.]+$/, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'file';

export function buildPath(cfg, folder, filename) {
  const ext = (String(filename).split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const d = new Date();
  const sub = String(folder || 'uploads').replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '').replace(/^uploads\/?/, '') || 'files';
  return `${cfg.folder}/${sub}/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}-${slug(filename)}.${ext}`;
}

// 사이트에서 쓰는 주소: 사이트 저장소면 ./uploads/... (기존 ./img 와 같은 방식), 별도 저장소면 jsDelivr CDN
export function publicUrl(cfg, branch, path) {
  if (cfg.urlMode === 'cdn') return `https://cdn.jsdelivr.net/gh/${cfg.repo}@${branch}/${path}`;
  return `./${path}`;
}
// 관리자 미리보기용 (사이트 반영 전에도 바로 보이도록)
export function rawUrl(cfg, branch, path) {
  return `https://raw.githubusercontent.com/${cfg.repo}/${branch}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function checkFile(name, buf) {
  const ext = (String(name).split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) throw new Error(`올릴 수 없는 파일 형식입니다 (.${ext})`);
  if (buf.length > MAX_MB * 1024 * 1024) throw new Error(`${MAX_MB}MB 이하 파일만 올릴 수 있습니다. 큰 영상은 YouTube · Vimeo 링크를 사용하세요.`);
  if (ext === 'svg') {
    const t = buf.toString('utf8');
    if (/<script|\son\w+\s*=|javascript:/i.test(t)) throw new Error('스크립트가 들어 있는 SVG 는 올릴 수 없습니다.');
  }
  return ext;
}

/** 파일 1개 커밋 (동시에 여러 개 올릴 때 충돌하면 자동 재시도) */
export async function commitFile(cfg, path, buf, message) {
  const branch = await resolveBranch(cfg);
  const body = JSON.stringify({ message: message || `CMS 업로드: ${path.split('/').pop()}`, content: buf.toString('base64'), branch });
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await gh(cfg, `/repos/${cfg.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', body, headers: { 'content-type': 'application/json' } });
    if (r.ok) return { branch, path, url: publicUrl(cfg, branch, path), preview: rawUrl(cfg, branch, path) };
    if (r.status === 409 || (r.status === 422 && /sha|reference|update/i.test(r.json?.message || ''))) {
      await new Promise((ok) => setTimeout(ok, 400 * (attempt + 1) + Math.random() * 300));
      continue;
    }
    throw new Error(ghError(r));
  }
  throw new Error('GitHub 에 동시에 많은 파일이 올라가는 중입니다. 잠시 후 다시 시도하세요.');
}

export async function fileExists(cfg, branch, path) {
  const r = await gh(cfg, `/repos/${cfg.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`, { method: 'GET', headers: { Accept: 'application/vnd.github.object' } });
  return r.ok;
}

/** 연결 테스트: 저장소 · 쓰기 권한 · GitHub Pages 주소 */
export async function testGithub(cfg) {
  if (!cfg.token) return { ok: false, error: 'GitHub 토큰을 입력하세요.' };
  if (!/^[\w.-]+\/[\w.-]+$/.test(cfg.repo)) return { ok: false, error: '저장소를 "계정/저장소이름" 형식으로 입력하세요. 예) htuglobal/htuglobal.github.io' };
  const r = await gh(cfg, `/repos/${cfg.repo}`);
  if (!r.ok) return { ok: false, error: ghError(r) };
  const repo = r.json;
  const pages = await gh(cfg, `/repos/${cfg.repo}/pages`);
  // 실제 쓰기 권한 확인: 커밋에 연결되지 않는 작은 blob 을 만들어 봄 (저장소 내용은 바뀌지 않음)
  const w = await gh(cfg, `/repos/${cfg.repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: 'htu-cms write test', encoding: 'utf-8' }), headers: { 'content-type': 'application/json' } });
  const canWrite = w.ok;
  return {
    ok: canWrite,
    error: canWrite ? null : `이 토큰으로는 저장소에 쓸 수 없습니다 — 토큰 권한을 Contents: Read and write 로 설정하세요. (${ghError(w)})`,
    repo: repo.full_name,
    private: repo.private,
    branch: cfg.branch || repo.default_branch,
    pages: pages.ok ? { url: pages.json.html_url, cname: pages.json.cname || null } : null,
    sizeMB: Math.round((repo.size || 0) / 1024),
  };
}
