'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { previewUrl, revalidateSite, toast, errMsg, youtubeId } from '@/lib/admin-utils';
import Field, { cleanValue, Switch } from './Field';

/**
 * 범용 목록 편집기 — 추가 / 수정 / 삭제 / 복제 / 드래그 정렬 / 노출 토글
 *
 * props
 *  table, filter({col:val}), defaults, fields[], orderBy[{col,asc}], sortable, addPosition('top'|'bottom'),
 *  display: { title(row), sub(row), thumb(row), badges(row)=>[{text,tone}], link(row) }
 *  wide (편집 패널 넓게), emptyText, addLabel, itemLabel
 */
export default function CollectionEditor({
  table,
  filter = {},
  defaults = {},
  fields,
  orderBy = [{ col: 'sort', asc: true }],
  sortable = true,
  addPosition = 'bottom',
  display = {},
  wide = false,
  addLabel = '새 항목 추가',
  itemLabel = '항목',
  emptyText = '등록된 항목이 없습니다.',
  maxItems,
}) {
  const sb = supabaseBrowser();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // {form, isNew}
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from(table).select('*');
    Object.entries(filter).forEach(([k, v]) => (q = q.eq(k, v)));
    orderBy.forEach((o) => (q = q.order(o.col, { ascending: o.asc !== false })));
    const { data, error } = await q;
    if (error) toast(errMsg(error), 'err');
    setRows(data || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!query.trim()) return rows;
    const s = query.trim().toLowerCase();
    return rows.filter((r) => JSON.stringify([display.title?.(r), display.sub?.(r)]).toLowerCase().includes(s));
  }, [rows, query, display]);

  const openNew = () => {
    const base = { active: true, ...defaults, ...filter };
    dataFields.forEach((f) => {
      if (base[f.name] === undefined && f.default !== undefined) base[f.name] = typeof f.default === 'function' ? f.default() : f.default;
    });
    setEditing({ form: base, isNew: true });
  };
  const openEdit = (row) => setEditing({ form: { ...row }, isNew: false });
  const close = () => !saving && setEditing(null);

  const setField = (name, v) => setEditing((e) => ({ ...e, form: { ...e.form, [name]: v } }));

  const dataFields = fields.filter((f) => !f.section);
  const visibleFields = (form) => fields.filter((f) => !f.showIf || f.showIf(form));

  const save = async () => {
    const { form, isNew } = editing;
    for (const f of visibleFields(form).filter((x) => !x.section)) {
      const v = form[f.name];
      if (f.required && (v == null || v === '' || (Array.isArray(v) && !v.length))) {
        toast(`'${f.label}' 항목을 입력해 주세요.`, 'err');
        return;
      }
      if (f.type === 'youtube' && v && !youtubeId(v)) {
        toast('유튜브 주소를 확인해 주세요.', 'err');
        return;
      }
    }
    const payload = {};
    dataFields.forEach((f) => (payload[f.name] = cleanValue(f, form[f.name])));
    if ('active' in form) payload.active = !!form.active;
    Object.assign(payload, filter);

    setSaving(true);
    let error;
    if (isNew) {
      const sorts = rows.map((r) => r.sort ?? 0);
      const sort = !sortable ? 0 : addPosition === 'top' ? (sorts.length ? Math.min(...sorts) - 1 : 0) : sorts.length ? Math.max(...sorts) + 1 : 0;
      ({ error } = await sb.from(table).insert({ ...defaults, ...payload, sort }));
    } else {
      ({ error } = await sb.from(table).update(payload).eq('id', form.id));
    }
    setSaving(false);
    if (error) return toast(errMsg(error), 'err');
    toast(isNew ? `${itemLabel}을(를) 추가했습니다.` : '저장했습니다.');
    setEditing(null);
    revalidateSite();
    load();
  };

  const remove = async (row) => {
    const name = display.title?.(row) || itemLabel;
    if (!window.confirm(`'${name}' 을(를) 삭제할까요?\n삭제 후에는 되돌릴 수 없습니다.`)) return;
    const { error } = await sb.from(table).delete().eq('id', row.id);
    if (error) return toast(errMsg(error), 'err');
    toast('삭제했습니다.');
    if (editing?.form?.id === row.id) setEditing(null);
    revalidateSite();
    load();
  };

  const duplicate = async (row) => {
    const { id, created_at, updated_at, view_count, ...rest } = row;
    const sorts = rows.map((r) => r.sort ?? 0);
    const { error } = await sb.from(table).insert({ ...rest, active: false, sort: sorts.length ? Math.max(...sorts) + 1 : 0 });
    if (error) return toast(errMsg(error), 'err');
    toast('복제했습니다. (비노출 상태로 추가됨)');
    load();
  };

  const toggleActive = async (row, v) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, active: v } : r)));
    const { error } = await sb.from(table).update({ active: v }).eq('id', row.id);
    if (error) {
      toast(errMsg(error), 'err');
      load();
      return;
    }
    revalidateSite();
  };

  const persistOrder = async (next) => {
    setRows(next);
    const changed = next.map((r, i) => ({ r, i })).filter(({ r, i }) => r.sort !== i);
    if (!changed.length) return;
    const results = await Promise.all(changed.map(({ r, i }) => sb.from(table).update({ sort: i }).eq('id', r.id)));
    const err = results.find((x) => x.error);
    if (err) {
      toast(errMsg(err.error), 'err');
      load();
      return;
    }
    setRows(next.map((r, i) => ({ ...r, sort: i })));
    toast('순서를 변경했습니다.');
    revalidateSite();
  };

  const move = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= rows.length) return;
    const next = rows.slice();
    const [it] = next.splice(idx, 1);
    next.splice(to, 0, it);
    persistOrder(next);
  };

  const canDrag = sortable && !query.trim();
  const canAdd = !maxItems || rows.length < maxItems;

  return (
    <div className="adm-coll">
      <div className="adm-coll-head">
        <div className="adm-coll-count">
          총 <b>{rows.length}</b>개 · 노출 <b>{rows.filter((r) => r.active).length}</b>개
          {sortable ? <span className="adm-muted"> · 드래그하거나 ↑↓ 로 순서 변경</span> : null}
        </div>
        <div className="adm-row-gap">
          {rows.length > 8 ? (
            <input className="adm-input sm" placeholder="검색" value={query} onChange={(e) => setQuery(e.target.value)} />
          ) : null}
          {canAdd ? (
            <button type="button" className="adm-btn primary" onClick={openNew}>
              + {addLabel}
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="adm-empty">불러오는 중…</div>
      ) : visible.length === 0 ? (
        <div className="adm-empty">{emptyText}</div>
      ) : (
        <ul className="adm-list">
          {visible.map((row, idx) => {
            const thumb = display.thumb?.(row);
            const link = display.link?.(row);
            return (
              <li
                key={row.id}
                className={`adm-item ${row.active ? '' : 'is-off'} ${dragOver === idx ? 'is-over' : ''} ${editing?.form?.id === row.id ? 'is-editing' : ''}`}
                draggable={canDrag}
                onDragStart={(e) => {
                  dragFrom.current = idx;
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  if (!canDrag) return;
                  e.preventDefault();
                  setDragOver(idx);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const from = dragFrom.current;
                  dragFrom.current = null;
                  if (from == null || from === idx) return;
                  const next = rows.slice();
                  const [it] = next.splice(from, 1);
                  next.splice(idx, 0, it);
                  persistOrder(next);
                }}
              >
                {canDrag ? <span className="adm-grip" title="드래그하여 순서 변경">⋮⋮</span> : null}
                {sortable ? <span className="adm-idx">{idx + 1}</span> : null}
                {display.thumb ? (
                  <div className={`adm-thumb ${display.thumbShape || ''}`}>{thumb ? <img src={previewUrl(thumb)} alt="" loading="lazy" /> : <span>—</span>}</div>
                ) : null}
                <div className="adm-item-main" onClick={() => openEdit(row)}>
                  <div className="adm-item-title">
                    {(display.badges?.(row) || []).map((b, i) => (
                      <span key={i} className={`adm-badge ${b.tone || ''}`}>{b.text}</span>
                    ))}
                    <span>{display.title?.(row) || <span className="adm-muted">(제목 없음)</span>}</span>
                  </div>
                  {display.sub?.(row) ? <div className="adm-item-sub">{display.sub(row)}</div> : null}
                </div>
                <div className="adm-item-actions">
                  <Switch checked={row.active} onChange={(v) => toggleActive(row, v)} label={row.active ? '노출' : '숨김'} />
                  {sortable ? (
                    <>
                      <button type="button" className="adm-icon" title="위로" disabled={idx === 0 || !canDrag} onClick={() => move(idx, -1)}>↑</button>
                      <button type="button" className="adm-icon" title="아래로" disabled={idx === rows.length - 1 || !canDrag} onClick={() => move(idx, 1)}>↓</button>
                    </>
                  ) : null}
                  {link ? (
                    <a className="adm-icon" href={link} target="_blank" rel="noreferrer" title="미리보기">↗</a>
                  ) : null}
                  <button type="button" className="adm-btn sm" onClick={() => openEdit(row)}>수정</button>
                  <button type="button" className="adm-icon" title="복제" onClick={() => duplicate(row)}>⧉</button>
                  <button type="button" className="adm-icon danger" title="삭제" onClick={() => remove(row)}>✕</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? (
        <div className="adm-drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <aside className={`adm-drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
            <header className="adm-drawer-head">
              <h3>{editing.isNew ? `${itemLabel} 추가` : `${itemLabel} 수정`}</h3>
              <button type="button" className="adm-icon" onClick={close} aria-label="닫기">✕</button>
            </header>
            <div className="adm-drawer-body">
              <div className="adm-form">
                {visibleFields(editing.form).map((f) =>
                  f.section ? (
                    <h4 key={f.name} className="adm-form-section">{f.section}</h4>
                  ) : (
                    <Field key={f.name} field={f} value={editing.form[f.name]} form={editing.form} onChange={(v) => setField(f.name, v)} />
                  )
                )}
                <div className="adm-field">
                  <label className="adm-label">홈페이지 노출</label>
                  <Switch checked={editing.form.active} onChange={(v) => setField('active', v)} label={editing.form.active ? '노출' : '숨김'} />
                </div>
              </div>
            </div>
            <footer className="adm-drawer-foot">
              {!editing.isNew ? (
                <button type="button" className="adm-btn ghost danger" onClick={() => remove(editing.form)}>삭제</button>
              ) : <span />}
              <div className="adm-row-gap">
                <button type="button" className="adm-btn ghost" onClick={close} disabled={saving}>취소</button>
                <button type="button" className="adm-btn primary" onClick={save} disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
