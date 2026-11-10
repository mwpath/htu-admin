'use client';
import { toast } from '@/lib/admin-utils';

export default function RefreshButton() {
  const run = async () => {
    const r = await fetch('/api/revalidate', { method: 'POST' });
    toast(r.ok ? '홈페이지 캐시를 갱신했습니다.' : '갱신 실패', r.ok ? 'ok' : 'err');
  };
  return (
    <button type="button" className="adm-btn" onClick={run}>
      ⟳ 즉시 반영
    </button>
  );
}
