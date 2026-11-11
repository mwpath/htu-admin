// DB 자동 설치 · 업데이트 — 관리자가 아직 없을 때(처음 설정) 또는 대표 관리자만 실행 가능
import { getSetupState } from '@/lib/setup/state';
import { runInstall } from '@/lib/setup/install';
import { requireOwner } from '@/lib/admin-auth';
import { clearSecretsCache } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const state = await getSetupState();
  if (!state.supabase) return Response.json({ error: 'Supabase 가 연결되지 않았습니다.' }, { status: 400 });
  // 처음 설정(DB 비어 있음 · 관리자 없음)일 때는 누구나, 그 뒤로는 대표 관리자만
  const firstRun = state.installed === false || state.hasAdmin === false;
  if (!firstRun && !(await requireOwner().catch(() => null))) {
    return Response.json({ error: '대표 관리자만 실행할 수 있습니다.' }, { status: 403 });
  }
  if (!state.db) return Response.json({ error: 'DB_URL_MISSING' }, { status: 400 });
  try {
    await runInstall();
  } catch (e) {
    return Response.json({ error: String(e.message || e).slice(0, 500) }, { status: 500 });
  }
  clearSecretsCache();
  return Response.json({ ok: true, state: await getSetupState() });
}
