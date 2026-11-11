import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 이벤트 상세 (event.html?id=...)
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import { json, preflight, isUuid } from '@/lib/cors';

export async function GET(request, { params }) {
  if (!isUuid(params.id)) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const sb = supabasePublic();
  if (!sb) return json({ error: 'SUPABASE_ENV_MISSING' }, { status: 500 });
  const { data } = await sb.from('events').select('*').eq('id', params.id).eq('active', true).maybeSingle();
  if (!data) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['events']);
  const row = applyRows(tr, 'events', [data])[0];
  return json({ ...row, content_html: richHtml(row.content_html) });
}
export const OPTIONS = preflight;
