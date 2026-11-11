// 기존 사이트 섹션용 공개 JSON (CORS 허용)
import { getPublicContent, siteOrigin } from '@/lib/content';
import { json, preflight } from '@/lib/cors';

export async function GET(request) {
  return json(await getPublicContent(siteOrigin(request.url), new URL(request.url).searchParams.get('lang')));
}
export const OPTIONS = preflight;
