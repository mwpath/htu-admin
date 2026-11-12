// 관리자 로그인 (서버에서 처리)
// - 아이디 → 내부 로그인 주소 변환을 서버에서만 (직원 이메일 노출 방지)
// - 무차별 대입 차단: 같은 아이디 15분 5회 / 같은 IP 15분 20회 실패 시 잠시 잠금
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service';
import { LOGIN_DOMAIN } from '@/lib/login-id';

export const dynamic = 'force-dynamic';
const WINDOW_MIN = 15, MAX_PER_LOGIN = 5, MAX_PER_IP = 20;
const mem = new Map(); // DB 테이블이 없을 때를 대비한 인스턴스 메모리 제한

function ipOf(req) {
  return (req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(request) {
  const started = Date.now();
  // 같은 사이트에서 보낸 요청만 (다른 사이트에서 로그인 시도 차단)
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });

  let body = {};
  try { body = await request.json(); } catch { /* noop */ }
  const login = String(body.login || '').trim().toLowerCase().slice(0, 120);
  const password = String(body.password || '');
  if (!login || !password || password.length > 200) return Response.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });

  const ip = ipOf(request);
  const svc = supabaseService();
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  let useDb = !!svc;

  // ── 잠금 확인
  if (useDb) {
    const [a, b] = await Promise.all([
      svc.from('login_attempts').select('id', { count: 'exact', head: true }).eq('login', login).eq('ok', false).gte('at', since),
      svc.from('login_attempts').select('id', { count: 'exact', head: true }).eq('ip', ip).eq('ok', false).gte('at', since),
    ]);
    if (a.error || b.error) useDb = false;
    else if ((a.count || 0) >= MAX_PER_LOGIN || (b.count || 0) >= MAX_PER_IP) {
      return Response.json({ error: `로그인 실패가 많아 ${WINDOW_MIN}분 동안 잠겼습니다. 잠시 후 다시 시도하거나 대표 관리자에게 문의하세요.` }, { status: 429 });
    }
  }
  if (!useDb) {
    const now = Date.now();
    const k1 = 'l:' + login, k2 = 'i:' + ip;
    for (const k of [k1, k2]) mem.set(k, (mem.get(k) || []).filter((t) => now - t < WINDOW_MIN * 60_000));
    if (mem.get(k1).length >= MAX_PER_LOGIN || mem.get(k2).length >= MAX_PER_IP) {
      return Response.json({ error: `로그인 실패가 많아 ${WINDOW_MIN}분 동안 잠겼습니다.` }, { status: 429 });
    }
  }

  // ── 아이디 → 로그인 주소 (서버 권한으로만 조회)
  let email = login.includes('@') ? login : null;
  if (!email && svc) {
    const { data } = await svc.rpc('login_email', { p_login: login });
    email = data || null;
  }
  if (!email) email = `${login}@${LOGIN_DOMAIN}`;

  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  const ok = !error;

  if (useDb) svc.from('login_attempts').insert({ ip, login, ok }).then(() => {}, () => {});
  else if (!ok) { const now = Date.now(); mem.get('l:' + login).push(now); mem.get('i:' + ip).push(now); }
  if (ok && useDb) svc.from('login_attempts').delete().lt('at', new Date(Date.now() - 30 * 864e5).toISOString()).then(() => {}, () => {});

  if (!ok) {
    // 실패 응답 시간을 일정하게 → 계정 존재 여부 추측 방지
    const wait = 600 - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    return Response.json({ error: '아이디 또는 비밀번호를 확인해 주세요.' }, { status: 401 });
  }
  return Response.json({ ok: true });
}
