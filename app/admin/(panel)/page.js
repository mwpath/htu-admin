import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import PageHead from '@/components/admin/PageHead';
import RefreshButton from '@/components/admin/RefreshButton';

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
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '') || '(배포 도메인)';

  return (
    <>
      <PageHead title="대시보드" desc="홈페이지의 모든 섹션을 여기서 관리합니다. 저장하면 1분 이내 홈페이지에 반영됩니다.">
        <RefreshButton />
        <a className="adm-btn" href="/" target="_blank" rel="noreferrer">홈페이지 보기 ↗</a>
      </PageHead>

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
          <div className="adm-card-head"><h3>다른 사이트에 섹션 붙여넣기</h3></div>
          <ol className="adm-guide">
            <li>
              섹션보다 위에 한 줄 추가:
              <code>{`<script>window.HTU_CMS_ENDPOINT='${site}';</script>`}</code>
            </li>
            <li>
              <a href="/embed/all-sections.html" target="_blank" rel="noreferrer">/embed/all-sections.html</a> 또는 섹션별 파일(
              <a href="/embed/main-slider.html" target="_blank" rel="noreferrer">main-slider</a>,{' '}
              <a href="/embed/partners.html" target="_blank" rel="noreferrer">partners</a> …) 코드를 그대로 붙여넣기
            </li>
            <li>이후 내용 수정은 이 관리자에서만 하면 자동 반영됩니다.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
