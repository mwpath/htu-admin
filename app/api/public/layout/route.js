// 메뉴 · 푸터 전용 가벼운 JSON (서브 페이지의 menu3.js / footer.js 가 사용)
import { getPublicContent, siteOrigin } from '@/lib/content';
import { json, preflight } from '@/lib/cors';

export async function GET(request) {
  const d = await getPublicContent(siteOrigin(request.url), new URL(request.url).searchParams.get('lang'));
  return json({
    settings: { header: d.settings?.header || {}, footer: d.settings?.footer || {}, i18n: d.settings?.i18n || {} },
    lang: d.lang,
    menus: d.menus,
    error: d.error,
  });
}
export const OPTIONS = preflight;
