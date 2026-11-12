// 사이트가 부를 관리자 주소 — 확인 · 직접 지정(대표 관리자) · 사이트에 즉시 적용
import { requireAdmin, requireOwner } from '@/lib/admin-auth';
import { getGithubConfig } from '@/lib/media/github';
import { supabaseService } from '@/lib/supabase/service';
import { getPublicContent, siteOrigin } from '@/lib/content';
import { LINK_KEY, normalizeUrl, stableEndpoint, productionUrl, savedEndpoint, resolveEndpoint, isDeploymentUrl, probeEndpoint } from '@/lib/site/endpoint';
import { runFullDeploy } from '@/lib/site/run';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function liveEndpoint(reqUrl) {
  try {
    const c = await getPublicContent(siteOrigin(reqUrl));
    const base = String(c.settings?.site?.site_url || 'https://htuglobal.com').replace(/\/+$/, '');
    const r = await fetch(`${base}/js/htu-cms-config.js?ep=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const t = r.ok ? await r.text() : '';
    return normalizeUrl((t.match(/HTU_CMS_ENDPOINT\s*=\s*['"]([^'"]+)['"]/) || [])[1]) || null;
  } catch { return null; }
}

export async function GET(request) {
  if (!(await requireAdmin())) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const origin = new URL(request.url).origin;
  const [saved, live, endpoint] = await Promise.all([savedEndpoint().catch(() => ''), liveEndpoint(request.url), resolveEndpoint(request.url)]);
  const candidates = [...new Set([saved, productionUrl(), stableEndpoint(request.url), origin].filter(Boolean))]
    .map((url) => ({ url, deployment: isDeploymentUrl(url), current: url === origin, production: url === productionUrl(), saved: url === saved }));
  const url = new URL(request.url);
  const probe = url.searchParams.get('probe');
  return Response.json({
    endpoint, saved: saved || null, live, liveIsDeployment: live ? isDeploymentUrl(live) : false, candidates,
    ...(probe ? { probe: { url: normalizeUrl(probe), ...(await probeEndpoint(normalizeUrl(probe))) } } : {}),
  });
}

export async function POST(request) {
  if (!(await requireOwner())) return Response.json({ error: '대표 관리자만 바꿀 수 있습니다.' }, { status: 403 });
  let b = {};
  try { b = await request.json(); } catch { /* noop */ }
  const sb = supabaseService();
  if (!sb) return Response.json({ error: '서버 키가 없습니다.' }, { status: 500 });

  // 지정 해제 → 자동(운영 주소)
  if (b.reset) {
    await sb.from('site_settings').delete().eq('key', LINK_KEY);
  } else {
    const url = normalizeUrl(b.url);
    if (!url) return Response.json({ error: 'https:// 로 시작하는 올바른 주소를 입력하세요.' }, { status: 400 });
    const p = await probeEndpoint(url);
    if (!p.ok && !b.force) return Response.json({ error: `이 주소는 방문자가 쓸 수 없습니다: ${p.reason}`, probe: p }, { status: 422 });
    const { error } = await sb.from('site_settings').upsert({ key: LINK_KEY, value: { url, at: new Date().toISOString() } }, { onConflict: 'key' });
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  const endpoint = await resolveEndpoint(request.url);
  if (!b.apply) return Response.json({ ok: true, endpoint });

  const cfg = await getGithubConfig({ fresh: true });
  if (!cfg.enabled) return Response.json({ ok: true, endpoint, warning: 'GitHub 가 연결되지 않아 사이트 파일은 바꾸지 못했습니다. "사이트 연동 파일 받기"에서 js/htu-cms-config.js 를 받아 직접 올리세요.' });
  try {
    return Response.json({ ...(await runFullDeploy({ cfg, endpoint, reqUrl: request.url, force: !!b.force })), endpoint });
  } catch (e) {
    return Response.json({ error: `주소는 저장했지만 사이트 반영 실패: ${String(e.message || e)}` }, { status: 400 });
  }
}
