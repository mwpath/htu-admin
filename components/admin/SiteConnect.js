'use client';
import { useEffect, useState } from 'react';
import { useSiteBase } from '@/lib/use-site-base';
import { useMe } from './AdminContext';

const FILES = [
  { name: 'htu-cms-config.js', path: 'js/htu-cms-config.js', desc: '연결 설정 (관리자 주소 자동 입력) — 꼭 필요' },
  { name: 'htu-i18n.js', path: 'js/htu-i18n.js', desc: '다국어 (언어 선택 · 페이지 문구 자동 번역) — 꼭 필요' },
  { name: 'menu3.js', path: 'menu3.js', desc: '헤더 메뉴 + 언어 선택 (관리자 연동판, 기존 파일 교체)' },
  { name: 'footer.js', path: 'js/footer.js', desc: '푸터 (관리자 연동판, 기존 파일 교체)' },
  { name: 'index.html', path: 'index.html', desc: '홈페이지 (기존 파일 교체)' },
  { name: 'news.html', path: 'news.html', desc: 'News & Event 목록 · 내부 작성 글' },
  { name: 'notice.html', path: 'notice.html', desc: '공지사항 목록 · 상세' },
  { name: 'event.html', path: 'event.html', desc: '이벤트 목록 · 상세' },
];


