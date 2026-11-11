import { redirect } from 'next/navigation';
import { getStaff } from '@/lib/admin-auth';
import Sidebar from '@/components/admin/Sidebar';
import Toaster from '@/components/admin/Toaster';
import { AdminProvider, PermissionGate } from '@/components/admin/AdminContext';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }) {
  let { sb, user, me } = await getStaff();
  if (!user) redirect('/admin/login');

  if (!me) {
    // 관리자가 아직 없다면(메일 인증 후 첫 로그인) 이 계정을 대표 관리자로 등록
    const { data: any } = await sb.rpc('has_any_admin');
    if (any === false) {
      await sb.rpc('claim_first_owner', { p_name: user.user_metadata?.name || null });
      ({ me } = await getStaff());
    }
  }

  if (!me) {
    return (
      <div className="adm-login">
        <div className="adm-login-card">
          <div className="adm-login-mark">!</div>
          <h1>관리자 권한이 없습니다</h1>
          <p>
            <b>{user.email}</b> 계정은 아직 관리자로 등록되지 않았거나 사용이 중지되었습니다.
            <br />대표 관리자에게 <b>계정 · 권한</b> 메뉴에서 등록을 요청하세요.
          </p>
          <form action="/admin/logout" method="post">
            <button className="adm-btn lg">로그아웃</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider me={me}>
      <div className="adm-shell">
        <Sidebar email={user.email} me={me} />
        <main className="adm-main">
          <PermissionGate>{children}</PermissionGate>
        </main>
        <Toaster />
      </div>
    </AdminProvider>
  );
}
