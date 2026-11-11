'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSiteBase } from '@/lib/use-site-base';

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
  { group: '다국어', items: [{ href: '/admin/i18n', label: '🌐 번역 관리 (EN · 中 · 日)' }] },
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

export default function Sidebar({ email }) {
  const path = usePathname();
  const site = useSiteBase();
  return (
    <aside className="adm-side">
      <div className="adm-brand">
        <span className="adm-brand-mark">H</span>
        <div>
          <strong>HTU CMS</strong>
          <small>홈페이지 관리</small>
        </div>
      </div>
      <nav className="adm-nav">
        {NAV.map((g) => (
          <div key={g.group} className="adm-nav-group">
            <div className="adm-nav-title">{g.group}</div>
            {g.items.map((it) => {
              const on = it.href === '/admin' ? path === '/admin' : path.startsWith(it.href);
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
        <div className="adm-user">{email}</div>
        <form action="/admin/logout" method="post">
          <button className="adm-link-btn">로그아웃</button>
        </form>
      </div>
    </aside>
  );
}
