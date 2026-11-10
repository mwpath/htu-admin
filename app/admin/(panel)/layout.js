import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import Sidebar from '@/components/admin/Sidebar';
import Toaster from '@/components/admin/Toaster';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: isAdmin } = await sb.rpc('is_admin');

  if (!isAdmin) {
    return (
      <div className="adm-login">
        <div className="adm-login-card">
          <div className="adm-login-mark">!</div>
          <h1>관리자 권한이 없습니다</h1>
          <p>
            <b>{user.email}</b> 계정이 admin_users 테이블에 등록되어 있지 않습니다.
            <br />README 의 &lsquo;관리자 계정 등록&rsquo; SQL 을 실행해 주세요.
          </p>
          <form action="/admin/logout" method="post">
            <button className="adm-btn lg">로그아웃</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-shell">
      <Sidebar email={user.email} />
      <main className="adm-main">{children}</main>
      <Toaster />
    </div>
  );
}
