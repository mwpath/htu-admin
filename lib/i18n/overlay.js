// 공개 API: 선택한 언어의 번역을 원문 위에 덮어씌움 (번역이 없으면 한국어 그대로)
import { LANGS, normCode } from './langs';

export const normLang = (v) => { const c = normCode(v); return c && LANGS.includes(c) ? c : 'ko'; };

export async function loadTranslationMap(sb, lang, tables) {
  const map = new Map();
  if (!sb || lang === 'ko') return map;
  for (let from = 0; ; from += 1000) {
    let q = sb.from('translations').select('source_table,source_id,field,value').eq('lang', lang);
    if (tables) q = q.in('source_table', tables);
    const { data, error } = await q.order('id').range(from, from + 999);
    if (error) break;
    (data || []).forEach((t) => map.set(`${t.source_table}:${t.source_id}:${t.field}`, t.value));
    if (!data || data.length < 1000) break;
  }
  return map;
}

export function applyRow(map, table, row) {
  if (!row || !map.size) return row;
  const out = { ...row };
  const prefix = `${table}:${row.id}:`;
  for (const [k, v] of map) {
    if (!k.startsWith(prefix)) continue;
    const field = k.slice(prefix.length);
    if (v != null && v !== '') out[field] = v;
  }
  return out;
}

export function applyRows(map, table, rows) {
  if (!map.size) return rows;
  // 빠른 조회를 위해 테이블별 인덱스
  const idx = new Map();
  for (const [k, v] of map) {
    if (!k.startsWith(table + ':')) continue;
    const rest = k.slice(table.length + 1);
    const p = rest.indexOf(':');
    const id = rest.slice(0, p);
    if (!idx.has(id)) idx.set(id, []);
    idx.get(id).push([rest.slice(p + 1), v]);
  }
  return rows.map((r) => {
    const list = idx.get(String(r.id));
    if (!list) return r;
    const o = { ...r };
    list.forEach(([f, v]) => { if (v != null && v !== '') o[f] = v; });
    return o;
  });
}

export function applySettings(map, settings) {
  if (!map.size) return settings;
  const out = {};
  for (const [key, value] of Object.entries(settings)) {
    const o = { ...value };
    const prefix = `settings:${key}:`;
    for (const [k, v] of map) if (k.startsWith(prefix) && v != null && v !== '') o[k.slice(prefix.length)] = v;
    out[key] = o;
  }
  return out;
}
