// 접속 국가 → 사이트 언어 결정 (사이트 첫 방문 때 한 번 호출)
// Vercel 이 모든 요청에 붙여주는 x-vercel-ip-country 헤더(국가 코드)를 사용합니다.
import { supabasePublic } from '@/lib/supabase/public';
import { resolveLang, enabledLangs, detectMode } from '@/lib/i18n/langs';
import { CORS, preflight } from '@/lib/cors';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const h = request.headers;
  const url = new URL(request.url);
  // 테스트용: ?country=JP
  const country = (url.searchParams.get('country') || h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || '').toUpperCase();
  const accept = h.get('accept-language') || '';
  let i18n = {};
  try {
    const sb = supabasePublic();
    if (sb) {
      const { data } = await sb.from('site_settings').select('value').eq('key', 'i18n').maybeSingle();
      i18n = data?.value || {};
    }
  } catch { /* 설정을 못 읽으면 기본값 */ }
  const lang = resolveLang({ country, accept, i18n });
  return Response.json(
    { lang, country: country || null, languages: ['ko', ...enabledLangs(i18n)], detect: detectMode(i18n) },
    { headers: { ...CORS, 'Cache-Control': 'private, no-store', Vary: '*' } },
  );
}
export const OPTIONS = preflight;
