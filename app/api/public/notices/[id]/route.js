// 공지사항 상세 (notice.html?id=...)
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import { json, preflight, isUuid } from '@/lib/cors';

export async function GET(_req, { params }) {
  if (!isUuid(params.id)) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const sb = supabasePublic();
  if (!sb) return json({ error: 'SUPABASE_ENV_MISSING' }, { status: 500 });
  const { data } = await sb
    .from('notices')
    .select('id,title,pinned,content_html,attachments,published_at,view_count')
    .eq('id', params.id)
    .eq('active', true)
    .maybeSingle();
  if (!data) return json({ error: 'NOT_FOUND' }, { status: 404 });
  return json({ ...data, content_html: richHtml(data.content_html) });
}
export const OPTIONS = preflight;
