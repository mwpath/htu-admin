// 설치 상태 확인 (처음 설정 · 연동 설정 화면 공용)
import { createClient } from '@supabase/supabase-js';
import { env } from '../env';
import { supabaseService } from '../supabase/service';
import { SCHEMA_VERSION } from '@/generated/install-sql';

const missing = (error) => !!error && /PGRST20[25]|42P01|42883|does not exist|Could not find/i.test(`${error.code} ${error.message}`);

export async function getSetupState() {
  const url = env.supabaseUrl();
  const anon = env.anonKey();
  const state = {
    supabase: !!(url && anon),
    service: !!env.serviceKey(),
    db: !!env.dbUrl(),
    installed: null,
    version: 0,
    required: SCHEMA_VERSION,
    hasAdmin: null,
    error: null,
  };
  if (!state.supabase) return state;
  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (i, init = {}) => fetch(i, { ...init, cache: 'no-store' }) },
  });
  try {
    const t = await sb.from('site_settings').select('key').limit(1);
    if (t.error && missing(t.error)) state.installed = false;
    else if (t.error) state.error = t.error.message;
    else state.installed = true;
    if (state.installed) {
      const v = await sb.rpc('htu_schema_version');
      state.version = v.error ? 6 : Number(v.data) || 0; // 함수가 없으면 계정 기능 이전 버전
      const a = await sb.rpc('has_any_admin');
      if (!a.error) state.hasAdmin = !!a.data;
      else {
        const svc = supabaseService();
        if (svc) {
          const { count } = await svc.from('admin_users').select('user_id', { count: 'exact', head: true });
          state.hasAdmin = (count || 0) > 0;
        }
      }
    }
  } catch (e) {
    state.error = String(e.message || e);
  }
  return state;
}
