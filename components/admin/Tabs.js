'use client';
export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="adm-tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? 'is-on' : ''} onClick={() => onChange(t.value)}>
          {t.label}
          {t.hint ? <small>{t.hint}</small> : null}
        </button>
      ))}
    </div>
  );
}
