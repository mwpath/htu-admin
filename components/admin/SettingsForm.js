'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { revalidateSite, toast, errMsg } from '@/lib/admin-utils';
import Field, { cleanValue } from './Field';
import { SETTING_GROUPS } from './settings-schema';
import { useMe } from './AdminContext';
import { canEdit, settingsSection } from '@/lib/perms';

/** site_settings(key → jsonb) 편집. keys 로 표시할 그룹 지정 */
export default function SettingsForm({ keys, compact = false, only = null, titles = null }) {
  const me = useMe();
  const sb = supabaseBrowser();
  // 권한이 있는 섹션 설정만 표시 (DB 도 같은 규칙으로 저장을 막습니다)
  const groups = SETTING_GROUPS.filter((g) => (!keys || keys.includes(g.key)) && canEdit(me, settingsSection(g.key)));
  const [values, setValues] = useState(null);
  const [dirty, setDirty] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb.from('site_settings')
      .select('key,value')
      .in('key', groups.map((g) => g.key))
      .then(({ data, error }) => {
        if (error) toast(errMsg(error), 'err');
        const v = {};
        groups.forEach((g) => {
          const row = (data || []).find((r) => r.key === g.key);
          const base = {};
          g.fields.forEach((f) => { if (!f.virtual) base[f.name] = f.default; });
          v[g.key] = { ...base, ...(row?.value || {}) };
        });
        setValues(v);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(keys || []).join(',')]);

  const setMany = (key, patch) => {
    setValues((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
    setDirty((d) => ({ ...d, [key]: true }));
  };
  const set = (key, name, v) => {
    setValues((s) => ({ ...s, [key]: { ...s[key], [name]: v } }));
    setDirty((d) => ({ ...d, [key]: true }));
  };

  const save = async () => {
    const keysToSave = Object.keys(dirty).filter((k) => dirty[k]);
    if (!keysToSave.length) return toast('변경된 내용이 없습니다.');
    setSaving(true);
    const rows = keysToSave.map((key) => {
      const g = groups.find((x) => x.key === key);
      const value = { ...values[key] };
      g.fields.forEach((f) => { if (!f.virtual) value[f.name] = cleanValue(f, value[f.name]); });
      return { key, value };
    });
    const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) return toast(errMsg(error), 'err');
    setDirty({});
    toast('설정을 저장했습니다.');
    revalidateSite();
  };

  if (!values) return <div className="adm-card"><div className="adm-empty">불러오는 중…</div></div>;
  const isDirty = Object.values(dirty).some(Boolean);

  return (
    <div className={`adm-settings ${compact ? 'compact' : ''}`}>
      {groups.map((g) => (
        <section key={g.key} className="adm-card">
          <div className="adm-card-head">
            <h3>{titles?.[g.key] || g.title}</h3>
            {g.desc ? <p>{g.desc}</p> : null}
          </div>
          <div className="adm-form">
            {g.fields.filter((f) => !only?.[g.key] || only[g.key].includes(f.name)).map((f) => (
              <Field key={f.name} field={f} value={values[g.key][f.name]} form={values[g.key]} onChange={(v) => (f.type === 'langs' ? setMany(g.key, v) : set(g.key, f.name, v))} />
            ))}
          </div>
        </section>
      ))}
      <div className={`adm-savebar ${isDirty ? 'is-dirty' : ''}`}>
        <span>{isDirty ? '저장하지 않은 변경사항이 있습니다.' : '모든 변경사항이 저장되었습니다.'}</span>
        <button type="button" className="adm-btn primary" onClick={save} disabled={saving || !isDirty}>
          {saving ? '저장 중…' : '설정 저장'}
        </button>
      </div>
    </div>
  );
}
