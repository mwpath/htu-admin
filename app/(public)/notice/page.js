import Link from 'next/link';
import { supabasePublic } from '@/lib/supabase/public';

export const revalidate = 300;
export const metadata = { title: '공지사항' };

const PER = 15;
const fmt = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

export default async function NoticeList({ searchParams }) {
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
  const sb = supabasePublic();
  let rows = [];
  let count = 0;
  if (sb) {
    const res = await sb
      .from('notices')
      .select('id,title,pinned,published_at,view_count', { count: 'exact' })
      .eq('active', true)
      .order('pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range((page - 1) * PER, page * PER - 1);
    rows = res.data || [];
    count = res.count || 0;
  }
  const pages = Math.max(1, Math.ceil(count / PER));

  return (
    <section className="pub-board">
      <div className="pub-eyebrow">Notice</div>
      <h1 className="pub-title">공지사항</h1>
      <ul className="pub-list">
        {rows.length === 0 ? <li className="pub-empty">등록된 공지사항이 없습니다.</li> : null}
        {rows.map((r, i) => (
          <li key={r.id} className={r.pinned ? 'is-pinned' : ''}>
            <Link href={`/notice/${r.id}`}>
              <span className="pub-no">{r.pinned ? <em>공지</em> : count - ((page - 1) * PER + i)}</span>
              <span className="pub-subject">{r.title}</span>
              <span className="pub-date">{fmt(r.published_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 ? (
        <nav className="pub-pager">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/notice?page=${p}`} className={p === page ? 'is-on' : ''}>
              {p}
            </Link>
          ))}
        </nav>
      ) : null}
    </section>
  );
}
