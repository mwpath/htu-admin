'use client';
import { useCallback, useEffect, useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { toast, errMsg } from '@/lib/admin-utils';

const PROVIDERS = [
  { value: 'anthropic', label: 'Claude (Anthropic)', key: 'anthropic_api_key', help: 'console.anthropic.com → API Keys. 20개 언어 모두 지원, 문맥을 살린 자연스러운 번역 (권장)' },
  { value: 'deepl', label: 'DeepL', key: 'deepl_api_key', help: 'deepl.com → 계정 → API 키. 베트남어 · 태국어 등 일부 언어는 Google 또는 Claude 키가 함께 있어야 합니다' },
  { value: 'google', label: 'Google 번역', key: 'google_api_key', help: 'Google Cloud Console → Cloud Translation API 사용 설정 → API 키' },
];

export default function IntegrationsPage() {
  const [d, setD] = useState(null);
  const [form, setForm] = useState({ provider: '', model: '', anthropic_api_key: '', deepl_api_key: '', google_api_key: '' });
  const [busy, setBusy] = useState('');
  const [test, setTest] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/integrations', { cache: 'no-store' });
    const j = await r.json();
    setD(j);
    const v = Object.fromEntries((j.secrets || []).map((s) => [s.key, s.hint]));
    const cur = v.translate_provider || j.translate?.provider;
    setForm((f) => ({ ...f, provider: PROVIDERS.some((p) => p.value === cur) ? cur : 'anthropic', model: v.translate_model || '' }));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!d) return <PageHead title="연동 설정" desc="불러오는 중…" />;
  if (d.error) return <div className="adm-card adm-alert err">{d.error}</div>;
  const st = d.state;
  const saved = Object.fromEntries((d.secrets || []).map((s) => [s.key, s]));

  const set = async (key, value) => {
    const { error } = await supabaseBrowser().rpc('set_app_secret', { p_key: key, p_value: value });
    if (error) throw error;
  };
  const saveTranslate = async (e) => {
    e.preventDefault();
    setBusy('save');
    try {
      await set('translate_provider', form.provider);
      await set('translate_model', form.provider === 'anthropic' ? form.model : '');
      for (const p of PROVIDERS) if (form[p.key]) await set(p.key, form[p.key]);
      setForm((f) => ({ ...f, anthropic_api_key: '', deepl_api_key: '', google_api_key: '' }));
      toast('저장했습니다. 연결 테스트로 확인해 보세요.');
      await load();
    } catch (er) { toast(errMsg(er), 'err'); }
    setBusy('');
  };
  const removeKey = async (key) => {
    if (!confirm('저장된 키를 삭제할까요?')) return;
    try { await set(key, ''); toast('삭제했습니다.'); load(); } catch (er) { toast(errMsg(er), 'err'); }
  };
  const runTest = async () => {
    setBusy('test'); setTest(null);
    const r = await fetch('/api/admin/integrations', { method: 'POST' });
    setTest(await r.json());
    setBusy('');
  };
  const upgrade = async () => {
    if (!confirm('DB 를 최신 버전으로 업데이트할까요? 기존 내용은 그대로 유지됩니다.')) return;
    setBusy('db');
    const r = await fetch('/api/setup/install', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    setBusy('');
    if (!r.ok) return toast(`업데이트 실패: ${j.error || r.status}`, 'err');
    toast('DB 를 업데이트했습니다.');
    load();
  };

  const Row = ({ ok, warn, title, children }) => (
    <tr><td style={{ width: 28 }}>{ok ? '✅' : warn ? '⚠️' : '❌'}</td><td style={{ width: 210 }}><b>{title}</b></td><td>{children}</td></tr>
  );

  return (
    <>
      <PageHead title="연동 설정" desc="Vercel 환경변수를 직접 입력할 필요가 없습니다. Supabase 연결은 Vercel 연동이 자동으로 처리하고, 나머지 키는 여기서 저장해 Supabase 에 안전하게 보관합니다." />

      <div className="adm-card">
        <div className="adm-card-head"><h3>연결 상태</h3></div>
        <table className="adm-table adm-status">
          <tbody>
            <Row ok={st.supabase} title="Supabase 연결">{st.supabase ? '연결됨 (Vercel ↔ Supabase 연동)' : 'Vercel → Storage(Integrations) → Supabase 연결 후 다시 배포하세요.'}</Row>
            <Row ok={st.service} title="서버 키">{st.service ? '자동 연결됨 — 직원 계정 만들기 · 자동 번역 사용 가능' : '없음 — Vercel 에서 Supabase 연동을 다시 연결(Reconnect)하면 자동으로 들어옵니다.'}</Row>
            <Row ok={st.version >= st.required} warn={st.installed} title="데이터베이스">
              {st.version >= st.required ? `최신 (버전 ${st.version})` : `업데이트 필요 (${st.version} → ${st.required})`}
              {st.version < st.required && st.db ? <button className="adm-btn sm primary" style={{ marginLeft: 10 }} onClick={upgrade} disabled={!!busy}>{busy === 'db' ? '업데이트 중…' : '자동 업데이트'}</button> : null}
              {st.version < st.required && !st.db ? <> — <a className="adm-link" href="/api/setup/sql">install.sql</a> 을 Supabase SQL Editor 에서 실행</> : null}
            </Row>
            <Row ok={st.db} warn title="DB 자동 업데이트">{st.db ? '사용 가능' : '연동에 DB 주소가 없어 수동 업데이트(install.sql)만 가능합니다.'}</Row>
            <Row ok={d.translate.configured} title="자동 번역">{d.translate.configured ? `${PROVIDERS.find((p) => p.value === d.translate.provider)?.label || d.translate.provider} 사용 중` : '아래에서 번역 엔진 키를 저장하세요.'}</Row>
            <Row ok title="매일 자동 점검">매일 새벽 3시에 빠진 번역을 채웁니다 (설정 불필요)</Row>
          </tbody>
        </table>
      </div>

      <form className="adm-card" onSubmit={saveTranslate}>
        <div className="adm-card-head"><h3>번역 엔진</h3><p>키는 Supabase 에 보관되며 직원 · 방문자는 볼 수 없습니다. 저장 후에는 끝 4자리만 표시됩니다.</p></div>
        <label className="adm-label">사용할 엔진</label>
        <div className="adm-role-pick">
          {PROVIDERS.map((p) => (
            <label key={p.value} className={`adm-role-opt ${form.provider === p.value ? 'is-on' : ''}`}>
              <input type="radio" name="provider" checked={form.provider === p.value} onChange={() => setForm({ ...form, provider: p.value })} />
              <b>{p.label}</b><span>{saved[p.key] ? `키 저장됨 ${saved[p.key].hint}` : '키 없음'}</span>
            </label>
          ))}
        </div>
        {PROVIDERS.map((p) => (
          <div key={p.key} style={{ marginTop: 14 }}>
            <label className="adm-label">{p.label} API 키 {saved[p.key] ? <span className="adm-badge green">저장됨 {saved[p.key].hint}</span> : null}</label>
            <div className="adm-row-gap">
              <input className="adm-input" style={{ flex: 1 }} type="password" autoComplete="off" placeholder={saved[p.key] ? '바꿀 때만 입력' : '키 붙여넣기'}
                value={form[p.key]} onChange={(e) => setForm({ ...form, [p.key]: e.target.value })} />
              {saved[p.key] ? <button type="button" className="adm-btn sm ghost danger" onClick={() => removeKey(p.key)}>삭제</button> : null}
            </div>
            <small className="adm-muted">{p.help}</small>
          </div>
        ))}
        {form.provider === 'anthropic' ? (
          <div style={{ marginTop: 14 }}>
            <label className="adm-label">Claude 모델 (선택)</label>
            <input className="adm-input" placeholder="비워두면 claude-sonnet-5-5" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
        ) : null}
        <div className="adm-row-gap" style={{ marginTop: 18 }}>
          <button className="adm-btn primary" disabled={!!busy}>{busy === 'save' ? '저장 중…' : '저장'}</button>
          <button type="button" className="adm-btn" onClick={runTest} disabled={!!busy}>{busy === 'test' ? '테스트 중…' : '연결 테스트'}</button>
        </div>
        {test ? (
          <div className={test.ok ? 'adm-setup-ok' : 'adm-login-err'} style={{ marginTop: 12 }}>
            {test.ok ? <>연결 성공 — “{test.result}”</> : <>연결 실패: {test.error}</>}
          </div>
        ) : null}
      </form>
    </>
  );
}
