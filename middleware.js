import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// /admin 보호 + Supabase 세션 쿠키 갱신
// /admin/setup(처음 설정)은 로그인 없이 열립니다 — 관리자가 이미 있으면 그 화면이 스스로 로그인으로 보냅니다.
export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isSetup = path.startsWith('/admin/setup');
  const isLogin = path.startsWith('/admin/login');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase 연동 전 → 처음 설정 화면에서 연결 방법 안내
  if (!url || !key) {
    if (isSetup) return NextResponse.next();
    const u = request.nextUrl.clone();
    u.pathname = '/admin/setup';
    u.search = '';
    return NextResponse.redirect(u);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (isSetup) return response;

  if (!user && !isLogin) {
    const u = request.nextUrl.clone();
    u.pathname = '/admin/login';
    u.searchParams.set('next', path);
    return NextResponse.redirect(u);
  }
  if (user && isLogin) {
    const u = request.nextUrl.clone();
    u.pathname = '/admin';
    u.search = '';
    return NextResponse.redirect(u);
  }
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
