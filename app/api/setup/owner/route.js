// 첫 대표 관리자 만들기 — 관리자가 아무도 없을 때만 동작합니다.
import { getSetupState } from '@/lib/setup/state';
import { supabaseService } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const state = await getSetupState();
  if (!state.installed) return Response.json({ error: 'DB 설치를 먼저 진행하세요.' }, { status: 400 });
  if (state.version < state.required) return Response.json({ error: 'DB 업데이트를 먼저 진행하세요.' }, { status: 400 });
  if (state.hasAdmin) return Response.json({ error: '이미 대표 관리자가 있습니다. 로그인하세요.' }, { status: 409 });

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim().slice(0, 60);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: '이메일 형식을 확인하세요.' }, { status: 400 });
  if (password.length < 8) return Response.json({ error: '비밀번호는 8자 이상으로 정해주세요.' }, { status: 400 });

  const svc = supabaseService();
  // 서버 키가 없으면 브라우저에서 가입 후 자동 등록 (메일 인증이 필요할 수 있음)
  if (!svc) return Response.json({ mode: 'client' });

  let userId = null;
  const created = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (created.error) {
    // 이미 가입된 이메일이면 그 계정을 대표로 지정하고 비밀번호를 새로 설정
    const found = await findUserByEmail(svc, email);
    if (!found) return Response.json({ error: created.error.message }, { status: 400 });
    const upd = await svc.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    if (upd.error) return Response.json({ error: upd.error.message }, { status: 400 });
    userId = found.id;
  } else userId = created.data.user.id;

  const { data: ok, error } = await svc.rpc('bootstrap_owner', { p_user: userId, p_email: email, p_name: name });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!ok) return Response.json({ error: '이미 대표 관리자가 있습니다. 로그인하세요.' }, { status: 409 });
  return Response.json({ ok: true, mode: 'service' });
}

async function findUserByEmail(svc, email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const u = data.users.find((x) => (x.email || '').toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}
