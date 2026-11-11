// 조회수 +1 (내부 뉴스 / 공지)
import { createClient } from '@supabase/supabase-js';
import { CORS, preflight, isUuid } from '@/lib/cors';

export async function POST(request) {
  let body = {};
  try { body = JSON.parse(await request.text()); } catch {}
  const { table, id } = body;
  if (!['news', 'notices', 'events'].includes(table) || !isUuid(id)) return new Response(null, { status: 204, headers: CORS });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    await sb.rpc('bump_view', { p_table: table, p_id: id });
  }
  return new Response(null, { status: 204, headers: { ...CORS, 'Cache-Control': 'no-store' } });
}
export const OPTIONS = preflight;
