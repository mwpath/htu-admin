// 기존 사이트 페이지의 고정 문구 번역 (회사소개 등) — 실제 페이지에 있는 문장만 번역 · 결과는 번역 메모리에 저장
import { supabaseService } from '@/lib/supabase/service';
import { supabasePublic } from '@/lib/supabase/public';
import { translatePageTexts, safePath } from '@/lib/i18n/pages';
import { normLang } from '@/lib/i18n/overlay';
import { enabledLangs } from '@/lib/i18n/fields';
import { siteBaseOf } from '@/lib/content';
import { CORS, preflight } from '@/lib/cors';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const out = (data, status = 200) => Response.json(data, { status, headers: { ...CORS, 'Cache-Control': 'no-store' } });
  let b = {};
  try { b = JSON.parse(await request.text()); } catch { return out({ values: [] }, 400); }
  const lang = normLang(b.lang);
  const path = safePath(b.path);
  if (lang === 'ko' || !path || !Array.isArray(b.texts)) return out({ values: [] });

  const sb = supabaseService();
  const pub = supabasePublic();
  if (!sb || !pub) return out({ values: [], error: 'NOT_CONFIGURED' });
  const { data: rows } = await pub.from('site_settings').select('key,value').in('key', ['site', 'i18n']);
  const st = Object.fromEntries((rows || []).map((r) => [r.key, r.value || {}]));
  if (st.i18n?.translate_pages === false || !enabledLangs(st.i18n).includes(lang)) return out({ values: [] });
  const base = siteBaseOf(st.site);
  const siteBase = /^https?:\/\//.test(base) ? base : '';

  const values = await translatePageTexts(sb, { siteBase, path, lang, texts: b.texts, glossary: String(st.i18n?.glossary || '') });
  return out({ values });
}
export const OPTIONS = preflight;
