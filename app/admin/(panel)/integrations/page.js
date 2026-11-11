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

function GithubStorage({ saved, onSaved }) {
  const v = (k) => saved[k]?.hint || '';
  const [f, setF] = useState({ repo: v('github_repo'), branch: v('github_branch'), folder: v('github_folder') || 'uploads', mode: v('media_url_mode') || 'site', token: '' });
  const [busy, setBusy] = useState('');
  const [test, setTest] = useState(null);
  const [mig, setMig] = useState(null);
  const [migLog, setMigLog] = useState(null);
  const enabled = !!(saved.github_token && saved.github_repo);

  const loadMig = useCallback(async () => {
    const r = await fetch('/api/media/migrate', { cache: 'no-store' });
    setMig(r.ok ? await r.json() : null);
  }, []);
  useEffect(() => { if (enabled) loadMig(); }, [enabled, loadMig]);

  const set = async (key, value) => {
    const { error } = await supabaseBrowser().rpc('set_app_secret', { p_key: key, p_value: value });
    if (error) throw error;
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy('save'); setTest(null);
    try {
      await set('github_repo', f.repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, ''));
      await set('github_branch', f.branch.trim());
      await set('github_folder', f.folder.trim() || 'uploads');
      await set('media_url_mode', f.mode);
      if (f.token.trim()) await set('github_token', f.token.trim());
      setF((x) => ({ ...x, token: '' }));
      const r = await fetch('/api/media/test', { method: 'POST' });
      setTest(await r.json());
      toast('저장했습니다.');
      onSaved();
    } catch (er) { toast(errMsg(er), 'err'); }
    setBusy('');
  };
  const runTest = async () => {
    setBusy('test'); setTest(null);
    const r = await fetch('/api/media/test', { method: 'POST' });
    setTest(await r.json());
    setBusy('');
  };
  const migrate = async () => {
    if (!confirm('Supabase 에 있는 기존 이미지 · 파일을 GitHub 로 옮기고, 모든 글의 주소를 새 주소로 바꾼 뒤 Supabase 에서 삭제합니다. 진행할까요?')) return;
    setBusy('mig'); setMigLog({ moved: 0, remaining: mig?.remaining || 0, errors: [] });
    let moved = 0;
    for (let i = 0; i < 60; i++) {
      const r = await fetch('/api/media/migrate', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMigLog((x) => ({ ...x, errors: [d.error || `오류 ${r.status}`] })); break; }
      moved += d.moved || 0;
      setMigLog({ moved, remaining: d.remaining, errors: d.errors || [] });
      if (!d.remaining || (d.errors?.length && !d.moved)) break;
    }
    setBusy('');
    loadMig();
  };

  return (
    <form className="adm-card" onSubmit={save}>
      <div className="adm-card-head">
        <h3>파일 저장소 — GitHub {enabled ? <span className="adm-badge green">사용 중</span> : <span className="adm-badge warn">설정 전 (지금은 Supabase 에 저장)</span>}</h3>
        <p>관리자에서 올리는 모든 이미지 · 영상 · 첨부파일을 홈페이지 GitHub 저장소에 저장합니다. 사이트와 같은 곳에 있으므로 기존 <code>./img</code> 이미지처럼 <code>./uploads/…</code> 주소로 바로 쓰입니다.</p>
      </div>

      <details className="adm-howto" open={!enabled}>
        <summary>GitHub 토큰 만드는 방법 (사이트 저장소가 있는 GitHub 계정에서)</summary>
        <ol>
          <li>GitHub 로그인 → 오른쪽 위 프로필 → <b>Settings</b> → 맨 아래 <b>Developer settings</b></li>
          <li><b>Personal access tokens → Fine-grained tokens → Generate new token</b></li>
          <li>Token name: <code>htu-cms</code> · Expiration: 가능한 길게 (만료 전에 새 토큰으로 바꿔 저장)</li>
          <li><b>Repository access → Only select repositories</b> → 홈페이지 저장소 하나만 선택</li>
          <li><b>Permissions → Repository permissions → Contents → Read and write</b></li>
          <li><b>Generate token</b> → 표시된 토큰(<code>github_pat_…</code>)을 복사해 아래에 붙여넣기</li>
        </ol>
      </details>

      <div className="adm-grid-2" style={{ marginTop: 16 }}>
        <div>
          <label className="adm-label">저장소 (계정/저장소이름)</label>
          <input className="adm-input" placeholder="예) mwpath/htuglobal" value={f.repo} onChange={(e) => setF({ ...f, repo: e.target.value })} autoCapitalize="none" spellCheck={false} />
          <small className="adm-help">GitHub 주소 <code>github.com/계정/저장소</code> 의 뒷부분. 주소를 통째로 붙여넣어도 됩니다.</small>
        </div>
        <div>
          <label className="adm-label">GitHub 토큰 {saved.github_token ? <span className="adm-badge green">저장됨 {saved.github_token.hint}</span> : null}</label>
          <input className="adm-input" type="password" autoComplete="off" placeholder={saved.github_token ? '바꿀 때만 입력' : 'github_pat_…'} value={f.token} onChange={(e) => setF({ ...f, token: e.target.value })} />
          <small className="adm-help">Supabase 에 보관되며 직원 · 방문자는 볼 수 없습니다.</small>
        </div>
        <div>
          <label className="adm-label">브랜치 (선택)</label>
          <input className="adm-input" placeholder="비워두면 기본 브랜치 (보통 main)" value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} autoCapitalize="none" spellCheck={false} />
        </div>
        <div>
          <label className="adm-label">저장 폴더</label>
          <input className="adm-input" value={f.folder} onChange={(e) => setF({ ...f, folder: e.target.value })} autoCapitalize="none" spellCheck={false} />
          <small className="adm-help">저장소 안 폴더. 예) uploads/news/2026/11/…</small>
        </div>
      </div>
      <label className="adm-label" style={{ marginTop: 16 }}>파일 주소 방식</label>
      <div className="adm-role-pick adm-role-pick-2">
        <label className={`adm-role-opt ${f.mode === 'site' ? 'is-on' : ''}`}>
          <input type="radio" checked={f.mode === 'site'} onChange={() => setF({ ...f, mode: 'site' })} />
          <b>홈페이지 저장소 (권장)</b><span>사이트(GitHub Pages)와 같은 저장소. <code>./uploads/…</code> 로 저장되어 htuglobal.com 에서 바로 열립니다. 사이트 반영까지 약 1분.</span>
        </label>
        <label className={`adm-role-opt ${f.mode === 'cdn' ? 'is-on' : ''}`}>
          <input type="radio" checked={f.mode === 'cdn'} onChange={() => setF({ ...f, mode: 'cdn' })} />
          <b>별도 공개 저장소</b><span>파일 전용 저장소를 따로 쓸 때. jsDelivr CDN 주소로 저장됩니다 (파일당 20MB 이하).</span>
        </label>
      </div>

      <div className="adm-row-gap" style={{ marginTop: 18 }}>
        <button className="adm-btn primary" disabled={!!busy}>{busy === 'save' ? '저장 · 확인 중…' : '저장하고 연결 확인'}</button>
        {enabled ? <button type="button" className="adm-btn" onClick={runTest} disabled={!!busy}>{busy === 'test' ? '확인 중…' : '연결 테스트'}</button> : null}
      </div>
      {test ? (
        <div className={test.ok ? 'adm-setup-ok' : 'adm-login-err'} style={{ marginTop: 12 }}>
          {test.ok ? (
            <>연결 성공 — <b>{test.repo}</b> ({test.branch} 브랜치{test.private ? ', 비공개' : ''}) · 저장소 용량 약 {test.sizeMB}MB
              {test.pages ? <> · 사이트 {test.pages.cname || test.pages.url}</> : null}. 이제 올리는 파일은 이 저장소에 저장됩니다.</>
          ) : <>연결 실패: {test.error}</>}
        </div>
      ) : null}

      {enabled ? (
        <div className="adm-migrate">
          <div>
            <b>기존 Supabase 파일 → GitHub 로 옮기기</b>
            <p className="adm-muted">
              {mig ? (mig.remaining ? `콘텐츠에서 쓰는 Supabase 파일 ${mig.remaining}개가 남아 있습니다.` : '콘텐츠에서 쓰는 Supabase 파일이 없습니다. 모두 GitHub 에 있습니다.') : '확인 중…'}
              {mig?.storageFiles ? ` (Supabase 저장소 전체 파일 ${mig.storageFiles}개)` : ''}
            </p>
          </div>
          <button type="button" className="adm-btn" onClick={migrate} disabled={!!busy || !mig?.remaining}>{busy === 'mig' ? '옮기는 중…' : '지금 옮기기'}</button>
          {migLog ? (
            <div className="adm-migrate-log">
              옮김 {migLog.moved}개 · 남음 {migLog.remaining}개
              {migLog.errors?.length ? <ul>{migLog.errors.slice(0, 6).map((x) => <li key={x}>{x}</li>)}</ul> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}

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

      <GithubStorage saved={saved} onSaved={load} />

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
