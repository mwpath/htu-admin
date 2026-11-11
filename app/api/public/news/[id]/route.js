// 내부 작성 뉴스 상세 (news.html?id=...)
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import { json, preflight, isUuid } from '@/lib/cors';

export async function GET(_req, { params }) {
  if (!isUuid(params.id)) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const sb = supabasePublic();
  if (!sb) return json({ error: 'SUPABASE_ENV_MISSING' }, { status: 500 });
  const { data } = await sb
    .from('news')
    .select('id,type,title,excerpt,thumbnail_url,external_url,content_html,published_at,view_count')
    .eq('id', params.id)
    .eq('active', true)
    .maybeSingle();
  if (!data) return json({ error: 'NOT_FOUND' }, { status: 404 });
  return json({ ...data, content_html: richHtml(data.content_html) });
}
export const OPTIONS = preflight;
