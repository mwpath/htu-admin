// 번역 엔진 — 관리자 '연동 설정'에서 선택 (anthropic | deepl | google). 테스트용 mock 은 환경변수로만.
import { LANG_LIST } from './langs';
import { getSecrets } from '../secrets';

const TARGET = {
  anthropic: Object.fromEntries(LANG_LIST.map((l) => [l.code, l.ai])),
  deepl: Object.fromEntries(LANG_LIST.map((l) => [l.code, l.deepl])),
  google: Object.fromEntries(LANG_LIST.map((l) => [l.code, l.google])),
};
export const DEFAULT_MODEL = 'claude-sonnet-5-5';

/** 현재 번역 설정 (DB → 예전 환경변수 순) */
export async function getTranslateConfig(opts) {
  const s = await getSecrets(opts);
  const keys = { anthropic: s.anthropic_api_key || '', deepl: s.deepl_api_key || '', google: s.google_api_key || '' };
  let provider = String(s.translate_provider || '').toLowerCase();
  // 엔진을 따로 고르지 않았으면 키가 있는 엔진을 자동 사용
  if (!provider) provider = keys.anthropic ? 'anthropic' : keys.deepl ? 'deepl' : keys.google ? 'google' : 'anthropic';
  const configured = provider === 'mock' || !!keys[provider];
  return { provider, keys, configured, model: provider === 'anthropic' ? s.translate_model || DEFAULT_MODEL : null };
}

export function providerInfo(cfg) {
  return { provider: cfg.provider, configured: cfg.configured, model: cfg.model };
}

// DeepL 이 지원하지 않는 언어(베트남어·태국어 등)는 키가 있는 다른 엔진으로 자동 전환
export function engineFor(lang, cfg) {
  if (cfg.provider === 'mock') return 'mock';
  if (cfg.provider !== 'deepl' || TARGET.deepl[lang]) return cfg.provider;
  if (cfg.keys.google) return 'google';
  if (cfg.keys.anthropic) return 'anthropic';
  return null;
}

/**
 * texts: [{ text, html }]  →  번역 문자열 배열 (같은 순서)
 */
export async function translateBatch(items, lang, { glossary = '', cfg } = {}) {
  if (!items.length) return [];
  cfg = cfg || (await getTranslateConfig());
  if (!cfg.configured) throw new Error('TRANSLATE_NOT_CONFIGURED');

  const engine = engineFor(lang, cfg);
  if (!engine) throw new Error(`UNSUPPORTED_LANG: DeepL 은 ${lang} 을(를) 지원하지 않습니다. 연동 설정에서 Google 또는 Claude 키를 추가하세요.`);
  if (engine === 'mock') return items.map((it) => `[${lang}] ${it.text}`);
  if (engine === 'deepl' || engine === 'google') {
    // 태그가 섞인 문구(<b>, <u> 등)는 HTML 모드로, 줄바꿈은 표식으로 보호
    const prep = items.map((it) => {
      const html = !!it.html || /<[a-z][^>]*>/i.test(it.text);
      return { html, text: html ? it.text.replace(/\n/g, '<br data-nl="1">') : it.text };
    });
    const out = engine === 'deepl' ? await deepl(prep, lang, cfg.keys.deepl) : await google(prep, lang, cfg.keys.google);
    return out.map((t, i) => (prep[i].html ? String(t).replace(/\s*<br data-nl="1"\s*\/?>\s*/g, '\n') : t));
  }
  return anthropic(items, lang, glossary, cfg);
}

async function anthropic(items, lang, glossary, cfg) {
  const model = cfg.model || DEFAULT_MODEL;
  const system = [
    `You are a professional translator for the corporate website of HTU GLOBAL HOLDINGS, a Korean health & beauty company.`,
    `Translate each Korean input string into natural, polished ${TARGET.anthropic[lang]} suitable for a premium corporate website.`,
    `Rules:`,
    `- Return ONLY a JSON array of strings, same length and order as the input. No commentary.`,
    `- Preserve every HTML tag, attribute, URL, email address, phone number and line break exactly; translate only human-readable text.`,
    `- Keep brand and product names in their official form (e.g. HTU GLOBAL HOLDINGS, MAXQ). Romanize Korean proper nouns when no official name exists.`,
    `- Keep it concise for UI labels and buttons. Do not add explanations.`,
    glossary ? `Glossary (must follow):\n${glossary}` : '',
  ].filter(Boolean).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': cfg.keys.anthropic,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: JSON.stringify(items.map((i) => i.text)) }],
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1);
  const out = JSON.parse(json);
  if (!Array.isArray(out) || out.length !== items.length) throw new Error('번역 결과 개수가 맞지 않습니다.');
  return out.map(String);
}

async function deepl(items, lang, key) {
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const out = [];
  for (const html of [false, true]) {
    const group = items.map((it, i) => ({ ...it, i })).filter((it) => !!it.html === html);
    if (!group.length) continue;
    const res = await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `DeepL-Auth-Key ${key}` },
      body: JSON.stringify({ text: group.map((g) => g.text), source_lang: 'KO', target_lang: TARGET.deepl[lang], ...(html ? { tag_handling: 'html' } : {}) }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`DeepL ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    data.translations.forEach((t, k) => (out[group[k].i] = t.text));
  }
  return out;
}

async function google(items, lang, key) {
  const out = [];
  for (const html of [false, true]) {
    const group = items.map((it, i) => ({ ...it, i })).filter((it) => !!it.html === html);
    if (!group.length) continue;
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: group.map((g) => g.text), source: 'ko', target: TARGET.google[lang], format: html ? 'html' : 'text' }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Google ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    data.data.translations.forEach((t, k) => (out[group[k].i] = t.translatedText));
  }
  return out;
}
