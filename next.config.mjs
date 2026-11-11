/** @type {import('next').NextConfig} */

// Vercel ↔ Supabase 연동이 넣어준 값을 이름과 상관없이 찾아 브라우저용으로 연결 (직접 입력 불필요)
const pick = (...names) => {
  for (const n of names) if (process.env[n] && String(process.env[n]).trim()) return String(process.env[n]).trim();
  return '';
};
const SUPABASE_URL = pick('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SUPABASE_URL');
const SUPABASE_ANON = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON,
  },
  // Vercel 주소로 접속하면 바로 관리자 페이지로
  async redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }];
  },
};
export default nextConfig;
