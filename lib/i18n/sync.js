// 번역 동기화 엔진 — 한국어 원문 지문(hash)이 바뀐 항목만 번역합니다.
import crypto from 'node:crypto';
import { TABLE_FIELDS, SETTINGS_FIELDS, enabledLangs } from './fields';
import { translateBatch } from './translate';

export const HANGUL = /[ㄱ-ㆎ가-힣]/;
export const hashOf = (v) => crypto.createHash('sha1').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex').slice(0, 24);

const clean = (type, v) => {
  if (type === 'array') return (Array.isArray(v) ? v : []).map((s) => String(s || '').trim()).filter(Boolean);
  return v == null ? '' : String(v);
};
const isEmpty = (v) => (Array.isArray(v) ? !v.length : !String(v).trim());
const hasHangul = (v) => (Array.isArray(v) ? v.some((s) => HANGUL.test(s)) : HANGUL.test(v));

async function selectAll(q) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q().range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** 번역 대상 단위 수집 */
export async function collectUnits(sb) {
  const units = [];
  for (const [table, fields] of Object.entries(TABLE_FIELDS)) {
    const cols = ['id', ...Object.keys(fields)].join(',');
    let rows;
    try { rows = await selectAll(() => sb.from(table).select(cols).order('id')); } catch { continue; }
    for (const row of rows) {
      for (const [field, type] of Object.entries(fields)) {
        const v = clean(type, row[field]);
        if (isEmpty(v) || !hasHangul(v)) continue;
        units.push({ table, id: String(row.id), field, type, source: v, hash: hashOf(v) });
      }
    }
  }
  const { data: settings } = await sb.from('site_settings').select('key,value');
  for (const s of settings || []) {
    const fields = SETTINGS_FIELDS[s.key];
    if (!fields) continue;
    for (const [field, type] of Object.entries(fields)) {
      const v = clean(type, s.value?.[field]);
      if (isEmpty(v) || !hasHangul(v)) continue;
      units.push({ table: 'settings', id: s.key, field, type, source: v, hash: hashOf(v) });
    }
  }
  return units;
}

export const keyOf = (u) => (u.source_table != null
  ? `${u.source_table}:${u.source_id}:${u.field}`
  : `${u.table}:${u.id}:${u.field}`);

export async function loadExisting(sb) {
  return selectAll(() => sb.from('translations').select('id,source_table,source_id,field,lang,source_hash,locked,status').order('id'));
}

async function getI18n(sb) {
  const { data } = await sb.from('site_settings').select('value').eq('key', 'i18n').maybeSingle();
  return data?.value || {};
}

/** 번역 1건(단위 × 언어) 실행 후 저장 */
export async function translateUnits(sb, units, lang, glossary) {
  // 배열은 요소 단위로 펼쳐서 번역
  const flat = [];
  units.forEach((u, ui) => {
    if (u.type === 'array') u.source.forEach((s, k) => flat.push({ ui, k, text: s, html: false }));
    else flat.push({ ui, k: -1, text: u.source, html: u.type === 'html' });
  });
  const res = await translateBatch(flat, lang, { glossary });
  const values = units.map((u) => (u.type === 'array' ? [] : ''));
  flat.forEach((f, i) => {
    if (f.k >= 0) values[f.ui][f.k] = res[i];
    else values[f.ui] = res[i];
  });
  const rows = units.map((u, i) => ({
    source_table: u.table, source_id: u.id, field: u.field, lang,
    value: values[i], source_hash: u.hash, status: 'auto', locked: false, updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('translations').upsert(rows, { onConflict: 'source_table,source_id,field,lang' });
  if (error) throw error;
  return rows.length;
}

const CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY || 4);

function chunk(units) {
  const out = [];
  let cur = [], size = 0;
  for (const u of units) {
    const len = JSON.stringify(u.source).length;
    if (cur.length && (cur.length >= 30 || size + len > 9000)) { out.push(cur); cur = []; size = 0; }
    cur.push(u); size += len;
  }
  if (cur.length) out.push(cur);
  return out;
}

/**
 * 전체 동기화: 새로 생기거나 바뀐 한국어만 번역, 삭제된 항목의 번역은 정리
 * budgetMs 안에서 처리하고 남은 개수를 돌려줍니다 (관리자 화면이 반복 호출).
 */
export async function syncTranslations(sb, { budgetMs = 40000 } = {}) {
  const started = Date.now();
  const i18n = await getI18n(sb);
  const langs = enabledLangs(i18n);
  const glossary = String(i18n.glossary || '').trim();

  const units = await collectUnits(sb);
  const existing = await loadExisting(sb);
  const exMap = new Map(existing.map((e) => [`${keyOf(e)}:${e.lang}`, e]));
  const unitKeys = new Set(units.map(keyOf));

  // 원문이 사라진 번역 정리
  const orphans = existing.filter((e) => !unitKeys.has(keyOf(e))).map((e) => e.id);
  for (let i = 0; i < orphans.length; i += 200) await sb.from('translations').delete().in('id', orphans.slice(i, i + 200));

  const todo = {};
  let review = 0;
  for (const lang of langs) {
    todo[lang] = units.filter((u) => {
      const e = exMap.get(`${keyOf(u)}:${lang}`);
      if (!e) return true;
      if (e.source_hash === u.hash) return false;
      if (e.locked) { review++; return false; }
      return true;
    });
  }

  let translated = 0;
  const errors = [];
  let stopAll = false;
  // 언어 여러 개를 동시에 처리 (20개 언어도 빠르게)
  const runLang = async (lang) => {
    for (const group of chunk(todo[lang])) {
      if (stopAll || Date.now() - started > budgetMs) return;
      try {
        const n = await translateUnits(sb, group, lang, glossary);
        translated += n;
        group.forEach((u) => (u._done = { ...(u._done || {}), [lang]: true }));
      } catch (e) {
        const msg = String(e.message || e);
        errors.push(`[${lang}] ${msg.slice(0, 280)}`);
        if (/NOT_CONFIGURED|401|403/.test(msg)) stopAll = true;
        return; // 이 언어는 다음 실행 때 다시 시도
      }
    }
  };
  const queue = langs.filter((l) => todo[l].length);
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length && !stopAll) await runLang(queue.shift());
  });
  await Promise.all(workers);
  const remaining = langs.reduce((n, l) => n + todo[l].filter((u) => !(u._done && u._done[l])).length, 0);
  return { translated, remaining, total: units.length * langs.length, units: units.length, langs, review, removed: orphans.length, errors };
}
