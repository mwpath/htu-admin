/** @type {import('next').NextConfig} */

// Vercel ↔ Supabase 연동이 넣어준 값을 이름과 상관없이 찾아 브라우저용으로 연결 (직접 입력 불필요)
const pick = (...names) => {
  for (const n of names) if (process.env[n] && String(process.env[n]).trim()) return String(process.env[n]).trim();
  return '';
};
const SUPABASE_URL = pick('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SUPABASE_URL');
const SUPABASE_ANON = pick('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

// 보안 헤더 — 관리자 화면 (클릭재킹 · MIME 스니핑 · 외부 스크립트 주입 차단)
let SB_ORIGIN = '';
try { SB_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : ''; } catch { /* noop */ }
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https:",
  `connect-src 'self' ${SB_ORIGIN} ${SB_ORIGIN.replace('https://', 'wss://')} https://*.supabase.co wss://*.supabase.co https://api.github.com`.replace(/\s+/g, ' '),
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].concat(SB_ORIGIN.startsWith('https://') || !SB_ORIGIN ? ['upgrade-insecure-requests'] : []).join('; ');
const SECURITY = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: '/admin/:path*', headers: [...SECURITY, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Content-Security-Policy', value: CSP }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin', headers: [...SECURITY, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Content-Security-Policy', value: CSP }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Robots-Tag', value: 'noindex' }] },
    ];
  },
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
