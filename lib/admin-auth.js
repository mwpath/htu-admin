import { supabaseServer } from './supabase/server';

// 로그인한 직원 정보 { user, me: admin_users 행 } — 직원이 아니면 me 가 null
export async function getStaff() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, me: null };
  const { data: me } = await sb.from('admin_users').select('user_id, email, username, name, role, permissions, active').eq('user_id', user.id).maybeSingle();
  return { sb, user, me: me && me.active !== false ? me : null };
}

// 관리자(직원) 세션 확인 → 세션 클라이언트 반환 (아니면 null)
export async function requireAdmin() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: ok } = await sb.rpc('is_admin');
  return ok ? sb : null;
}

// 특정 메뉴 편집 권한
export async function requirePerm(section) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: ok } = await sb.rpc('can_edit', { p_section: section });
  return ok ? sb : null;
}

// 대표 관리자만
export async function requireOwner() {
  const { sb, user, me } = await getStaff();
  return me && me.role === 'owner' ? { sb, user, me } : null;
}

// Vercel 예약 작업(매일 번역 점검) 확인.
// CRON_SECRET 을 넣어두면 그것으로 확인하고, 없으면 Vercel 예약 작업 표시로 확인합니다.
// (이 작업은 바뀐 문구만 번역하므로 누가 호출해도 추가 비용이나 위험이 없습니다)
export function isCron(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get('authorization') === `Bearer ${secret}`;
  return /vercel-cron/i.test(request.headers.get('user-agent') || '');
}
