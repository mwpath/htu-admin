// Vercel Cron (vercel.json) — 매일 새벽 빠진 번역을 한 번 더 채움
import { revalidateTag, revalidatePath } from 'next/cache';
import { isCron } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { syncTranslations } from '@/lib/i18n/sync';
import { CMS_TAG } from '@/lib/supabase/public';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!isCron(request)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const sb = supabaseService();
  if (!sb) return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY 가 없습니다.' }, { status: 500 });
  const r = await syncTranslations(sb, { budgetMs: 50000 });
  if (r.translated || r.removed) { revalidateTag(CMS_TAG); revalidatePath('/', 'layout'); }
  return Response.json(r);
}
