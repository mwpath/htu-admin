// 업로드 저장 위치 (관리자 화면이 어디로 올릴지 결정)
import { requireAdmin } from '@/lib/admin-auth';
import { getGithubConfig, MAX_MB } from '@/lib/media/github';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await requireAdmin())) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const cfg = await getGithubConfig();
  return Response.json({ github: cfg.enabled, repo: cfg.enabled ? cfg.repo : null, maxMB: MAX_MB, directMB: 4 });
}
