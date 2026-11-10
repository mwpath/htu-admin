import './public.css';
import Link from 'next/link';
import { getSiteSettings } from '@/lib/content';

export default async function PublicLayout({ children }) {
  const site = await getSiteSettings();
  const home = site.home_url || '/';
  return (
    <div className="pub">
      <header className="pub-header">
        <div className="pub-inner">
          <a className="pub-logo" href={home}>
            {site.logo_url ? <img src={site.logo_url.replace(/^\.\//, '/')} alt={site.name || 'HTU'} /> : <span>{site.name || 'HTU'}</span>}
          </a>
          <nav className="pub-nav">
            <a href={home}>홈</a>
            <Link href="/notice">공지사항</Link>
          </nav>
        </div>
      </header>
      <main className="pub-main">{children}</main>
      <footer className="pub-footer">
        <div className="pub-inner">© {new Date().getFullYear()} {site.name || 'HTU'}</div>
      </footer>
    </div>
  );
}
