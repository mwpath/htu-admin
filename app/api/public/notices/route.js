import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 공지사항 목록 (notice.html?page=N)
import { supabasePublic } from '@/lib/supabase/public';
import { json, preflight } from '@/lib/cors';

const PER = 15;

export async function GET(request) {
  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get('page') || '1', 10) || 1);
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], count: 0, page, per: PER, error: 'SUPABASE_ENV_MISSING' });
  // DB 가 아직 v10(썸네일 · 검색 메타) 이전이면 예전 칸으로 다시 조회 → 사이트가 비지 않음
  const run = (cols) => sb
    .from('notices')
    .select(cols, { count: 'exact' })
    .eq('active', true)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .range((page - 1) * PER, page * PER - 1);
  let res = await run('id,title,pinned,published_at,view_count,attachments,thumbnail_url,seo_path');
  if (res.error && /seo_|thumbnail_url|column/i.test(res.error.message || '')) { res = await run('id,title,pinned,published_at,view_count,attachments'); }
  const { data, count, error } = res;
  const lang = normLang(new URL(request.url).searchParams.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['notices']);
  return json({ rows: applyRows(tr, 'notices', data || []), count: count || 0, page, per: PER, error: error?.message });
}
export const OPTIONS = preflight;
