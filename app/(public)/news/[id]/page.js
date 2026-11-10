import { notFound, redirect } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import { richHtml } from '@/lib/sanitize';
import ViewBump from '@/components/public/ViewBump';

export const revalidate = 300;

async function getNews(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = supabasePublic();
  if (!sb) return null;
  const { data } = await sb.from('news').select('*').eq('id', id).eq('active', true).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const n = await getNews(params.id);
  if (!n) return { title: 'News' };
  return {
    title: n.title,
    description: n.excerpt || undefined,
    openGraph: { title: n.title, description: n.excerpt || undefined, images: n.thumbnail_url ? [n.thumbnail_url] : undefined },
  };
}

const fmt = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function NewsPage({ params }) {
  const n = await getNews(params.id);
  if (!n) notFound();
  if (n.type === 'external' && n.external_url) redirect(n.external_url);

  return (
    <article className="pub-article">
      <ViewBump table="news" id={n.id} />
      <div className="pub-eyebrow">News &amp; Event</div>
      <h1 className="pub-title">{n.title}</h1>
      <div className="pub-meta">
        <time dateTime={n.published_at}>{fmt(n.published_at)}</time>
      </div>
      {n.excerpt ? <p className="pub-lead">{n.excerpt}</p> : null}
      {n.thumbnail_url ? <img className="pub-cover" src={n.thumbnail_url.replace(/^\.\//, '/')} alt="" /> : null}
      <div className="pub-content" dangerouslySetInnerHTML={{ __html: richHtml(n.content_html) }} />
      <div className="pub-actions">
        <a className="pub-btn" href="/#newsSlideSection">← 목록으로</a>
      </div>
    </article>
  );
}
