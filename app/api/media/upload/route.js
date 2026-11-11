// 작은 파일(4MB 이하): 관리자 → 이 서버 → GitHub 커밋
import { requireAdmin } from '@/lib/admin-auth';
import { getGithubConfig, buildPath, checkFile, commitFile } from '@/lib/media/github';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  if (!(await requireAdmin())) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const cfg = await getGithubConfig();
  if (!cfg.enabled) return Response.json({ error: 'GITHUB_NOT_CONFIGURED' }, { status: 409 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return Response.json({ error: '파일이 없습니다.' }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    checkFile(file.name, buf);
    const path = buildPath(cfg, String(form.get('folder') || 'files'), file.name);
    const out = await commitFile(cfg, path, buf);
    return Response.json({ ok: true, ...out, size: buf.length });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 400 });
  }
}
