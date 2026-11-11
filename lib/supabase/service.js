import { createClient } from '@supabase/supabase-js';

// 서버 전용 (번역 저장 · 예약 작업). SUPABASE_SERVICE_ROLE_KEY 는 절대 NEXT_PUBLIC_ 으로 노출하지 마세요.
export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