function SiteSync() {
  const me = useMe();
  const owner = me?.role === 'owner';
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState('');
  const [deploy, setDeploy] = useState(null);

  async function runCheck() {
    setBusy('check');
    try { setCheck(await (await fetch('/api/site/check', { cache: 'no-store' })).json()); }
    catch (e) { setCheck({ error: String(e.message || e) }); }
    setBusy('');
  }
  async function runDeploy() {
    if (!confirm('사이트 GitHub 저장소에 최신 연동 파일(메뉴 · 푸터 · 언어 · 소식 페이지)을 올립니다. 진행할까요?')) return;
    setBusy('deploy'); setDeploy(null);
    try {
      const d = await (await fetch('/api/site/deploy', { method: 'POST' })).json();
      setDeploy(d);
      if (d.ok) setTimeout(runCheck, 90000);
    } catch (e) { setDeploy({ error: String(e.message || e) }); }
    setBusy('');
  }
  // 대시보드가 먼저 뜨도록 점검은 잠시 뒤에
  useEffect(() => { const t = setTimeout(runCheck, 1200); return () => clearTimeout(t); }, []);

  const bad = check?.items?.filter((i) => i.ok !== true) || [];
  return (
    <div className="adm-sitesync">
      <div className="adm-sitesync-head">
        <div>
          <strong>실제 사이트 상태</strong>
          <small>{check?.site ? `${check.site} 가 지금 내보내는 파일을 서버에서 직접 확인합니다` : '사이트가 지금 내보내는 파일을 확인합니다'}</small>
        </div>
        <div className="adm-row-gap">
          <button type="button" className="adm-btn sm ghost" onClick={runCheck} disabled={!!busy}>{busy === 'check' ? '점검 중…' : '다시 점검'}</button>
          {owner && <button type="button" className="adm-btn sm primary" onClick={runDeploy} disabled={!!busy}>{busy === 'deploy' ? '올리는 중…' : '사이트 파일 자동 업데이트'}</button>}
        </div>
      </div>

      {deploy && (deploy.ok ? (
        <div className="adm-alert ok">
          GitHub 에 올렸습니다 (버전 {deploy.version}) — {deploy.results.map((r) => r.upToDate ? `${r.branch}: 이미 최신` : `${r.branch}${r.dir ? '/' + r.dir : ''}: ${r.changed}개 파일 · 커밋 ${r.commit}`).join(' / ')}.
          {deploy.seo?.pages != null ? <><br />검색엔진용 글 페이지 {deploy.seo.pages}개 · sitemap.xml · robots.txt 도 함께 올렸습니다.</> : deploy.seo?.error ? <><br />검색엔진 페이지: {deploy.seo.error}</> : null}
          <br />GitHub Pages 반영까지 1~2분 걸립니다. 90초 뒤 자동으로 다시 점검합니다. 사이트는 <b>Ctrl+Shift+R</b>(휴대폰은 새로고침 두 번)로 확인하세요.
        </div>
      ) : <div className="adm-alert err">{deploy.error}</div>)}

      {check?.error && <div className="adm-alert err">{check.error}</div>}
      {check?.items && (
        <>
          <p className={bad.length ? 'adm-sitesync-sum err' : 'adm-sitesync-sum ok'}>
            {bad.length ? `${bad.length}개 항목 확인 필요` : '모두 정상 — 메뉴 · 소식 · 언어 버튼이 사이트에 표시됩니다'}
          </p>
          <ul className="adm-checklist">
            {check.items.map((i) => (
              <li key={i.title} className={i.ok === true ? 'ok' : 'err'}>
                <span className="dot">{i.ok === true ? '✓' : '!'}</span>
                <div>
                  <b>{i.title}</b>
                  <small>{i.detail}</small>
                  {i.fix && <em>{i.fix}{!owner && /자동 업데이트/.test(i.fix) ? ' (대표 관리자 계정에서 가능)' : ''}</em>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function SiteConnect() {
  const site = useSiteBase();
  const [api, setApi] = useState({ state: 'checking' });

  useEffect(() => {
    fetch('/api/public/content')
      .then((r) => r.json())
      .then((d) => setApi(d.error ? { state: 'err', msg: d.error } : { state: 'ok', n: (d.heroSlides || []).length + (d.news || []).length }))
      .catch(() => setApi({ state: 'err', msg: 'API 응답 없음' }));
  }, []);

  // 서버 렌더와 화면이 같도록 주소는 브라우저에서만 채움 (hydration 불일치 방지)
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    fetch('/api/site/endpoint', { cache: 'no-store' }).then((r) => r.json()).then((d) => d.endpoint && setOrigin(d.endpoint)).catch(() => {});
  }, []);

  return (
    <section className="adm-card adm-connect">
      <div className="adm-card-head">
        <h3>기존 사이트 연결</h3>
        <p>연결 상태를 확인합니다. 연동 파일에는 이 관리자 주소가 자동으로 들어가 있습니다.</p>
      </div>

      <div className="adm-connect-status">
        <div>
          <span className="adm-muted">사이트가 쓰는 관리자 주소 (고정)</span>
          <code>{origin}</code>
        </div>
        <div>
          <span className="adm-muted">데이터 연결</span>
          {api.state === 'checking' ? <b>확인 중…</b> : api.state === 'ok' ? <b className="ok">● 정상</b> : <b className="err">● 오류 ({api.msg})</b>}
        </div>
        <div>
          <span className="adm-muted">기존 사이트</span>
          {site ? <a href={site} target="_blank" rel="noreferrer">{site} ↗</a> : <a href="/admin/settings">주소 설정하기 →</a>}
        </div>
      </div>

      <SiteSync />

      <details className="adm-connect-files">
        <summary>사이트 연동 파일 받기 <span className="adm-badge">{FILES.length}개</span><small>‘자동 업데이트’를 쓰면 직접 받을 필요 없습니다</small></summary>
      <div className="adm-files">
        {FILES.map((f) => (
          <div key={f.name} className="adm-file">
            <div>
              <strong>{f.path}</strong>
              <small>{f.desc}</small>
            </div>
            <div className="adm-row-gap">
              <a className="adm-btn sm ghost" href={`/admin/files/${f.name}?view=1`} target="_blank" rel="noreferrer">코드 보기</a>
              <a className="adm-btn sm primary" href={`/admin/files/${f.name}`}>다운로드</a>
            </div>
          </div>
        ))}
      </div>

      <ol className="adm-guide">
        <li><b>js/htu-cms-config.js</b> 를 사이트의 js 폴더에 올립니다. 모든 페이지가 이 파일로 관리자에 연결됩니다.</li>
        <li><b>menu3.js</b>(루트) · <b>js/footer.js</b> 를 교체하면 회사소개·대표 인사말 등 <b>모든 페이지</b>의 메뉴와 푸터가 관리자 내용으로 바뀝니다. 서브 페이지 HTML 은 수정할 필요가 없습니다.</li>
        <li><b>index.html</b> 은 백업 후 교체하고, <b>news.html · notice.html · event.html</b> 은 같은 폴더에 추가합니다. img · video · css 폴더는 그대로 둡니다.</li>
        <li>이후 내용 수정은 이 관리자에서만 하면 됩니다. 저장 후 약 30초 안에 사이트에 반영됩니다.</li>
      </ol>
      </details>
    </section>
  );
}
