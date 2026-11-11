import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import PageHead from '@/components/admin/PageHead';
import RefreshButton from '@/components/admin/RefreshButton';
import SiteConnect from '@/components/admin/SiteConnect';

const CARDS = [
  { table: 'intro_slides', label: '인트로 영상', href: '/admin/intro' },
  { table: 'hero_slides', label: '메인 슬라이드', href: '/admin/hero' },
  { table: 'family_sites', label: '패밀리사이트', href: '/admin/family' },
  { table: 'partner_logos', label: '파트너 로고', href: '/admin/partners' },
  { table: 'publications', label: '정기 출간물', href: '/admin/publications' },
  { table: 'expert_columns', label: '전문가 연재', href: '/admin/columns' },
  { table: 'videos', label: '영상', href: '/admin/videos' },
  { table: 'news', label: 'News & Event', href: '/admin/news' },
  { table: 'notices', label: '공지사항', href: '/admin/notices' },
  { table: 'events', label: '이벤트', href: '/admin/events' },
  { table: 'menu_items', label: '메뉴 · 링크', href: '/admin/menu' },
  { table: 'popups', label: '메인 팝업', href: '/admin/popups' },
];

export default async function Dashboard() {
  const sb = supabaseServer();
  const counts = await Promise.all(
    CARDS.map(async (c) => {
      const [all, on] = await Promise.all([
        sb.from(c.table).select('id', { count: 'exact', head: true }),
        sb.from(c.table).select('id', { count: 'exact', head: true }).eq('active', true),
      ]);
      return { ...c, total: all.count ?? 0, active: on.count ?? 0 };
    })
  );
  const { data: recent } = await sb.from('news').select('id,title,type,updated_at').order('updated_at', { ascending: false }).limit(5);

  return (
    <>
      <PageHead title="대시보드" desc="홈페이지의 모든 섹션을 여기서 관리합니다. 저장하면 약 30초 안에 기존 사이트에 반영됩니다.">
        <RefreshButton />
      </PageHead>

      <SiteConnect />

      <div className="adm-stats">
        {counts.map((c) => (
          <Link key={c.table} href={c.href} className="adm-stat">
            <span>{c.label}</span>
            <strong>{c.active}</strong>
            <small>전체 {c.total}개 중 노출</small>
          </Link>
        ))}
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head"><h3>최근 수정한 News &amp; Event</h3></div>
          <ul className="adm-mini-list">
            {(recent || []).map((r) => (
              <li key={r.id}>
                <span className={`adm-badge ${r.type === 'internal' ? 'green' : ''}`}>{r.type === 'internal' ? '내부 글' : '외부 링크'}</span>
                <Link href="/admin/news">{r.title}</Link>
                <time>{new Date(r.updated_at).toLocaleDateString('ko-KR')}</time>
              </li>
            ))}
            {!recent?.length ? <li className="adm-muted">아직 없습니다.</li> : null}
          </ul>
        </section>
        <section className="adm-card">
          <div className="adm-card-head"><h3>바로가기</h3></div>
          <ul className="adm-mini-list">
            <li><Link href="/admin/intro">⓪ 인트로 영상 수정</Link></li>
            <li><Link href="/admin/news">News &amp; Event 글쓰기</Link></li>
            <li><Link href="/admin/notices">공지사항 작성</Link></li>
            <li><Link href="/admin/events">이벤트 등록</Link></li>
            <li><Link href="/admin/menu">헤더 메뉴 편집</Link></li>
            <li><Link href="/admin/footer">푸터 · 관련 사이트 편집</Link></li>
            <li><Link href="/admin/popups">메인 팝업 관리</Link></li>
          </ul>
        </section>
      </div>
    </>
  );
}
