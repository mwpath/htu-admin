'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { ID_RULE, normId } from '@/lib/login-id';

// 처음 설정: ① Supabase 연결 확인 → ② DB 설치 → ③ 대표 관리자 만들기
export default function SetupPage() {
  const [st, setSt] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', password2: '' });

  const load = useCallback(async () => {
    const r = await fetch('/api/setup/status', { cache: 'no-store' });
    setSt(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!st) return <Shell><p className="adm-muted">확인 중…</p></Shell>;

  const dbReady = st.installed && st.version >= st.required;
  const done = dbReady && st.hasAdmin;

  const install = async () => {
    setBusy('install'); setMsg(null);
    const r = await fetch('/api/setup/install', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    setBusy('');
    if (!r.ok) return setMsg({ err: true, text: d.error === 'DB_URL_MISSING' ? 'DB 주소가 연결되어 있지 않습니다. 아래 수동 설치 방법을 이용하세요.' : `설치 실패: ${d.error || r.status}` });
    setMsg({ text: 'DB 설치가 끝났습니다.' });
    setSt(d.state);
  };

  const createOwner = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) return setMsg({ err: true, text: '비밀번호가 서로 다릅니다.' });
    setBusy('owner'); setMsg(null);
    const r = await fetch('/api/setup/owner', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    const sb = supabaseBrowser();
    if (!r.ok) { setBusy(''); return setMsg({ err: true, text: d.error || '계정을 만들지 못했습니다.' }); }
    if (d.mode === 'service') {
      const { error } = await sb.auth.signInWithPassword({ email: d.email, password: form.password });
      setBusy('');
      if (error) return setMsg({ err: true, text: '계정은 만들어졌습니다. 로그인 화면에서 로그인하세요.' });
      window.location.href = '/admin';
      return;
    }
    // 서버 키 없이: 직접 가입 → 첫 대표로 등록
    const { data, error } = await sb.auth.signUp({ email: d.email, password: form.password, options: { data: { name: form.name } } });
    if (error) { setBusy(''); return setMsg({ err: true, text: error.message }); }
    if (data.session) {
      await sb.rpc('claim_first_owner', { p_name: form.name, p_username: normId(form.username) });
      window.location.href = '/admin';
      return;
    }
    setBusy('');
    setMsg({ err: true, text: '서버 키가 없어 계정을 바로 만들 수 없습니다. 1단계의 Supabase 연동을 다시 연결(Reconnect)한 뒤 다시 배포하고 시도하세요.' });
  };

  return (
    <Shell>
      <Step n={1} title="Supabase 연결" ok={st.supabase}>
        {st.supabase ? (
          <p>연결되어 있습니다.{st.service ? '' : ' (서버 키가 없어 직원 계정 만들기 · 자동 번역은 제한됩니다)'}</p>
        ) : (
          <ol className="adm-setup-howto">
            <li>Vercel 에서 이 프로젝트를 열고 <b>Storage</b> 탭(또는 <b>Integrations</b>)으로 이동</li>
            <li><b>Supabase</b> → <b>Connect</b> → 사용할 Supabase 프로젝트 선택 (없으면 새로 만들기)</li>
            <li>연결이 끝나면 <b>Deployments → 최신 배포 → Redeploy</b></li>
            <li>이 화면을 새로고침 — 키를 직접 입력할 필요가 없습니다.</li>
          </ol>
        )}
      </Step>

      <Step n={2} title="데이터베이스 설치" ok={dbReady} off={!st.supabase}>
        {!st.supabase ? <p className="adm-muted">1단계 후 진행합니다.</p> : dbReady ? (
          <p>설치되어 있습니다. (버전 {st.version})</p>
        ) : (
          <>
            <p>{st.installed ? `업데이트가 필요합니다 (현재 ${st.version} → ${st.required}). 기존 내용은 그대로 유지됩니다.` : '홈페이지 내용을 담을 테이블을 만들고 현재 홈페이지 내용을 넣습니다.'}</p>
            {st.db ? (
              <button className="adm-btn primary" onClick={install} disabled={!!busy}>{busy === 'install' ? '설치 중… (최대 1분)' : st.installed ? 'DB 자동 업데이트' : 'DB 자동 설치'}</button>
            ) : null}
            <details className="adm-setup-manual" open={!st.db}>
              <summary>직접 설치하기 (Supabase SQL Editor)</summary>
              <ol className="adm-setup-howto">
                <li><a href="/api/setup/sql" className="adm-link">install.sql 내려받기</a></li>
                <li>Supabase → <b>SQL Editor</b> → <b>New query</b> → 파일 내용 전체 붙여넣기 → <b>Run</b></li>
                <li>이 화면에서 <b>다시 확인</b></li>
              </ol>
            </details>
          </>
        )}
      </Step>

      <Step n={3} title="대표 관리자 만들기" ok={!!st.hasAdmin} off={!dbReady}>
        {!dbReady ? <p className="adm-muted">2단계 후 진행합니다.</p> : st.hasAdmin ? (
          <p>대표 관리자가 등록되어 있습니다. <a className="adm-link" href="/admin/login">로그인 →</a></p>
        ) : (
          <form onSubmit={createOwner} className="adm-setup-form">
            <p>처음 만드는 계정이 <b>대표 관리자</b>가 되어 직원 계정과 권한을 관리합니다.</p>
            <label className="adm-label">이름</label>
            <input className="adm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
            <label className="adm-label">아이디</label>
            <input className="adm-input" type="text" required autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,29}" title={ID_RULE} placeholder="예) htuadmin"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, '') })} />
            <small className="adm-help">{ID_RULE}</small>
            <label className="adm-label">비밀번호 (8자 이상)</label>
            <input className="adm-input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <label className="adm-label">비밀번호 확인</label>
            <input className="adm-input" type="password" required minLength={8} autoComplete="new-password" value={form.password2} onChange={(e) => setForm({ ...form, password2: e.target.value })} />
            <button className="adm-btn primary lg" disabled={!!busy}>{busy === 'owner' ? '만드는 중…' : '대표 관리자 만들고 시작하기'}</button>
          </form>
        )}
      </Step>

      {msg ? <div className={msg.err ? 'adm-login-err' : 'adm-setup-ok'}>{msg.text}</div> : null}
      <div className="adm-setup-foot">
        {done ? <a className="adm-btn primary" href="/admin/login">로그인하기</a> : <button className="adm-btn" onClick={() => { setMsg(null); load(); }}>다시 확인</button>}
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="adm-login">
      <div className="adm-login-card adm-setup">
        <div className="adm-login-mark">HTU</div>
        <h1>관리자 처음 설정</h1>
        <p className="adm-muted">세 단계만 마치면 바로 사용할 수 있습니다.</p>
        {children}
      </div>
    </div>
  );
}

function Step({ n, title, ok, off, children }) {
  return (
    <section className={`adm-setup-step ${ok ? 'is-ok' : ''} ${off ? 'is-off' : ''}`}>
      <div className="adm-setup-num">{ok ? '✓' : n}</div>
      <div className="adm-setup-body">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
