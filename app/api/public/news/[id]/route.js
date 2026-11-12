import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 내부 작성 뉴스 상세 (news.html?id=...)
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import { json, preflight, isUuid } from '@/lib/cors';

export async function GET(request, { params }) {
  if (!isUuid(params.id)) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const sb = supabasePublic();
  if (!sb) return json({ error: 'SUPABASE_ENV_MISSING' }, { status: 500 });
  // DB 가 아직 v10(썸네일 · 검색 메타) 이전이면 예전 칸으로 다시 조회 → 사이트가 비지 않음
  const run = (cols) => sb
    .from('news')
    .select(cols)
    .eq('id', params.id)
    .eq('active', true)
    .maybeSingle();
  let res = await run('id,type,title,excerpt,thumbnail_url,external_url,content_html,published_at,view_count,seo_title,seo_description,seo_path');
  if (res.error && /seo_|thumbnail_url|column/i.test(res.error.message || '')) { res = await run('id,type,title,excerpt,thumbnail_url,external_url,content_html,published_at,view_count'); }
  const { data } = res;
  if (!data) return json({ error: 'NOT_FOUND' }, { status: 404 });
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['news']);
  const row = applyRows(tr, 'news', [data])[0];
  return json({ ...row, content_html: richHtml(row.content_html) });
}
export const OPTIONS = preflight;
