import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 로그인 세션이 필요한 서버 컴포넌트 / Route Handler 용
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 set 불가 — middleware 가 세션을 갱신합니다.
        }
      },
    },
  });
}
