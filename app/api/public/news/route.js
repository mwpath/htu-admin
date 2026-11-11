// News & Event 전체 목록 (news.html 목록용)
import { supabasePublic } from '@/lib/supabase/public';
import { json, preflight } from '@/lib/cors';

export async function GET() {
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], error: 'SUPABASE_ENV_MISSING' });
  const { data, error } = await sb
    .from('news')
    .select('id,type,title,excerpt,thumbnail_url,external_url,published_at')
    .eq('active', true)
    .order('sort');
  return json({ rows: data || [], error: error?.message });
}
export const OPTIONS = preflight;
