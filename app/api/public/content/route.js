// 외부 사이트 임베드용 공개 JSON (CORS 허용)
import { getPublicContent, siteOrigin } from '@/lib/content';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request) {
  const data = await getPublicContent(siteOrigin(request.url));
  return Response.json(data, {
    headers: { ...CORS, 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
