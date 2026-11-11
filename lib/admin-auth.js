import { supabaseServer } from './supabase/server';

// 관리자 세션 확인 → 세션 클라이언트 반환 (아니면 null)
export async function requireAdmin() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: ok } = await sb.rpc('is_admin');
  return ok ? sb : null;
}

export function isCron(request) {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
}
