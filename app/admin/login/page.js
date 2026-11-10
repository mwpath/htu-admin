'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr('이메일 또는 비밀번호를 확인해 주세요.');
    const next = new URLSearchParams(window.location.search).get('next') || '/admin';
    window.location.href = next.startsWith('/admin') ? next : '/admin';
  };

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="adm-login-mark">HTU</div>
        <h1>홈페이지 관리자</h1>
        <p>등록된 관리자 계정으로 로그인하세요.</p>
        <label className="adm-label">이메일</label>
        <input className="adm-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="adm-label">비밀번호</label>
        <input className="adm-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err ? <div className="adm-login-err">{err}</div> : null}
        <button className="adm-btn primary lg" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
      </form>
    </div>
  );
}
