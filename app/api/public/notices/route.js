// 공지사항 목록 (notice.html?page=N)
import { supabasePublic } from '@/lib/supabase/public';
import { json, preflight } from '@/lib/cors';

const PER = 15;

export async function GET(request) {
  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') || '1', 10) || 1);
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], count: 0, page, per: PER, error: 'SUPABASE_ENV_MISSING' });
  const { data, count, error } = await sb
    .from('notices')
    .select('id,title,pinned,published_at,view_count,attachments', { count: 'exact' })
    .eq('active', true)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .range((page - 1) * PER, page * PER - 1);
  return json({ rows: data || [], count: count || 0, page, per: PER, error: error?.message });
}
export const OPTIONS = preflight;
