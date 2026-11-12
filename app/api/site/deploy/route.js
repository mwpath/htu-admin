// 사이트 파일 자동 업데이트 (대표 관리자) — GitHub 저장소에 연동 파일을 한 번에 커밋
import { requireOwner } from '@/lib/admin-auth';
import { getGithubConfig } from '@/lib/media/github';
import { pagesTargets, deployBranch } from '@/lib/site/deploy';
import { publishPosts } from '@/lib/site/posts';
import { supabaseService } from '@/lib/supabase/service';
import { SITE_VERSION } from '@/generated/site-files';
import { stableEndpoint } from '@/lib/site/endpoint';
import { getPublicContent, siteOrigin } from '@/lib/content';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request) {
  if (!(await requireOwner())) return Response.json({ error: '대표 관리자만 사용할 수 있습니다.' }, { status: 403 });
  const cfg = await getGithubConfig({ fresh: true });
  if (!cfg.enabled) return Response.json({ error: '연동 설정 → 파일 저장소에서 GitHub 저장소와 토큰을 먼저 저장하세요.' }, { status: 409 });
  const endpoint = stableEndpoint(request.url);
  // 관리자 서버가 잠시 멈춰도 사이트가 비지 않도록 현재 공개 콘텐츠를 사이트에 백업 (js/htu-cms-data.js)
  let snapshot = null;
  try {
    const c = await getPublicContent(siteOrigin(request.url));
    if (c && !c.error) snapshot = c;
  } catch { /* 백업 없이 진행 */ }
  try {
    const { targets, how } = await pagesTargets(cfg);
    const results = [];
    for (const t of targets) results.push(await deployBranch(cfg, t, endpoint, snapshot));
    // 검색엔진용 글 페이지 · sitemap 도 함께 (실패해도 사이트 파일 업데이트는 유지)
    let seo = null;
    try { const sb = supabaseService(); if (sb) seo = await publishPosts({ sb, cfg, targets, endpoint, snapshot }); } catch (e) { seo = { error: String(e.message || e) }; }
    return Response.json({ ok: true, version: SITE_VERSION, endpoint, how, results, seo });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 400 });
  }
}
