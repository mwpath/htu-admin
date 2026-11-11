'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSiteBase } from '@/lib/use-site-base';
import { canOpen, ROLE_LABEL } from '@/lib/perms';

const NAV = [
  { group: '개요', items: [{ href: '/admin', label: '대시보드' }, { href: '/admin/settings', label: '기본 설정 · 섹션 문구' }] },
  {
    group: '홈페이지 섹션',
    items: [
      { href: '/admin/intro', label: '⓪ 인트로 영상' },
      { href: '/admin/hero', label: '① 메인 슬라이더' },
      { href: '/admin/family', label: '　└ 패밀리사이트 팝업' },
      { href: '/admin/partners', label: '② 파트너 로고' },
      { href: '/admin/publications', label: '③ 정기 출간물' },
      { href: '/admin/columns', label: '④ 전문가 연재' },
      { href: '/admin/videos', label: '⑤ 영상 (릴 · 갤러리)' },
      { href: '/admin/news', label: '⑥ News & Event' },
    ],
  },
  {
    group: '게시 · 알림',
    items: [
      { href: '/admin/notices', label: '공지사항' },
      { href: '/admin/events', label: '이벤트' },
      { href: '/admin/popups', label: '메인 팝업' },
    ],
  },
  { group: '메뉴 · 링크', items: [{ href: '/admin/menu', label: '헤더 메뉴' }, { href: '/admin/footer', label: '푸터 · 관련 사이트' }] },
  { group: '다국어', items: [{ href: '/admin/i18n', label: '🌐 번역 · 언어' }] },
  {
    group: '계정 · 연동',
    items: [
      { href: '/admin/accounts', label: '👥 직원 계정 · 권한' },
      { href: '/admin/integrations', label: '🔌 연동 설정' },
      { href: '/admin/account', label: '내 계정' },
    ],
  },
];

function SyncBadge() {
  const [st, setSt] = useState(null);
  useEffect(() => {
    const on = (e) => setSt(e.detail);
    window.addEventListener('adm-i18n', on);
    return () => window.removeEventListener('adm-i18n', on);
  }, []);
  if (!st) return null;
  if (st.state === 'running') return <div className="adm-sync">🌐 번역 업데이트 중…</div>;
  const r = st.result || {};
  if (r.error || (r.errors && r.errors.length)) return <Link href="/admin/i18n" className="adm-sync err">🌐 번역 오류 — 확인</Link>;
  return <div className="adm-sync ok">🌐 번역 최신 상태{r.translated ? ` (+${r.translated})` : ''}</div>;
}

export default function Sidebar({ email, me }) {
  const path = usePathname();
  const site = useSiteBase();
  const [open, setOpen] = useState(false);
  // 모바일: 메뉴를 고르면 닫기 · 열려 있는 동안 뒤 화면 스크롤 막기
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.documentElement.classList.toggle('adm-lock', open);
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('adm-lock'); };
  }, [open]);
  const current = NAV.flatMap((g) => g.items).filter((it) => (it.href === '/admin' ? path === '/admin' : path === it.href || path.startsWith(it.href + '/'))).pop();

  return (
    <>
      <header className="adm-topbar">
        <button type="button" className="adm-burger" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(true)}>
          <span /><span /><span />
        </button>
        <div className="adm-topbar-title">{current ? current.label.replace(/^[\s　└]+/, '') : 'HTU CMS'}</div>
        {site ? <a href={site} target="_blank" rel="noreferrer" className="adm-topbar-site" aria-label="사이트 보기">↗</a> : <span />}
      </header>
      <div className={`adm-side-dim ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`adm-side ${open ? 'is-open' : ''}`}>
        <div className="adm-brand">
          <span className="adm-brand-mark">H</span>
          <div>
            <strong>HTU CMS</strong>
            <small>홈페이지 관리</small>
          </div>
          <button type="button" className="adm-side-close" aria-label="메뉴 닫기" onClick={() => setOpen(false)}>✕</button>
        </div>
        <nav className="adm-nav">
          {NAV.map((g) => ({ ...g, items: g.items.filter((it) => canOpen(me, it.href)) })).filter((g) => g.items.length).map((g) => (
            <div key={g.group} className="adm-nav-group">
              <div className="adm-nav-title">{g.group}</div>
              {g.items.map((it) => {
                const on = it.href === '/admin' ? path === '/admin' : path === it.href || path.startsWith(it.href + '/');
                return (
                  <Link key={it.href} href={it.href} className={on ? 'is-on' : ''}>
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="adm-side-foot">
          <SyncBadge />
          {site ? <a href={site} target="_blank" rel="noreferrer" className="adm-btn ghost-light sm">사이트 보기 ↗</a> : null}
          <div className="adm-user">
            <b>{me?.name || me?.username || email}</b>
            <span className="adm-role">{ROLE_LABEL[me?.role] || ''}</span>
            <small>{me?.username || email}</small>
          </div>
          <form action="/admin/logout" method="post">
            <button className="adm-link-btn">로그아웃</button>
          </form>
        </div>
      </aside>
    </>
  );
}
