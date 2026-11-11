// Supabase Storage 에 있던 기존 업로드 → GitHub 로 이전 (서버 전용)
// 1) 모든 콘텐츠 · 번역에서 Supabase 파일 주소를 찾고  2) 파일을 GitHub 에 올린 뒤
// 3) 주소를 바꾸고 (번역 지문도 함께 갱신 → 다시 번역하지 않음)  4) Supabase 파일을 삭제합니다.
import { env } from '../env';
import { hashOf } from '../i18n/sync';
import { commitFile, fileExists, resolveBranch, publicUrl, checkFile } from './github';

const TABLES = { site_settings: 'key', hero_slides: 'id', intro_slides: 'id', family_groups: 'id', family_sites: 'id', partner_logos: 'id',
  publications: 'id', expert_columns: 'id', videos: 'id', news: 'id', notices: 'id', popups: 'id', events: 'id', menu_items: 'id', translations: 'id' };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function prefix() {
  const base = env.supabaseUrl().replace(/\/+$/, '');
  return base ? `${base}/storage/v1/object/public/cms/` : null;
}

async function selectAll(sb, table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select('*').range(from, from + 999);
    if (error) { if (/does not exist|PGRST20/.test(error.message + error.code)) return out; throw error; }
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

const replaceDeep = (v, map) => {
  if (typeof v === 'string') { let s = v; for (const [a, b] of map) if (s.includes(a)) s = s.split(a).join(b); return s; }
  if (Array.isArray(v)) return v.map((x) => replaceDeep(x, map));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, replaceDeep(x, map)]));
  return v;
};

/** 남은 Supabase 파일 주소 목록 */
export async function scan(sb) {
  const pre = prefix();
  if (!pre) return { pre: null, rows: {}, urls: [] };
  const re = new RegExp(esc(pre) + '[^"\'\\s)<>]+', 'g');
  const rows = {};
  const urls = new Set();
  for (const t of Object.keys(TABLES)) {
    rows[t] = (await selectAll(sb, t)).filter((r) => {
      const found = JSON.stringify(r).match(re);
      if (found) found.forEach((u) => !u.includes('/tmp/') && urls.add(u.replace(/\\$/, '')));
      return !!found;
    });
  }
  return { pre, rows, urls: [...urls] };
}

export async function migrateBatch(sb, cfg, { budgetMs = 40_000, removeOld = true } = {}) {
  const started = Date.now();
  const { pre, rows, urls } = await scan(sb);
  if (!pre) return { moved: 0, remaining: 0, total: 0, errors: ['Supabase 주소를 알 수 없습니다.'] };
  const branch = await resolveBranch(cfg);
  const map = new Map();
  const errors = [];
  const movedPaths = [];

  for (const url of urls) {
    if (Date.now() - started > budgetMs) break;
    const objectPath = decodeURIComponent(url.slice(pre.length).split('?')[0]);
    const target = `${cfg.folder}/supabase/${objectPath}`.replace(/[^\w./-]/g, '-');
    try {
      if (!(await fileExists(cfg, branch, target))) {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`원본을 받을 수 없음 (${res.status})`);
        const buf = Buffer.from(await res.arrayBuffer());
        checkFile(target, buf);
        await commitFile(cfg, target, buf, `CMS 이전: ${objectPath}`);
      }
      map.set(url, publicUrl(cfg, branch, target));
      movedPaths.push(objectPath);
    } catch (e) {
      errors.push(`${objectPath}: ${String(e.message || e).slice(0, 160)}`);
    }
  }

  // 주소 바꾸기 (원문을 먼저, 번역은 원문 지문과 함께)
  const newSource = new Map(); // `${table}:${id}:${field}` → { old, next }
  for (const [t, pk] of Object.entries(TABLES)) {
    if (t === 'translations') continue;
    for (const row of rows[t]) {
      const next = replaceDeep(row, map);
      if (JSON.stringify(next) === JSON.stringify(row)) continue;
      const patch = {};
      for (const k of Object.keys(row)) if (JSON.stringify(row[k]) !== JSON.stringify(next[k])) patch[k] = next[k];
      const { error } = await sb.from(t).update(patch).eq(pk, row[pk]);
      if (error) { errors.push(`${t}: ${error.message}`); continue; }
      const srcTable = t === 'site_settings' ? 'settings' : t;
      const srcId = String(row[pk]);
      if (t === 'site_settings') {
        for (const f of Object.keys(row.value || {})) if (JSON.stringify(row.value[f]) !== JSON.stringify(next.value?.[f])) newSource.set(`${srcTable}:${srcId}:${f}`, { old: row.value[f], next: next.value[f] });
      } else {
        for (const f of Object.keys(patch)) newSource.set(`${srcTable}:${srcId}:${f}`, { old: row[f], next: next[f] });
      }
    }
  }
  const trRows = await selectAll(sb, 'translations');
  for (const tr of trRows) {
    const src = newSource.get(`${tr.source_table}:${tr.source_id}:${tr.field}`);
    const value = replaceDeep(tr.value, map);
    const patch = {};
    if (JSON.stringify(value) !== JSON.stringify(tr.value)) patch.value = value;
    // 번역이 최신이었다면 지문도 새 원문 기준으로 → 주소만 바뀐 글을 다시 번역하지 않음
    if (src && tr.source_hash === hashOf(src.old)) patch.source_hash = hashOf(src.next);
    if (!Object.keys(patch).length) continue;
    const { error } = await sb.from('translations').update(patch).eq('id', tr.id);
    if (error) errors.push(`translations: ${error.message}`);
  }

  // 옮긴 원본 삭제
  if (removeOld && movedPaths.length && !errors.length) {
    for (let i = 0; i < movedPaths.length; i += 100) await sb.storage.from('cms').remove(movedPaths.slice(i, i + 100)).catch(() => {});
  }
  const left = (await scan(sb)).urls.length;
  return { moved: movedPaths.length, remaining: left, total: urls.length, errors };
}

/** 어디에도 쓰이지 않는 Supabase 파일 수 (정리용) */
export async function countStorage(sb) {
  let n = 0;
  async function walk(prefixPath, depth) {
    if (depth > 5) return;
    const { data } = await sb.storage.from('cms').list(prefixPath, { limit: 1000 });
    for (const it of data || []) {
      if (it.id) n++;
      else await walk(prefixPath ? `${prefixPath}/${it.name}` : it.name, depth + 1);
    }
  }
  await walk('', 0).catch(() => {});
  return n;
}
