import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 이벤트 목록 (event.html)
import { supabasePublic } from '@/lib/supabase/public';
import { json, preflight } from '@/lib/cors';

export async function GET(request) {
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], error: 'SUPABASE_ENV_MISSING' });
  const { data, error } = await sb
    .from('events')
    .select('id,title,summary,thumbnail_url,start_date,end_date,location,link_type,external_url,published_at')
    .eq('active', true)
    .order('sort');
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['events']);
  return json({ rows: applyRows(tr, 'events', data || []), error: error?.message });
}
export const OPTIONS = preflight;
