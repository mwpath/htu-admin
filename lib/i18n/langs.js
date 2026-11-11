// 사이트 언어 목록 (한 곳에서 관리) — 서버 · 관리자 · 사이트 스크립트(build 시 주입)가 함께 사용
// code: 사이트/DB 에서 쓰는 코드 (소문자)  html: <html lang>  deepl/google: 엔진별 코드 (null = 해당 엔진 미지원)
export const LANG_LIST = [
  { code: 'ko', name: '한국어', ko: '한국어', short: 'KO', html: 'ko', locale: 'ko-KR', deepl: 'KO', google: 'ko', ai: 'Korean' },
  { code: 'en', name: 'English', ko: '영어', short: 'EN', html: 'en', locale: 'en-US', deepl: 'EN-US', google: 'en', ai: 'English' },
  { code: 'ja', name: '日本語', ko: '일본어', short: 'JA', html: 'ja', locale: 'ja-JP', deepl: 'JA', google: 'ja', ai: 'Japanese (日本語)' },
  { code: 'zh', name: '简体中文', ko: '중국어(간체)', short: '简', html: 'zh-CN', locale: 'zh-CN', deepl: 'ZH-HANS', google: 'zh-CN', ai: 'Simplified Chinese (简体中文, mainland China)' },
  { code: 'zh-tw', name: '繁體中文', ko: '중국어(번체)', short: '繁', html: 'zh-TW', locale: 'zh-TW', deepl: 'ZH-HANT', google: 'zh-TW', ai: 'Traditional Chinese (繁體中文, Taiwan)' },
  { code: 'vi', name: 'Tiếng Việt', ko: '베트남어', short: 'VI', html: 'vi', locale: 'vi-VN', deepl: null, google: 'vi', ai: 'Vietnamese' },
  { code: 'th', name: 'ไทย', ko: '태국어', short: 'TH', html: 'th', locale: 'th-TH', deepl: null, google: 'th', ai: 'Thai' },
  { code: 'id', name: 'Bahasa Indonesia', ko: '인도네시아어', short: 'ID', html: 'id', locale: 'id-ID', deepl: 'ID', google: 'id', ai: 'Indonesian' },
  { code: 'ms', name: 'Bahasa Melayu', ko: '말레이어', short: 'MS', html: 'ms', locale: 'ms-MY', deepl: null, google: 'ms', ai: 'Malay' },
  { code: 'tl', name: 'Filipino', ko: '필리핀어', short: 'TL', html: 'fil', locale: 'fil-PH', deepl: null, google: 'tl', ai: 'Filipino (Tagalog)' },
  { code: 'hi', name: 'हिन्दी', ko: '힌디어', short: 'HI', html: 'hi', locale: 'hi-IN', deepl: null, google: 'hi', ai: 'Hindi' },
  { code: 'mn', name: 'Монгол', ko: '몽골어', short: 'MN', html: 'mn', locale: 'mn-MN', deepl: null, google: 'mn', ai: 'Mongolian (Cyrillic)' },
  { code: 'ru', name: 'Русский', ko: '러시아어', short: 'RU', html: 'ru', locale: 'ru-RU', deepl: 'RU', google: 'ru', ai: 'Russian' },
  { code: 'uz', name: 'Oʻzbekcha', ko: '우즈베크어', short: 'UZ', html: 'uz', locale: 'uz-UZ', deepl: null, google: 'uz', ai: 'Uzbek (Latin script)' },
  { code: 'es', name: 'Español', ko: '스페인어', short: 'ES', html: 'es', locale: 'es-ES', deepl: 'ES', google: 'es', ai: 'Spanish' },
  { code: 'pt', name: 'Português', ko: '포르투갈어', short: 'PT', html: 'pt', locale: 'pt-BR', deepl: 'PT-BR', google: 'pt', ai: 'Portuguese (Brazil)' },
  { code: 'fr', name: 'Français', ko: '프랑스어', short: 'FR', html: 'fr', locale: 'fr-FR', deepl: 'FR', google: 'fr', ai: 'French' },
  { code: 'de', name: 'Deutsch', ko: '독일어', short: 'DE', html: 'de', locale: 'de-DE', deepl: 'DE', google: 'de', ai: 'German' },
  { code: 'ar', name: 'العربية', ko: '아랍어', short: 'AR', html: 'ar', locale: 'ar', deepl: 'AR', google: 'ar', ai: 'Modern Standard Arabic' },
  { code: 'tr', name: 'Türkçe', ko: '튀르키예어', short: 'TR', html: 'tr', locale: 'tr-TR', deepl: 'TR', google: 'tr', ai: 'Turkish' },
];

