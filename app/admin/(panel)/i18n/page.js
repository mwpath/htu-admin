'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHead from '@/components/admin/PageHead';
import SettingsForm from '@/components/admin/SettingsForm';
import Tabs from '@/components/admin/Tabs';
import { runTranslationSync, toast } from '@/lib/admin-utils';

import { LANG } from '@/lib/i18n/langs';
const langLabel = (c) => (LANG[c] ? `${LANG[c].name} · ${LANG[c].ko}` : c);
const TABLES = [
  ['settings', '섹션 문구 · 헤더 · 푸터'], ['menu_items', '메뉴 · 링크'], ['intro_slides', '인트로 영상'], ['hero_slides', '메인 슬라이더'],
  ['family_groups', '패밀리사이트 팝업 그룹'], ['family_sites', '패밀리사이트'], ['partner_logos', '파트너 로고'], ['publications', '정기 출간물'],
  ['expert_columns', '전문가 연재'], ['videos', '영상'], ['news', 'News & Event'], ['notices', '공지사항'], ['events', '이벤트'],
  ['popups', '메인 팝업'], ['page', '페이지 고정 문구 (회사소개 등)'],
];
const PROVIDER = { anthropic: 'Claude (Anthropic)', deepl: 'DeepL', google: 'Google 번역', mock: '테스트(mock)' };

