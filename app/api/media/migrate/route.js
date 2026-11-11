// 기존 Supabase 업로드 → GitHub 이전 (대표 관리자). GET: 남은 개수 / POST: 한 묶음 이전 (끝날 때까지 반복 호출)
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireOwner } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { getGithubConfig } from '@/lib/media/github';
import { scan, migrateBatch, countStorage } from '@/lib/media/migrate';
import { CMS_TAG } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function guard() {
  if (!(await requireOwner())) return { res: Response.json({ error: '대표 관리자만 사용할 수 있습니다.' }, { status: 403 }) };
  const svc = supabaseService();
  if (!svc) return { res: Response.json({ error: '서버 키가 연결되지 않았습니다.' }, { status: 503 }) };
  return { svc };
}

export async function GET() {
  const g = await guard();
  if (g.res) return g.res;
  const [s, files] = await Promise.all([scan(g.svc), countStorage(g.svc)]);
  return Response.json({ remaining: s.urls.length, storageFiles: files });
}

export async function POST() {
  const g = await guard();
  if (g.res) return g.res;
  const cfg = await getGithubConfig({ fresh: true });
  if (!cfg.enabled) return Response.json({ error: 'GitHub 저장소를 먼저 설정하세요.' }, { status: 409 });
  try {
    const r = await migrateBatch(g.svc, cfg);
    revalidateTag(CMS_TAG);
    revalidatePath('/api/public', 'layout');
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
