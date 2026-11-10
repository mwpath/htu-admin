import './admin.css';

export const metadata = { title: '관리자', robots: { index: false, follow: false } };

export default function AdminRoot({ children }) {
  return <div className="adm">{children}</div>;
}
