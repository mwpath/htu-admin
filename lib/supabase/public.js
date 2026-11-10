import { createClient } from '@supabase/supabase-js';

export const CMS_TAG = 'cms';

// 공개 콘텐츠 조회용 (anon + RLS). Next 데이터 캐시에 'cms' 태그로 저장되며,
// 관리자 저장 시 /api/revalidate 가 태그를 무효화합니다.
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init = {}) => fetch(input, { ...init, next: { tags: [CMS_TAG], revalidate: 300 } }),
    },
  });
}
