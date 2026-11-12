// 검색엔진용 정적 페이지 · sitemap 발행 (직원 누구나 — 공지 · 이벤트 · 뉴스 저장 후 자동 호출)
import { requireAdmin } from '@/lib/admin-auth';
import { getGithubConfig } from '@/lib/media/github';
import { supabaseService } from '@/lib/supabase/service';
import { pagesTargets } from '@/lib/site/deploy';
import { publishPosts } from '@/lib/site/posts';
import { resolveEndpoint, probeEndpoint } from '@/lib/site/endpoint';
import { getPublicContent, siteOrigin } from '@/lib/content';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  if (!(await requireAdmin())) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const cfg = await getGithubConfig({ fresh: true });
  if (!cfg.enabled) return Response.json({ skipped: true, error: 'GitHub 저장소가 연결되지 않아 검색엔진 페이지를 올리지 못했습니다.' });
  const sb = supabaseService();
  if (!sb) return Response.json({ skipped: true, error: '서버 키가 없습니다.' });
  try {
    const { targets } = await pagesTargets(cfg);
    let snapshot = null;
    try { const c = await getPublicContent(siteOrigin(request.url)); if (c && !c.error) snapshot = c; } catch { /* noop */ }
    // 방문자가 쓸 수 없는 관리자 주소면 홈 · 연동 파일은 건드리지 않음 (검색엔진 글 페이지만 발행)
    const endpoint = await resolveEndpoint(request.url);
    const probe = await probeEndpoint(endpoint);
    const r = await publishPosts({ sb, cfg, targets, endpoint: probe.ok ? endpoint : null, snapshot });
    return Response.json({ ok: true, ...r, homeSkipped: probe.ok ? undefined : `${endpoint}: ${probe.reason}` });
  } catch (e) {
    const msg = String(e.message || e);
    return Response.json({ error: /seo_path|column/i.test(msg) ? 'DB 업데이트(v10)가 필요합니다. 연동 설정에서 DB 자동 업데이트를 실행하세요.' : msg, skipped: /seo_path|column/i.test(msg) }, { status: 400 });
  }
}
