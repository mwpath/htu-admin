import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// News & Event 전체 목록 (news.html 목록용)
import { supabasePublic } from '@/lib/supabase/public';
import { json, preflight } from '@/lib/cors';

export async function GET(request) {
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], error: 'SUPABASE_ENV_MISSING' });
  // DB 가 아직 v10(썸네일 · 검색 메타) 이전이면 예전 칸으로 다시 조회 → 사이트가 비지 않음
  const run = (cols) => sb
    .from('news')
    .select(cols)
    .eq('active', true)
    .order('sort');
  let res = await run('id,type,title,excerpt,thumbnail_url,external_url,published_at,seo_path');
  if (res.error && /seo_|thumbnail_url|column/i.test(res.error.message || '')) { res = await run('id,type,title,excerpt,thumbnail_url,external_url,published_at'); }
  const { data, error } = res;
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['news']);
  return json({ rows: applyRows(tr, 'news', data || []), error: error?.message });
}
export const OPTIONS = preflight;
