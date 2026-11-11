'use client';
import { useCallback, useEffect, useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import { toast } from '@/lib/admin-utils';
import { ROLES, ROLE_LABEL, SECTIONS, SECTION_LABEL } from '@/lib/perms';

const api = async (method, body) => {
  const r = await fetch('/api/admin/accounts', { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `오류 (${r.status})`);
  return d;
};
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '로그인 기록 없음');

export default function AccountsPage() {
  const [list, setList] = useState(null);
  const [meId, setMeId] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [edit, setEdit] = useState(null); // { mode:'new'|'edit', ...form }
  const [secret, setSecret] = useState(null); // { email, password }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api('GET');
      setList(d.accounts); setMeId(d.me); setLoadErr('');
    } catch (e) { setLoadErr(e.message); setList([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => setEdit({ mode: 'new', email: '', name: '', password: '', role: 'editor', permissions: ['notices', 'news'] });
  const openEdit = (a) => setEdit({ mode: 'edit', user_id: a.user_id, email: a.email, name: a.name || '', role: a.role, permissions: a.permissions || [] });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (edit.mode === 'new') {
        const d = await api('POST', edit);
        if (d.password) setSecret({ email: edit.email, password: d.password, generated: d.generated });
        toast(d.reused ? '이미 가입된 계정에 권한을 부여했습니다.' : '직원 계정을 만들었습니다.');
      } else {
        await api('PATCH', { user_id: edit.user_id, name: edit.name, role: edit.role, permissions: edit.permissions });
        toast('저장했습니다. 다음 화면 이동부터 바로 적용됩니다.');
      }
      setEdit(null);
      load();
    } catch (er) { toast(er.message, 'err'); }
    setBusy(false);
  };

  const resetPw = async (a) => {
    if (!confirm(`${a.name || a.email} 의 비밀번호를 새로 만들까요?\n기존 비밀번호로는 더 이상 로그인할 수 없습니다.`)) return;
    try {
      const d = await api('PATCH', { user_id: a.user_id, reset_password: true });
      setSecret({ email: a.email, password: d.password, generated: true });
    } catch (er) { toast(er.message, 'err'); }
  };
  const toggleActive = async (a) => {
    try { await api('PATCH', { user_id: a.user_id, active: !a.active }); toast(a.active ? '사용을 중지했습니다.' : '다시 사용할 수 있습니다.'); load(); }
    catch (er) { toast(er.message, 'err'); }
  };
  const remove = async (a) => {
    if (!confirm(`${a.name || a.email} 계정을 삭제할까요?\n로그인 계정까지 완전히 삭제되며 되돌릴 수 없습니다.`)) return;
    try { await api('DELETE', { user_id: a.user_id }); toast('삭제했습니다.'); load(); }
    catch (er) { toast(er.message, 'err'); }
  };

  return (
    <>
      <PageHead title="직원 계정 · 권한" desc="직원별로 로그인 계정을 만들고, 편집할 수 있는 메뉴를 정합니다. 권한은 데이터베이스에서 강제되어 화면을 우회해도 다른 메뉴는 수정할 수 없습니다.">
        <button className="adm-btn primary" onClick={openNew}>+ 직원 추가</button>
      </PageHead>

      {loadErr ? <div className="adm-card adm-alert err">{loadErr}</div> : null}

      {secret ? (
        <div className="adm-card adm-secret">
          <div>
            <h3>로그인 정보 — 지금 한 번만 표시됩니다</h3>
            <p>아이디 <b>{secret.email}</b> · 비밀번호 <code>{secret.password}</code></p>
            <p className="adm-muted">직원에게 전달하고, 처음 로그인한 뒤 <b>내 계정</b>에서 비밀번호를 바꾸도록 안내하세요.</p>
          </div>
          <div className="adm-row-gap">
            <button className="adm-btn sm" onClick={() => { navigator.clipboard?.writeText(`관리자 주소: ${location.origin}/admin\n아이디: ${secret.email}\n비밀번호: ${secret.password}`); toast('복사했습니다.'); }}>안내문 복사</button>
            <button className="adm-btn sm ghost" onClick={() => setSecret(null)}>닫기</button>
          </div>
        </div>
      ) : null}

      {edit ? (
        <form className="adm-card adm-acct-form" onSubmit={save}>
          <div className="adm-card-head"><h3>{edit.mode === 'new' ? '새 직원 계정' : `${edit.name || edit.email} 권한 수정`}</h3></div>
          <div className="adm-grid-2">
            <div>
              <label className="adm-label">이메일 (로그인 아이디)</label>
              <input className="adm-input" type="email" required disabled={edit.mode === 'edit'} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </div>
            <div>
              <label className="adm-label">이름</label>
              <input className="adm-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="예) 김담당 (마케팅팀)" />
            </div>
          </div>
          {edit.mode === 'new' ? (
            <>
              <label className="adm-label">처음 비밀번호 (비워두면 자동 생성)</label>
              <input className="adm-input" type="text" minLength={8} value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} placeholder="8자 이상" autoComplete="off" />
            </>
          ) : null}

          <label className="adm-label">역할</label>
          <div className="adm-role-pick">
            {ROLES.map((r) => (
              <label key={r.value} className={`adm-role-opt ${edit.role === r.value ? 'is-on' : ''}`}>
                <input type="radio" name="role" checked={edit.role === r.value} onChange={() => setEdit({ ...edit, role: r.value })} />
                <b>{r.label}</b><span>{r.desc}</span>
              </label>
            ))}
          </div>

          {edit.role === 'editor' ? (
            <>
              <label className="adm-label">편집할 수 있는 메뉴</label>
              <div className="adm-perm-grid">
                {[...new Set(SECTIONS.map((s) => s.group))].map((grp) => (
                  <div key={grp} className="adm-perm-group">
                    <div className="adm-perm-title">{grp}</div>
                    {SECTIONS.filter((s) => s.group === grp).map((s) => (
                      <label key={s.key} className="adm-perm">
                        <input type="checkbox" checked={edit.permissions.includes(s.key)}
                          onChange={(e) => setEdit({ ...edit, permissions: e.target.checked ? [...edit.permissions, s.key] : edit.permissions.filter((x) => x !== s.key) })} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <div className="adm-row-gap" style={{ marginTop: 8 }}>
                <button type="button" className="adm-btn sm ghost" onClick={() => setEdit({ ...edit, permissions: SECTIONS.map((s) => s.key) })}>전체 선택</button>
                <button type="button" className="adm-btn sm ghost" onClick={() => setEdit({ ...edit, permissions: [] })}>전체 해제</button>
              </div>
            </>
          ) : null}

          <div className="adm-row-gap" style={{ marginTop: 18 }}>
            <button className="adm-btn primary" disabled={busy}>{busy ? '저장 중…' : edit.mode === 'new' ? '계정 만들기' : '저장'}</button>
            <button type="button" className="adm-btn ghost" onClick={() => setEdit(null)}>취소</button>
          </div>
        </form>
      ) : null}

      <div className="adm-card">
        {!list ? <p className="adm-muted">불러오는 중…</p> : (
          <table className="adm-table">
            <thead><tr><th>직원</th><th>역할</th><th>편집 가능 메뉴</th><th>최근 로그인</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.user_id} className={a.active ? '' : 'is-off'}>
                  <td><b>{a.name || '(이름 없음)'}</b>{a.user_id === meId ? <span className="adm-badge green" style={{ marginLeft: 6 }}>나</span> : null}<br /><small className="adm-muted">{a.email}</small></td>
                  <td><span className={`adm-badge ${a.role === 'owner' ? 'green' : a.role === 'admin' ? 'blue' : ''}`}>{ROLE_LABEL[a.role]}</span>{a.active ? null : <span className="adm-badge warn" style={{ marginLeft: 6 }}>사용 중지</span>}</td>
                  <td className="adm-perm-cell">{a.role === 'editor' ? (a.permissions?.length ? a.permissions.map((p) => <span key={p} className="adm-chip">{SECTION_LABEL[p] || p}</span>) : <span className="adm-muted">없음</span>) : <span className="adm-muted">전체</span>}</td>
                  <td><small>{fmt(a.last_sign_in_at)}</small></td>
                  <td className="adm-actions">
                    <button className="adm-btn sm" onClick={() => openEdit(a)}>권한</button>
                    <button className="adm-btn sm ghost" onClick={() => resetPw(a)}>비밀번호 재설정</button>
                    {a.user_id !== meId ? (
                      <>
                        <button className="adm-btn sm ghost" onClick={() => toggleActive(a)}>{a.active ? '사용 중지' : '다시 사용'}</button>
                        <button className="adm-btn sm ghost danger" onClick={() => remove(a)}>삭제</button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
