// 페이지 고정 문구 번역 (회사소개 등 HTML 에 직접 쓰인 글 · 버튼 문구)
// 남용 방지: 실제 사이트 페이지(HTML + 그 페이지의 스크립트)에 들어있는 문장만 번역합니다.
import crypto from 'node:crypto';
import { translateBatch } from './translate';

const MAX_TEXTS = 400;
const MAX_CHARS = 40000;
export const norm = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 24);

function decode(html) {
  return html
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

export function safePath(p) {
  let s = String(p || '/').split('?')[0].split('#')[0];
  if (!s.startsWith('/')) s = '/' + s;
  if (s.includes('..') || !/^\/[\w\-./%]*$/.test(s)) return null;
  return s;
}

async function haystack(siteBase, path) {
  const pageUrl = siteBase + (path === '/' ? '/' : path);
  const get = async (u) => {
    try {
      const r = await fetch(u, { next: { revalidate: 600 } });
      return r.ok ? await r.text() : '';
    } catch { return ''; }
  };
  const html = await get(pageUrl);
  if (!html) return '';
  const origin = new URL(siteBase).origin;
  const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => { try { return new URL(m[1], pageUrl); } catch { return null; } })
    .filter((u) => u && u.origin === origin && !/jquery|\.min\.js/i.test(u.pathname))
    .slice(0, 12);
  const scripts = await Promise.all(srcs.map((u) => get(u.href)));
  const raw = [html, ...scripts].join('\n');
  return norm(decode(raw)) + '\n' + norm(decode(raw.replace(/<[^>]+>/g, ' ')));
}

/** texts 와 같은 순서의 번역 배열 (번역 불가 항목은 null) */
export async function translatePageTexts(sb, { siteBase, path, lang, texts, glossary }) {
  const list = (texts || []).slice(0, MAX_TEXTS).map(norm);
  let total = 0;
  const items = list.map((t) => {
    total += t.length;
    return total <= MAX_CHARS && t ? { t, h: hash(t) } : null;
  });
  const hashes = [...new Set(items.filter(Boolean).map((i) => i.h))];
  const found = new Map();
  for (let i = 0; i < hashes.length; i += 150) {
    const { data } = await sb.from('text_memory').select('hash,value').eq('lang', lang).in('hash', hashes.slice(i, i + 150));
    (data || []).forEach((r) => found.set(r.hash, r.value));
  }

  const misses = [...new Map(items.filter((i) => i && !found.has(i.h)).map((i) => [i.h, i])).values()];
  if (misses.length && siteBase) {
    const hay = await haystack(siteBase, path);
    const verified = misses.filter((m) => hay && hay.includes(m.t));
    for (let i = 0; i < verified.length; i += 40) {
      const group = verified.slice(i, i + 40);
      try {
        const out = await translateBatch(group.map((g) => ({ text: g.t, html: false })), lang, { glossary });
        const rows = group.map((g, k) => ({ hash: g.h, lang, source: g.t, value: out[k], last_path: path, updated_at: new Date().toISOString() }));
        await sb.from('text_memory').upsert(rows, { onConflict: 'hash,lang', ignoreDuplicates: true });
        rows.forEach((r) => found.set(r.hash, r.value));
      } catch (e) {
        console.error('[i18n] page translate failed', e?.message || e);
        break;
      }
    }
  }
  return items.map((i) => (i && found.has(i.h) ? found.get(i.h) : null));
}
