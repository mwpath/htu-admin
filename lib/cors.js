export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export const CACHE = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' };

export function json(data, init = {}) {
  return Response.json(data, { ...init, headers: { ...CORS, ...CACHE, ...(init.headers || {}) } });
}
export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}
export const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));
