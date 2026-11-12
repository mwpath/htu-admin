// 사이트 파일 자동 업데이트 (대표 관리자) — GitHub 저장소에 연동 파일을 한 번에 커밋
import { requireOwner } from '@/lib/admin-auth';
import { getGithubConfig } from '@/lib/media/github';
import { pagesTargets, deployBranch } from '@/lib/site/deploy';
import { SITE_VERSION } from '@/generated/site-files';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request) {
  if (!(await requireOwner())) return Response.json({ error: '대표 관리자만 사용할 수 있습니다.' }, { status: 403 });
  const cfg = await getGithubConfig({ fresh: true });
  if (!cfg.enabled) return Response.json({ error: '연동 설정 → 파일 저장소에서 GitHub 저장소와 토큰을 먼저 저장하세요.' }, { status: 409 });
  const endpoint = new URL(request.url).origin;
  try {
    const { targets, how } = await pagesTargets(cfg);
    const results = [];
    for (const t of targets) results.push(await deployBranch(cfg, t, endpoint));
    return Response.json({ ok: true, version: SITE_VERSION, endpoint, how, results });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 400 });
  }
}