export const LANG = Object.fromEntries(LANG_LIST.map((l) => [l.code, l]));
// 번역 대상 (한국어 제외)
export const LANGS = LANG_LIST.filter((l) => l.code !== 'ko').map((l) => l.code);
// 기존 설치와 호환: 설정에 값이 없으면 이 언어들은 켜진 것으로 봄
export const DEFAULT_ON = ['en', 'zh', 'ja'];

// 접속 국가 → 언어 (그 언어가 꺼져 있으면 영어, 영어도 꺼져 있으면 한국어)
const C = (codes, lang) => Object.fromEntries(codes.split(' ').map((c) => [c, lang]));
export const COUNTRY_LANG = {
  ...C('KR KP', 'ko'),
  ...C('JP', 'ja'),
  ...C('CN', 'zh'),
  ...C('TW HK MO', 'zh-tw'),
  ...C('VN', 'vi'),
  ...C('TH', 'th'),
  ...C('ID', 'id'),
  ...C('MY BN', 'ms'),
  ...C('PH', 'tl'),
  ...C('IN', 'hi'),
  ...C('MN', 'mn'),
  ...C('RU BY KZ KG TJ', 'ru'),
  ...C('UZ', 'uz'),
  ...C('ES MX AR CO CL PE VE EC GT CU BO DO HN PY SV NI CR PA UY PR GQ', 'es'),
  ...C('BR PT AO MZ CV GW ST TL', 'pt'),
  ...C('FR BE LU MC SN CI CM MG ML BF NE TD GN RW BJ TG CD CG GA HT DJ KM', 'fr'),
  ...C('DE AT CH LI', 'de'),
  ...C('SA AE EG IQ JO KW LB LY MA DZ TN OM QA BH YE SY PS SD MR', 'ar'),
  ...C('TR', 'tr'),
};

export function normCode(v) {
  const s = String(v || '').trim().toLowerCase().replace('_', '-');
  if (LANG[s]) return s;
  if (/^zh-(tw|hk|mo|hant)/.test(s)) return 'zh-tw';
  if (s === 'fil') return 'tl';
  const base = s.split('-')[0];
  return LANG[base] ? base : null;
}

export function enabledLangs(i18n) {
  const s = i18n || {};
  return LANGS.filter((l) => (DEFAULT_ON.includes(l) ? s[l] !== false : s[l] === true));
}

// 'US = en' 형식의 관리자 지정 국가 규칙
export function parseCountryMap(text) {
  const out = {};
  String(text || '').split(/\r?\n|,/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z]{2})\s*[=:→>-]+\s*([A-Za-z-]{2,5})\s*$/);
    if (m) { const code = normCode(m[2]); if (code) out[m[1].toUpperCase()] = code; }
  });
  return out;
}

export function detectMode(i18n) {
  const s = i18n || {};
  if (s.detect === 'geo' || s.detect === 'browser' || s.detect === 'off') return s.detect;
  return s.auto_detect === false ? 'off' : 'geo';
}

// Accept-Language → 켜진 언어 중 첫 일치
function fromAccept(accept, on) {
  const list = String(accept || '').split(',')
    .map((p) => { const [tag, q] = p.trim().split(';q='); return { tag, q: q ? parseFloat(q) : 1 }; })
    .filter((x) => x.tag).sort((a, b) => b.q - a.q);
  for (const { tag } of list) {
    const c = normCode(tag);
    if (c && on.includes(c)) return c;
  }
  return null;
}

/** 접속자의 언어 결정 (국가 → 브라우저 → 영어 → 한국어) */
export function resolveLang({ country, accept, i18n }) {
  const on = ['ko', ...enabledLangs(i18n)];
  const mode = detectMode(i18n);
  if (mode === 'off') return 'ko';
  const cc = String(country || '').toUpperCase();
  if (mode === 'geo' && /^[A-Z]{2}$/.test(cc) && cc !== 'XX') {
    const want = parseCountryMap(i18n?.country_map)[cc] || COUNTRY_LANG[cc];
    if (want && on.includes(want)) return want;
    if (want === 'ko') return 'ko';
    // 국가 언어가 꺼져 있으면: 브라우저 언어 → 영어
    const b = fromAccept(accept, on);
    if (b && b !== 'ko') return b;
    return on.includes('en') ? 'en' : 'ko';
  }
  // 국가를 알 수 없거나 브라우저 모드
  const b = fromAccept(accept, on);
  if (b) return b;
  return /^ko/i.test(String(accept || '')) || !accept || !on.includes('en') ? 'ko' : 'en';
}
