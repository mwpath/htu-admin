export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
// 브라우저는 저장하지 않고 매번 확인 (예전: 브라우저가 이전 내용을 최대 5분간 먼저 보여줘서 '수정이 반영 안 됨'처럼 보였음)
// Vercel CDN 만 10초 보관 → 관리자 저장 후 약 10초 안에 사이트에 반영
export const CACHE = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=10, stale-while-revalidate=20',
};

export function json(data, init = {}) {
  return Response.json(data, { ...init, headers: { ...CORS, ...CACHE, ...(init.headers || {}) } });
}
export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}
export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));
