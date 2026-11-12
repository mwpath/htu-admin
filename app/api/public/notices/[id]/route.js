import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 공지사항 상세 (notice.html?id=...)
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import { json, preflight, isUuid } from '@/lib/cors';

export async function GET(request, { params }) {
  if (!isUuid(params.id)) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const sb = supabasePublic();
  if (!sb) return json({ error: 'SUPABASE_ENV_MISSING' }, { status: 500 });
  // DB 가 아직 v10(썸네일 · 검색 메타) 이전이면 예전 칸으로 다시 조회 → 사이트가 비지 않음
  const run = (cols) => sb
    .from('notices')
    .select(cols)
    .eq('id', params.id)
    .eq('active', true)
    .maybeSingle();
  let res = await run('id,title,pinned,content_html,attachments,published_at,view_count,thumbnail_url,seo_title,seo_description,seo_path');
  if (res.error && /seo_|thumbnail_url|column/i.test(res.error.message || '')) { res = await run('id,title,pinned,content_html,attachments,published_at,view_count'); }
  const { data } = res;
  if (!data) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['notices']);
  const row = applyRows(tr, 'notices', [data])[0];
  return json({ ...row, content_html: richHtml(row.content_html) });
}
export const OPTIONS = preflight;
