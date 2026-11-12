// 검색엔진(구글 · 네이버) 메타 자동 생성 — 관리자 화면과 서버(정적 페이지 발행) 양쪽에서 사용
// 제목 · 요약 · 본문에서 핵심 단어를 뽑아 title / description / keywords 를 만듭니다.

const SITE_KEYWORDS = ['HTU GLOBAL', 'HTU 글로벌', '에이치티유 글로벌'];
const KIND_WORDS = { notice: ['공지사항', '안내'], event: ['이벤트', '행사'], news: ['소식', '뉴스'] };

// 조사 · 어미 (긴 것부터 떼어냄)
const JOSA = ['으로부터', '에서부터', '이라고', '이라는', '에게서', '께서는', '까지는', '부터는', '에서는', '으로는', '이지만', '입니다', '합니다', '했습니다',
  '됩니다', '있습니다', '에서', '에게', '으로', '이나', '이며', '이고', '하고', '하는', '하며', '했다', '한다', '까지', '부터', '보다', '처럼', '만큼', '께서',
  '이다', '에는', '와는', '과는', '로는', '은', '는', '을', '를', '의', '에'];
// 단어 끝 글자와 헷갈리기 쉬운 조사는 4글자 이상일 때만 뗌 (세미나 · 포도 · 아이 보호)
const JOSA_LONG = ['이', '가', '와', '과', '도', '로', '만'];
const STOP = new Set(['그리고', '그러나', '하지만', '또한', '및', '등', '이번', '해당', '관련', '통해', '위해', '대한', '대해', '경우', '때문', '이상', '이하',
  '모든', '각종', '여러', '다양한', '있는', '없는', '되는', '하는', '있다', '없다', '것', '수', '더', '안내드립니다', '바랍니다', '감사합니다', '드립니다',
  '진행', '예정', '참고', '확인', '부탁', '많은', '관심', '참여', '오늘', '내일', '함께', '오는', '분들', '위한', 'htu', 'global', 'the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'you']);

export function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ').replace(/<\/?(p|h\d|li|ul|ol|div|blockquote|tr|td|th|table|figure|figcaption|pre|hr)\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function stem(w) {
  if (/^[a-z0-9]/i.test(w)) return w.toLowerCase();
  for (const j of JOSA) if (w.length > j.length + 1 && w.endsWith(j)) return w.slice(0, -j.length);
  for (const j of JOSA_LONG) if (w.length >= 4 && w.endsWith(j)) return w.slice(0, -1);
  return w;
}

function words(text) {
  return (String(text || '').match(/[가-힣A-Za-z0-9][가-힣A-Za-z0-9&+·.-]*/g) || [])
    .map((w) => w.replace(/[.·-]+$/, ''))
    .map(stem)
    .filter((w) => w && (/[가-힣]/.test(w) ? w.length >= 2 : w.length >= 3) && !STOP.has(w) && !/^\d+$/.test(w)
      && !/(니다|습니까|었다|였다|했다|한다|된다|된|하세요|세요|바랍|겠습|해요|어요|아요|입니|드려|드립)$/.test(w));
}

/** 핵심 키워드 추출 — 제목 가중치 3, 요약 2, 본문 1, 두 단어 묶음도 후보 */
export function extractKeywords({ title = '', summary = '', text = '' }, max = 10) {
  const score = new Map();
  const add = (w, n) => score.set(w, (score.get(w) || 0) + n);
  const feed = (t, weight) => {
    const ws = words(t);
    ws.forEach((w) => add(w, weight));
    for (let i = 0; i < ws.length - 1; i++) if (/[가-힣]/.test(ws[i]) && /[가-힣]/.test(ws[i + 1])) add(ws[i] + ' ' + ws[i + 1], weight * 0.6);
  };
  feed(title, 3); feed(summary, 2); feed(text.slice(0, 4000), 1);
  // 두 단어 묶음이 한 번뿐이면 제외, 묶음에 포함된 단어가 같은 점수면 묶음 우선
  return [...score.entries()]
    .filter(([w, s]) => !w.includes(' ') || s >= 2.4)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([w]) => w)
    .filter((w, i, arr) => arr.findIndex((x) => x === w || (x.includes(' ') && x.split(' ').includes(w) && arr.indexOf(x) < i)) === i)
    .slice(0, max);
}

function cut(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  if (s.length <= n) return s;
  const c = s.slice(0, n - 1);
  const sp = c.lastIndexOf(' ');
  return (sp > n * 0.6 ? c.slice(0, sp) : c).replace(/[,.·\s]+$/, '') + '…';
}

/**
 * 메타 자동 생성
 * @param {{ kind: 'notice'|'event'|'news', title, summary?, html?, location?, date?, siteName? }} p
 */
export function suggestSeo(p) {
  const siteName = p.siteName || 'HTU GLOBAL';
  const text = htmlToText(p.html);
  // 설명문은 표 · 이모지를 빼고 본문 문장 위주로
  const bodyText = htmlToText(String(p.html || '').replace(/<table[\s\S]*?<\/table>/gi, ' ')).replace(/\p{Extended_Pictographic}|\uFE0F/gu, '').replace(/\s+/g, ' ').trim();
  const kws = extractKeywords({ title: p.title, summary: p.summary, text }, 8);
  const kindWord = { notice: '공지사항', event: '이벤트', news: '소식' }[p.kind] || '';
  const title = cut(`${p.title || ''}${kindWord && !String(p.title || '').includes(kindWord) ? ` - ${kindWord}` : ''}`, 48);
  let desc = p.summary ? String(p.summary) : bodyText;
  if (p.kind === 'event' && (p.date || p.location)) desc = [p.date && `일정 ${p.date}`, p.location && `장소 ${p.location}`].filter(Boolean).join(' · ') + '. ' + desc;
  if (!desc) desc = `${siteName} ${kindWord} — ${p.title || ''}`;
  const description = cut(desc, 150);
  const keywords = [...new Set([...kws, ...(KIND_WORDS[p.kind] || []), ...SITE_KEYWORDS])].slice(0, 14).join(', ');
  return { title, description, keywords };
}

/** 입력값이 비어 있으면 자동값으로 채운 최종 메타 */
export function finalSeo(row, kind, siteName) {
  const auto = suggestSeo({
    kind, siteName, title: row.title, summary: row.summary || row.excerpt, html: row.content_html, location: row.location,
    date: [row.start_date, row.end_date && row.end_date !== row.start_date ? row.end_date : ''].filter(Boolean).join(' ~ '),
  });
  return {
    title: (row.seo_title || '').trim() || auto.title,
    description: (row.seo_description || '').trim() || auto.description,
    keywords: (row.seo_keywords || '').trim() || auto.keywords,
  };
}
