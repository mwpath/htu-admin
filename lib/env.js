// Vercel ↔ Supabase 연동(Integrations)이 자동으로 넣어주는 값을 읽습니다 — 직접 입력할 필요 없음.
// 연동 버전에 따라 이름이 다르므로 알려진 이름을 모두 확인합니다.
const pick = (...names) => {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
};

export const SUPABASE_URL_NAMES = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SUPABASE_URL'];
export const ANON_KEY_NAMES = ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
export const SERVICE_KEY_NAMES = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SUPABASE_SECRET_KEY'];
export const DB_URL_NAMES = ['POSTGRES_URL_NON_POOLING', 'SUPABASE_POSTGRES_URL_NON_POOLING', 'POSTGRES_URL', 'SUPABASE_POSTGRES_URL',
  'SUPABASE_DB_URL', 'DATABASE_URL'];

export const env = {
  // 브라우저에서도 쓰는 값은 next.config.mjs 가 빌드 때 NEXT_PUBLIC_* 로 넣어둡니다
  supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL || pick(...SUPABASE_URL_NAMES),
  anonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || pick(...ANON_KEY_NAMES),
  serviceKey: () => pick(...SERVICE_KEY_NAMES),
  dbUrl: () => pick(...DB_URL_NAMES),
};

export { pick };
