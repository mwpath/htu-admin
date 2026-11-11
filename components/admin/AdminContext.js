'use client';
import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { canOpen } from '@/lib/perms';

const Ctx = createContext(null);
export function AdminProvider({ me, children }) {
  return <Ctx.Provider value={me}>{children}</Ctx.Provider>;
}
export function useMe() {
  return useContext(Ctx);
}

// 권한이 없는 메뉴 주소로 들어오면 안내 (실제 저장은 DB 가 한 번 더 막습니다)
export function PermissionGate({ children }) {
  const me = useMe();
  const path = usePathname();
  if (canOpen(me, path)) return children;
  return (
    <div className="adm-card adm-denied">
      <h2>이 메뉴에 대한 권한이 없습니다</h2>
      <p>필요하면 대표 관리자에게 권한을 요청하세요.</p>
      <a className="adm-btn" href="/admin">대시보드로</a>
    </div>
  );
}
