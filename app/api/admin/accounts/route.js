// 직원 계정 관리 (대표 관리자 전용) — 계정 생성 · 권한 변경 · 비밀번호 재설정 · 삭제
import { requireOwner } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { SECTIONS } from '@/lib/perms';
import { isValidId, normId, idToEmail, ID_RULE } from '@/lib/login-id';

export const dynamic = 'force-dynamic';

const ROLE_SET = new Set(['owner', 'admin', 'editor']);
const SECTION_SET = new Set(SECTIONS.map((s) => s.key));
const cleanPerms = (p) => (Array.isArray(p) ? [...new Set(p.filter((x) => SECTION_SET.has(x)))] : []);
const err = (message, status = 400) => Response.json({ error: message }, { status });

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const a = new Uint32Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => chars[n % chars.length]).join('').replace(/^(.{4})(.{4})/, '$1-$2-');
}

async function guard() {
  const owner = await requireOwner();
  if (!owner) return { res: err('대표 관리자만 사용할 수 있습니다.', 403) };
  const svc = supabaseService();
  if (!svc) return { res: err('서버 키가 연결되지 않았습니다. Vercel → Storage(Integrations) → Supabase 연결 후 다시 배포하세요.', 503) };
  return { owner, svc };
}

async function allUsers(svc) {
  const out = [];
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    out.push(...data.users);
    if (data.users.length < 200) break;
  }
  return out;
}

export async function GET() {
  const g = await guard();
  if (g.res) return g.res;
  const { data, error } = await g.svc.from('admin_users').select('user_id, email, username, name, role, permissions, active, created_at').order('created_at');
  if (error) return err(error.message, 500);
  const users = await allUsers(g.svc);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return Response.json({
    me: g.owner.me.user_id,
    accounts: (data || []).map((a) => ({ ...a, last_sign_in_at: byId[a.user_id]?.last_sign_in_at || null, email: a.email || byId[a.user_id]?.email })),
  });
}

// 새 직원 계정
export async function POST(request) {
  const g = await guard();
  if (g.res) return g.res;
  const b = await request.json().catch(() => ({}));
  const username = normId(b.username);
  const name = String(b.name || '').trim().slice(0, 60);
  const role = ROLE_SET.has(b.role) ? b.role : 'editor';
  const permissions = role === 'editor' ? cleanPerms(b.permissions) : [];
  if (!isValidId(username)) return err(`아이디는 ${ID_RULE}로 정해주세요.`);
  const { data: taken } = await g.svc.from('admin_users').select('user_id').eq('username', username).maybeSingle();
  if (taken) return err('이미 사용 중인 아이디입니다.');
  const email = idToEmail(username);
  let password = String(b.password || '');
  if (password && password.length < 8) return err('비밀번호는 8자 이상이어야 합니다.');
  const generated = !password;
  if (generated) password = randomPassword();

  let userId;
  const created = await g.svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (created.error) {
    // 이미 가입된 이메일 → 그 계정에 권한만 부여 (비밀번호를 입력했으면 변경)
    const found = (await allUsers(g.svc)).find((u) => (u.email || '').toLowerCase() === email);
    if (!found) return err(created.error.message);
    userId = found.id;
    const { data: exists } = await g.svc.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    if (exists) return err('이미 등록된 직원입니다.');
    if (!generated) {
      const u = await g.svc.auth.admin.updateUserById(userId, { password });
      if (u.error) return err(u.error.message);
    }
  } else userId = created.data.user.id;

  const { error } = await g.svc.from('admin_users').insert({ user_id: userId, email, username, name: name || null, role, permissions, active: true, created_by: g.owner.user.id });
  if (error) return err(error.message, 500);
  const reused = !!created.error;
  return Response.json({ ok: true, user_id: userId, password: reused && generated ? null : password, generated, reused });
}

// 역할 · 권한 · 사용 여부 · 이름 · 비밀번호 변경
export async function PATCH(request) {
  const g = await guard();
  if (g.res) return g.res;
  const b = await request.json().catch(() => ({}));
  if (!b.user_id) return err('user_id 가 없습니다.');
  const patch = { updated_at: new Date().toISOString() };
  if (b.role !== undefined) {
    if (!ROLE_SET.has(b.role)) return err('알 수 없는 역할입니다.');
    patch.role = b.role;
  }
  if (b.permissions !== undefined) patch.permissions = cleanPerms(b.permissions);
  if (patch.role && patch.role !== 'editor') patch.permissions = [];
  if (b.active !== undefined) patch.active = !!b.active;
  if (b.name !== undefined) patch.name = String(b.name || '').trim().slice(0, 60) || null;

  // 아이디 변경 (예전 이메일 계정을 아이디로 바꿀 때도 사용)
  if (b.username !== undefined && b.username !== null && b.username !== '') {
    const username = normId(b.username);
    if (!isValidId(username)) return err(`아이디는 ${ID_RULE}로 정해주세요.`);
    const { data: cur } = await g.svc.from('admin_users').select('username').eq('user_id', b.user_id).maybeSingle();
    if (cur?.username !== username) {
      const { data: taken } = await g.svc.from('admin_users').select('user_id').eq('username', username).maybeSingle();
      if (taken && taken.user_id !== b.user_id) return err('이미 사용 중인 아이디입니다.');
      const email = idToEmail(username);
      const u = await g.svc.auth.admin.updateUserById(b.user_id, { email, email_confirm: true });
      if (u.error) return err(u.error.message);
      patch.username = username;
      patch.email = email;
    }
  }

  let password = null;
  if (b.reset_password) {
    password = b.password && String(b.password).length >= 8 ? String(b.password) : randomPassword();
    const u = await g.svc.auth.admin.updateUserById(b.user_id, { password });
    if (u.error) return err(u.error.message);
  }
  if (Object.keys(patch).length > 1) {
    const { error } = await g.svc.from('admin_users').update(patch).eq('user_id', b.user_id);
    if (error) return err(error.message, 400);
  }
  return Response.json({ ok: true, password });
}

// 계정 삭제 (로그인 계정까지 삭제)
export async function DELETE(request) {
  const g = await guard();
  if (g.res) return g.res;
  const b = await request.json().catch(() => ({}));
  if (!b.user_id) return err('user_id 가 없습니다.');
  if (b.user_id === g.owner.user.id) return err('본인 계정은 삭제할 수 없습니다.');
  // 먼저 직원 목록에서 제거 (마지막 대표 보호 규칙이 여기서 확인됨)
  const { error } = await g.svc.from('admin_users').delete().eq('user_id', b.user_id);
  if (error) return err(error.message);
  const d = await g.svc.auth.admin.deleteUser(b.user_id);
  if (d.error && !/not.*found/i.test(d.error.message)) return err(d.error.message, 500);
  return Response.json({ ok: true });
}