function Status({ status, onSync, syncing, progress }) {
  if (!status) return <section className="adm-card"><div className="adm-empty">번역 상태 확인 중…</div></section>;
  const total = status.units * (status.langs.length || 1);
  const done = status.stats.reduce((n, s) => n + s.done, 0);
  const pct = total ? Math.round((done / total) * 100) : 100;
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h3>번역 현황</h3>
        <p>
          한국어 원문이 바뀐 항목만 번역합니다. 관리자에서 저장할 때마다 자동으로 실행되고, 매일 새벽 한 번 더 점검합니다.
        </p>
      </div>
      {status.tableMissing ? (
        <div className="adm-alert">번역 테이블이 없습니다. <a className="adm-link" href="/admin/integrations">연동 설정</a>에서 DB 자동 업데이트를 실행하세요 (대표 관리자).</div>
      ) : null}
      {!status.configured ? (
        <div className="adm-alert">
          번역 엔진 키가 없습니다. 대표 관리자가 <a className="adm-link" href="/admin/integrations">연동 설정</a>에서 API 키를 저장하면 바로 동작합니다 (다시 배포 불필요).
        </div>
      ) : null}
      {!status.serviceRole ? (
        <div className="adm-alert">
          서버 키가 연결되지 않았습니다. Vercel → Storage(Integrations) 에서 Supabase 연동을 연결(또는 Reconnect)한 뒤 다시 배포하세요.
        </div>
      ) : null}

      <div className="adm-row-gap" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span>
          번역 엔진 <b>{PROVIDER[status.provider] || status.provider}</b>
          {status.model ? <span className="adm-muted"> · {status.model}</span> : null}
          {' '}{status.configured ? <span className="adm-badge green">연결됨</span> : <span className="adm-badge warn">미설정</span>}
          {' '}· 번역 대상 <b>{status.units}</b>개 문구 · 페이지 고정 문구 <b>{status.memory}</b>개 저장됨
        </span>
        <button type="button" className="adm-btn primary" onClick={onSync} disabled={syncing || !status.configured}>
          {syncing ? '번역 중…' : '🌐 지금 전체 번역'}
        </button>
      </div>
      <div className="adm-progress"><i style={{ width: `${pct}%` }} /></div>
      {progress ? <p className="adm-help">{progress}</p> : null}

      <table className="adm-i18n-stats">
        <thead>
          <tr><th>언어</th><th>번역 완료</th><th>새로 번역 필요</th><th>원문 변경됨</th><th>검토 필요 (잠금 + 원문 변경)</th><th>직접 수정</th></tr>
        </thead>
        <tbody>
          {status.stats.map((s) => (
            <tr key={s.lang}>
              <td><b>{langLabel(s.lang)}</b></td>
              <td>{s.done}</td>
              <td>{s.missing}</td>
              <td>{s.stale}</td>
              <td>{s.review ? <span className="adm-badge warn">{s.review}</span> : 0}</td>
              <td>{s.manual}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FieldRow({ f, table, lang, onChanged, reg, onDirty }) {
  const initial = Array.isArray(f.value) ? f.value.join('\n') : f.value || '';
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [meta, setMeta] = useState({ status: f.status, locked: f.locked, stale: f.stale });
  const [busy, setBusy] = useState(false);
  const isArray = f.type === 'array';

  const call = async (body) => {
    setBusy(true);
    try {
      const r = await fetch('/api/translate/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ table, lang, id: f.id, field: f.field, type: f.type, source: f.source, hash: f.hash, memoryId: f.memoryId, ...body }) });
      const d = await r.json();
      if (!r.ok || d.error) throw new Error(d.error || '실패');
      return d;
    } catch (e) {
      toast(String(e.message || e), 'err');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const save = async (quiet) => {
    const v = isArray ? value.split('\n').map((s) => s.trim()).filter(Boolean) : value;
    const d = await call({ action: 'save', value: v });
    if (d) { setMeta({ status: 'manual', locked: true, stale: false }); setSaved(value); if (!quiet) toast('번역을 저장했습니다. (자동 번역이 덮어쓰지 않도록 잠금)'); onChanged?.(); }
    return !!d;
  };
  // '한번에 저장' 에 등록 — 고친 칸 + 아직 잠기지 않은 번역 칸
  const dirty = value !== saved;
  const key = `${f.id || f.memoryId}-${f.field}`;
  const api = useRef({});
  api.current = { needs: () => !!value.trim() && (dirty || !meta.locked || meta.stale), dirty, save: () => save(true) };
  useEffect(() => {
    if (!reg) return undefined;
    reg.current.set(key, api);
    return () => reg.current.delete(key);
  }, [reg, key]);
  useEffect(() => { onDirty?.(); }, [dirty, meta.locked, meta.stale, onDirty]);
  const redo = async () => {
    const d = await call({ action: 'redo' });
    if (d) { setValue(Array.isArray(d.value) ? d.value.join('\n') : d.value || ''); setMeta({ status: 'auto', locked: false, stale: false }); toast('다시 번역했습니다.'); }
  };
  const lock = async () => {
    const d = await call({ action: 'lock', locked: !meta.locked });
    if (d) setMeta((m) => ({ ...m, locked: !m.locked }));
  };

  const src = Array.isArray(f.source) ? f.source.join('\n') : f.type === 'html' ? f.source.replace(/<\/(p|h\d|li|div)>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '') : f.source;

  return (
    <div className="adm-tr-field">
      <div>
        <div className="adm-label">{f.field} · 한국어 원문</div>
        <div className="adm-tr-src">{src}</div>
      </div>
      <div>
        <div className="adm-label">번역{f.type === 'html' ? ' (HTML — 태그는 그대로 두세요)' : isArray ? ' (한 줄에 하나)' : ''}</div>
        <textarea className="adm-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="아직 번역되지 않았습니다" />
        <div className="adm-tr-meta">
          {!f.value && !meta.status ? <span className="adm-badge">번역 전</span> : null}
          {meta.status === 'auto' ? <span className="adm-badge green">자동 번역</span> : null}
          {meta.status === 'manual' ? <span className="adm-badge blue">직접 수정</span> : null}
          {meta.locked ? <span className="adm-badge">🔒 잠금</span> : null}
          {meta.stale ? <span className="adm-badge warn">원문이 바뀜 — 검토 필요</span> : null}
          <span style={{ flex: 1 }} />
          <button type="button" className="adm-btn sm ghost" onClick={lock} disabled={busy || !f.value}>{meta.locked ? '잠금 해제' : '잠금'}</button>
          <button type="button" className="adm-btn sm ghost" onClick={redo} disabled={busy}>다시 번역</button>
          {dirty ? <span className="adm-badge warn">저장 안 됨</span> : null}
          <button type="button" className="adm-btn sm primary" onClick={() => save()} disabled={busy}>저장</button>
        </div>
      </div>
    </div>
  );
}

function Browser({ langs }) {
  const [table, setTable] = useState('settings');
  const [lang, setLang] = useState(langs[0] || 'en');
  const [items, setItems] = useState(null);
  const [q, setQ] = useState('');
  const reg = useRef(new Map());
  const [counts, setCounts] = useState({ need: 0, dirty: 0 });
  const [bulk, setBulk] = useState('');
  const recount = useCallback(() => {
    clearTimeout(recount.t);
    recount.t = setTimeout(() => {
      let need = 0, dirty = 0;
      reg.current.forEach((a) => { if (a.current.needs()) need++; if (a.current.dirty) dirty++; });
      setCounts({ need, dirty });
    }, 60);
  }, []);
  const saveAll = async () => {
    const list = [...reg.current.values()].filter((a) => a.current.needs());
    if (!list.length) return toast('저장할 번역이 없습니다. 모두 저장 · 잠금 상태입니다.');
    if (!window.confirm(`이 목록의 번역 ${list.length}개를 지금 내용 그대로 저장하고 잠급니다.\n(잠근 번역은 자동 번역이 덮어쓰지 않습니다)`)) return;
    let ok = 0, fail = 0, i = 0;
    const worker = async () => {
      while (i < list.length) {
        const a = list[i++];
        (await a.current.save()) ? ok++ : fail++;
        setBulk(`저장 중… ${ok + fail} / ${list.length}`);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setBulk('');
    recount();
    toast(fail ? `${ok}개 저장 · ${fail}개 실패` : `번역 ${ok}개를 한번에 저장하고 잠갔습니다.`, fail ? 'err' : undefined);
  };

  const load = useCallback(async () => {
    setItems(null);
    const r = await fetch(`/api/translate/items?table=${table}&lang=${lang}`);
    const d = await r.json();
    setItems(d.items || []);
  }, [table, lang]);
  useEffect(() => { load(); }, [load]);

  const list = (items || []).filter((it) => !q || JSON.stringify(it).toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h3>번역 확인 · 수정</h3>
        <p>번역을 직접 고치면 자동으로 잠겨서 이후 자동 번역이 덮어쓰지 않습니다. 한국어 원문이 바뀌면 &lsquo;검토 필요&rsquo;로 표시됩니다.</p>
      </div>
      <div className="adm-row-gap" style={{ marginBottom: 12 }}>
        <select className="adm-input" style={{ width: 280 }} value={table} onChange={(e) => setTable(e.target.value)}>
          {TABLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input className="adm-input sm" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="adm-tr-bulk">
        <span>
          {bulk || (counts.need ? <>저장 · 잠금 대기 <b>{counts.need}</b>개{counts.dirty ? <> (직접 고친 칸 <b>{counts.dirty}</b>개)</> : null}</> : '이 목록의 번역이 모두 저장 · 잠금 상태입니다')}
        </span>
        <button type="button" className="adm-btn primary" onClick={saveAll} disabled={!!bulk || !counts.need}>💾 한번에 저장</button>
      </div>
      {langs.length <= 5 ? (
        <Tabs value={lang} onChange={setLang} tabs={langs.map((c) => ({ value: c, label: LANG[c]?.name || c }))} />
      ) : (
        <div className="adm-row-gap" style={{ marginBottom: 12 }}>
          <select className="adm-input" style={{ width: 280 }} value={lang} onChange={(e) => setLang(e.target.value)}>
            {langs.map((c) => <option key={c} value={c}>{langLabel(c)}</option>)}
          </select>
        </div>
      )}
      {items === null ? <div className="adm-empty">불러오는 중…</div> : list.length === 0 ? (
        <div className="adm-empty">{table === 'page' ? '아직 번역된 페이지 문구가 없습니다. 사이트에서 언어를 바꿔 페이지를 열면 자동으로 쌓입니다.' : '번역할 한국어 문구가 없습니다.'}</div>
      ) : (
        list.slice(0, 200).map((it) => (
          <div key={it.key} className="adm-tr-item">
            <h4>{it.title || it.key}</h4>
            {it.fields.map((f) => <FieldRow key={`${lang}-${f.id || f.memoryId}-${f.field}`} f={f} table={table} lang={lang} reg={reg} onDirty={recount} />)}
          </div>
        ))
      )}
    </section>
  );
}

export default function I18nPage() {
  const [status, setStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState('');

  const loadStatus = useCallback(() => {
    fetch('/api/translate/status').then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);
  useEffect(() => {
    loadStatus();
    const on = (e) => { if (e.detail.state === 'done') loadStatus(); };
    window.addEventListener('adm-i18n', on);
    return () => window.removeEventListener('adm-i18n', on);
  }, [loadStatus]);

  const sync = async () => {
    setSyncing(true);
    let total = 0;
    const last = await runTranslationSync((r) => {
      total += r.translated || 0;
      setProgress(r.error ? `오류: ${r.error}` : r.errors?.length ? `일부 오류: ${r.errors[0]}` : `번역 ${total}건 완료 · 남은 항목 ${r.remaining || 0}건`);
    });
    setSyncing(false);
    loadStatus();
    if (last && !last.error && !(last.errors || []).length) toast('모든 번역이 최신 상태입니다.');
  };

  return (
    <>
      <PageHead title="🌐 번역 관리" desc="관리자에서 한국어로 저장한 모든 내용이 영어 · 중국어(간체) · 일본어로 자동 번역되어, 사이트에서 언어를 선택하면 해당 언어로 표시됩니다." />
      <Status status={status} onSync={sync} syncing={syncing} progress={progress} />
      <SettingsForm keys={['i18n']} compact />
      {status?.langs?.length ? <Browser key={status.langs.join(',')} langs={status.langs} /> : null}
    </>
  );
}
