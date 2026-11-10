// 관리자 저장 후 호출 → 홈페이지/공개 페이지 캐시 즉시 갱신
import { revalidatePath, revalidateTag } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { CMS_TAG } from '@/lib/supabase/public';

export async function POST() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const { data: isAdmin } = await sb.rpc('is_admin');
  if (!isAdmin) return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });

  revalidateTag(CMS_TAG);
  revalidatePath('/', 'layout');
  return Response.json({ ok: true, at: new Date().toISOString() });
}
