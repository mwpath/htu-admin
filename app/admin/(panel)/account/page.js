'use client';
import { useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import { useMe } from '@/components/admin/AdminContext';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { toast, errMsg } from '@/lib/admin-utils';
import { ROLE_LABEL, SECTION_LABEL } from '@/lib/perms';

export default function MyAccountPage() {
  const me = useMe();
  const [name, setName] = useState(me?.name || '');
  const [pw, setPw] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    setBusy('name');
    const { error } = await supabaseBrowser().rpc('update_my_profile', { p_name: name });
    setBusy('');
    if (error) return toast(errMsg(error), 'err');
    toast('이름을 저장했습니다.');
  };
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.a.length < 8) return toast('비밀번호는 8자 이상이어야 합니다.', 'err');
    if (pw.a !== pw.b) return toast('비밀번호가 서로 다릅니다.', 'err');
    setBusy('pw');
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw.a });
    setBusy('');
    if (error) return toast(errMsg(error), 'err');
    setPw({ a: '', b: '' });
    toast('비밀번호를 바꿨습니다.');
  };

  return (
    <>
      <PageHead title="내 계정" desc={`${me?.email} · ${ROLE_LABEL[me?.role] || ''}`} />
      <div className="adm-grid-2">
        <form className="adm-card" onSubmit={saveName}>
          <div className="adm-card-head"><h3>이름</h3></div>
          <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="관리자 화면에 표시될 이름" />
          <div className="adm-row-gap" style={{ marginTop: 12 }}><button className="adm-btn primary" disabled={!!busy}>저장</button></div>
          <div className="adm-card-head" style={{ marginTop: 24 }}><h3>내 권한</h3></div>
          <p className="adm-muted" style={{ margin: 0 }}>
            {me?.role === 'editor'
              ? (me.permissions?.length ? me.permissions.map((p) => SECTION_LABEL[p] || p).join(' · ') : '편집 권한이 없습니다. 대표 관리자에게 요청하세요.')
              : '모든 메뉴를 편집할 수 있습니다.'}
          </p>
        </form>
        <form className="adm-card" onSubmit={savePw}>
          <div className="adm-card-head"><h3>비밀번호 변경</h3><p>처음 받은 비밀번호는 꼭 바꿔주세요.</p></div>
          <label className="adm-label">새 비밀번호 (8자 이상)</label>
          <input className="adm-input" type="password" autoComplete="new-password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} />
          <label className="adm-label">새 비밀번호 확인</label>
          <input className="adm-input" type="password" autoComplete="new-password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} />
          <div className="adm-row-gap" style={{ marginTop: 12 }}><button className="adm-btn primary" disabled={!!busy}>{busy === 'pw' ? '변경 중…' : '비밀번호 변경'}</button></div>
        </form>
      </div>
    </>
  );
}
