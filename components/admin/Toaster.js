'use client';
import { useEffect, useState } from 'react';

export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      setItems((s) => [...s, { id, ...e.detail }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), e.detail.type === 'err' ? 5200 : 2600);
    };
    window.addEventListener('adm-toast', on);
    return () => window.removeEventListener('adm-toast', on);
  }, []);
  return (
    <div className="adm-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`adm-toast ${t.type === 'err' ? 'err' : ''}`}>{t.message}</div>
      ))}
    </div>
  );
}
