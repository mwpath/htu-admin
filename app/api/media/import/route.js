// 큰 파일(4MB 초과): 브라우저가 임시 위치(Supabase tmp/)에 올린 파일을 GitHub 로 옮기고 임시 파일은 바로 삭제
// (Vercel 서버는 한 번에 약 4.5MB 까지만 받을 수 있어서 큰 파일은 이 경로를 사용합니다)
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { getGithubConfig, buildPath, checkFile, commitFile } from '@/lib/media/github';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request) {
  if (!(await requireAdmin())) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const cfg = await getGithubConfig();
  if (!cfg.enabled) return Response.json({ error: 'GITHUB_NOT_CONFIGURED' }, { status: 409 });
  const svc = supabaseService();
  if (!svc) return Response.json({ error: '서버 키가 없어 큰 파일을 옮길 수 없습니다.' }, { status: 503 });
  const b = await request.json().catch(() => ({}));
  const tmp = String(b.tmp || '');
  if (!/^tmp\/[\w./-]+$/.test(tmp) || tmp.includes('..')) return Response.json({ error: '잘못된 경로' }, { status: 400 });
  try {
    const { data, error } = await svc.storage.from('cms').download(tmp);
    if (error) throw error;
    const buf = Buffer.from(await data.arrayBuffer());
    const name = String(b.name || tmp.split('/').pop());
    checkFile(name, buf);
    const out = await commitFile(cfg, buildPath(cfg, String(b.folder || 'files'), name), buf);
    return Response.json({ ok: true, ...out, size: buf.length });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 400 });
  } finally {
    await svc.storage.from('cms').remove([tmp]).catch(() => {});
  }
}
