import { createClient } from '@supabase/supabase-js';
import { env } from '../env';

// 서버 전용 (번역 저장 · 계정 생성 · 예약 작업). 서버 키는 Vercel–Supabase 연동이 자동으로 넣어줍니다.
// 절대 브라우저 코드에서 import 하지 마세요.
export function supabaseService() {
  const url = env.supabaseUrl();
  const key = env.serviceKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init = {}) => fetch(input, { ...init, cache: 'no-store' }) },
  });
}
