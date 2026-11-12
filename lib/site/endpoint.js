// 사이트가 부를 "고정" 관리자 주소.
// Vercel 배포별 주소(…-abc123xyz-팀.vercel.app)나 미리보기 주소는 Vercel 로그인 보호가 걸려 있어
// 방문자가 접근하면 401 → 사이트가 데이터를 못 받습니다.
// 우선순위: ① 관리자에서 직접 지정한 주소 ② NEXT_PUBLIC_SITE_URL ③ Vercel 운영(Production) 주소 ④ 지금 접속한 주소
import { supabaseService } from '../supabase/service';

export const LINK_KEY = 'admin_link';

export function normalizeUrl(v) {
  let s = String(v || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(u.hostname)) return '';
    return u.origin;
  } catch { return ''; }
}

export function stableEndpoint(reqUrl) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  if (env) return env;
  let u; try { u = new URL(reqUrl); } catch { return ''; }
  const prod = productionUrl();
  if (prod && u.hostname.endsWith('.vercel.app')) return prod;
  return u.origin;
}

export function productionUrl() {
  const p = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return p ? `https://${p}` : '';
}

export async function savedEndpoint() {
  const sb = supabaseService();
  if (!sb) return '';
  const { data } = await sb.from('site_settings').select('value').eq('key', LINK_KEY).maybeSingle();
  return normalizeUrl(data?.value?.url);
}

/** 실제로 사이트에 넣을 관리자 주소 */
export async function resolveEndpoint(reqUrl) {
  try { const s = await savedEndpoint(); if (s) return s; } catch { /* noop */ }
  return stableEndpoint(reqUrl);
}

export function isDeploymentUrl(url) {
  try {
    const h = new URL(url).hostname;
    const vu = (process.env.VERCEL_URL || '').toLowerCase();
    return (vu && h === vu) || /-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app$/.test(h) || /-git-[a-z0-9-]+\.vercel\.app$/.test(h);
  } catch { return false; }
}

/** 방문자 입장에서 그 주소가 데이터를 내주는지 (서버에서 확인) */
export async function probeEndpoint(url) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${url}/api/public/content?probe=${Date.now()}`, { cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'htu-cms-probe' } });
    const ms = Date.now() - t0;
    if (r.status === 401 || r.status === 403) return { ok: false, ms, reason: `${r.status} — Vercel 로그인 보호가 걸린 주소입니다 (방문자 접근 불가)` };
    if (r.status >= 300 && r.status < 400) return { ok: false, ms, reason: `${r.status} — 다른 곳으로 이동시키는 주소입니다 (Vercel 로그인 화면일 가능성)` };
    if (!r.ok) return { ok: false, ms, reason: `HTTP ${r.status}` };
    let j = null; try { j = await r.json(); } catch { /* noop */ }
    if (!j || !j.settings) return { ok: false, ms, reason: 'HTU CMS 관리자 주소가 아닙니다 (콘텐츠 응답 형식이 다름)' };
    if (j.error) return { ok: false, ms, reason: `관리자 서버 오류: ${j.error}` };
    if (!/\*/.test(r.headers.get('access-control-allow-origin') || '')) return { ok: false, ms, reason: '사이트에서 부를 수 없습니다 (CORS 허용 없음)' };
    return { ok: true, ms };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, reason: `연결 실패: ${String(e.message || e).slice(0, 120)}` };
  }
}
