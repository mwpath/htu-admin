// 번역 동기화 (관리자 저장 직후 자동 호출 · '지금 전체 번역' 버튼)
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin, isCron } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { syncTranslations } from '@/lib/i18n/sync';
import { CMS_TAG } from '@/lib/supabase/public';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const admin = isCron(request) ? null : await requireAdmin();
  if (!admin && !isCron(request)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const sb = supabaseService() || admin;
  if (!sb) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY 가 없습니다.' }, { status: 500 });
  try {
    const r = await syncTranslations(sb, { budgetMs: 45000 });
    if (r.translated || r.removed) {
      revalidateTag(CMS_TAG);
      revalidatePath('/', 'layout');
    }
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
