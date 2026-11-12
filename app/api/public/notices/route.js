import { loadTranslationMap, applyRows, normLang } from '@/lib/i18n/overlay';
// 공지사항 목록 (notice.html?page=N&q=검색어) — 카드형용 썸네일 · 요약 포함
import { supabasePublic } from '@/lib/supabase/public';
import { plainText } from '@/lib/sanitize';
import { json, preflight } from '@/lib/cors';

const PER = 12;

function summarize(r) {
  const html = String(r.content_html || '');
  const img = r.thumbnail_url || (html.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || null;
  const excerpt = (r.seo_description || plainText(html.replace(/<(br|\/p|\/h\d|\/li|\/div|\/td)[^>]*>/gi, ' '))).replace(/\s+/g, ' ').trim().slice(0, 140);
  const { content_html, seo_description, ...rest } = r; // eslint-disable-line no-unused-vars
  return { ...rest, img, excerpt };
}

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Math.min(1000, parseInt(sp.get('page') || '1', 10) || 1));
  const q = String(sp.get('q') || '').trim().slice(0, 50).replace(/[%,()*\\]/g, ' ');
  const sb = supabasePublic();
  if (!sb) return json({ rows: [], count: 0, page, per: PER, error: 'SUPABASE_ENV_MISSING' });
  // DB 가 아직 v10(썸네일 · 검색 메타) 이전이면 예전 칸으로 다시 조회 → 사이트가 비지 않음
  const run = (cols) => {
    let b = sb.from('notices').select(cols, { count: 'exact' }).eq('active', true);
    if (q) b = b.or(`title.ilike.%${q}%,content_html.ilike.%${q}%`);
    return b.order('pinned', { ascending: false }).order('published_at', { ascending: false }).range((page - 1) * PER, page * PER - 1);
  };
  let res = await run('id,title,pinned,published_at,view_count,attachments,content_html,thumbnail_url,seo_path,seo_description');
  if (res.error && /seo_|thumbnail_url|column/i.test(res.error.message || '')) res = await run('id,title,pinned,published_at,view_count,attachments,content_html');
  const { data, count, error } = res;
  const lang = normLang(sp.get('lang'));
  const tr = await loadTranslationMap(sb, lang, ['notices']);
  return json({ rows: applyRows(tr, 'notices', data || []).map(summarize), count: count || 0, page, per: PER, q, error: error?.message });
}
export const OPTIONS = preflight;
