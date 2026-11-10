import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import ViewBump from '@/components/public/ViewBump';

export const revalidate = 300;

async function getNotice(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = supabasePublic();
  if (!sb) return null;
  const { data } = await sb.from('notices').select('*').eq('id', id).eq('active', true).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const n = await getNotice(params.id);
  return { title: n ? n.title : '공지사항' };
}

const fmt = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function NoticeDetail({ params }) {
  const n = await getNotice(params.id);
  if (!n) notFound();
  return (
    <article className="pub-article">
      <ViewBump table="notices" id={n.id} />
      <div className="pub-eyebrow">Notice</div>
      <h1 className="pub-title">{n.title}</h1>
      <div className="pub-meta">
        <time dateTime={n.published_at}>{fmt(n.published_at)}</time>
      </div>
      <div className="pub-content" dangerouslySetInnerHTML={{ __html: richHtml(n.content_html) }} />
      <div className="pub-actions">
        <Link className="pub-btn" href="/notice">← 목록으로</Link>
      </div>
    </article>
  );
}
