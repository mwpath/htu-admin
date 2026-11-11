'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { LOGIN_DOMAIN } from '@/lib/login-id';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // 관리자가 아직 없으면(또는 DB 설치 전이면) 처음 설정으로
  useEffect(() => {
    fetch('/api/setup/status', { cache: 'no-store' }).then((r) => r.json()).then((s) => {
      if (!s.supabase || s.installed === false || s.hasAdmin === false || (s.installed && s.version < s.required && !s.hasAdmin)) {
        window.location.replace('/admin/setup');
      }
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const sb = supabaseBrowser();
    // 아이디 → 내부 로그인 주소 (예전 계정은 이메일로도 로그인 가능)
    const id = loginId.trim();
    let email = id.includes('@') ? id.toLowerCase() : null;
    if (!email) {
      const { data } = await sb.rpc('login_email', { p_login: id });
      email = data || `${id.toLowerCase()}@${LOGIN_DOMAIN}`;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr('아이디 또는 비밀번호를 확인해 주세요.');
    const next = new URLSearchParams(window.location.search).get('next') || '/admin';
    window.location.href = next.startsWith('/admin') ? next : '/admin';
  };

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="adm-login-mark">HTU</div>
        <h1>홈페이지 관리자</h1>
        <p>아이디와 비밀번호로 로그인하세요.</p>
        <label className="adm-label">아이디</label>
        <input className="adm-input" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
        <label className="adm-label">비밀번호</label>
        <input className="adm-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err ? <div className="adm-login-err">{err}</div> : null}
        <button className="adm-btn primary lg" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
        <p className="adm-login-help">계정이 없거나 비밀번호를 잊었다면 대표 관리자에게 요청하세요.<br />대표 관리자는 <b>계정 · 권한</b> 메뉴에서 직원 계정을 만들고 비밀번호를 재설정할 수 있습니다.</p>
      </form>
    </div>
  );
}
