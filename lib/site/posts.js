// 공지 · 이벤트 · 뉴스 → 검색엔진(구글 · 네이버)용 정적 페이지 + sitemap.xml + robots.txt
// 사이트(GitHub Pages)는 자바스크립트로 글을 그리기 때문에 네이버 등 일부 검색엔진이 본문을 못 읽습니다.
// 그래서 글마다 본문과 메타 태그가 HTML 에 직접 들어간 페이지(posts/notice-<id>.html)를 만들어 올립니다.
import SITE_FILES from '@/generated/site-files';
import { richHtml } from '../sanitize';
import { finalSeo, htmlToText } from '../seo';
import { listDir, readText, commitChanges, renderSiteFiles } from './deploy';

export const KINDS = {
  notice: { table: 'notices', page: 'notice.html', eyebrow: 'Notice', label: '공지사항', schema: 'Article' },
  event: { table: 'events', page: 'event.html', eyebrow: 'Event', label: '이벤트', schema: 'Event' },
  news: { table: 'news', page: 'news.html', eyebrow: 'News &amp; Event', label: 'News & Event', schema: 'NewsArticle' },
};
export const postPath = (kind, id) => `posts/${kind}-${id}.html`;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (base, u) => {
  if (!u) return '';
  try { return new URL(u, base + '/').href; } catch { return ''; }
};
const ymd = (d) => { const t = new Date(d); return isNaN(t) ? '' : t.toISOString().slice(0, 10); };
const longDate = (d) => {
  const t = new Date(d);
  return isNaN(t) ? '' : t.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
};
const shortDate = (v) => { if (!v) return ''; const [y, m, d] = String(v).slice(0, 10).split('-'); return `${y}. ${m}. ${d}.`; };

function eventStatus(e) {
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })); today.setHours(0, 0, 0, 0);
  const day = (v) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00`) : null);
  const s0 = day(e.start_date), s1 = day(e.end_date) || s0;
  if (s0 && today < s0) return { key: 'soon', label: '예정' };
  if (s1 && today > s1) return { key: 'end', label: '종료' };
  return { key: 'on', label: '진행중' };
}

const FILE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5 12.6 21a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8"/></svg>';

/** 게시판 화면(board.html)과 같은 모양의 본문을 미리 그림 */
function articleHtml(kind, r) {
  const K = KINDS[kind];
  let extra = '';
  if (kind === 'event') {
    const st = eventStatus(r);
    const a = shortDate(r.start_date), b = shortDate(r.end_date);
    const period = a && b && a !== b ? `${a} ~ ${b}` : a || b;
    extra = `<dl class="hb-evinfo"><dt>상태</dt><dd>${st.label}</dd>${period ? `<dt>기간</dt><dd>${period}</dd>` : ''}${r.location ? `<dt>장소</dt><dd>${esc(r.location)}</dd>` : ''}</dl>`
      + (r.apply_url ? `<a class="hb-apply${st.key === 'end' ? ' is-disabled' : ''}" href="${esc(r.apply_url)}" target="_blank" rel="noopener noreferrer">${st.key === 'end' ? '마감되었습니다' : `${esc(r.apply_label || '신청하기')} ↗`}</a>` : '');
  }
  const lead = r.excerpt || r.summary;
  const files = (r.attachments || []).filter((f) => f && f.url);
  return `<article class="hb-narrow">`
    + `<nav class="hb-crumb" aria-label="위치"><a href="./index.html">홈</a> › <a href="${K.page}">${esc(K.label)}</a></nav>`
    + `<p class="hb-eyebrow">${K.eyebrow}</p>`
    + `<h1 class="hb-h1">${esc(r.title)}</h1>`
    + `<div class="hb-meta"><time datetime="${esc(r.published_at)}">${longDate(r.published_at)}</time></div>`
    + (lead ? `<p class="hb-lead">${esc(lead)}</p>` : '')
    + extra
    + (r.thumbnail_url ? `<img class="hb-cover" src="${esc(r.thumbnail_url)}" alt="${esc(r.title)}">` : '')
    + `<div class="hb-content">${richHtml(r.content_html || '')}</div>`
    + (files.length ? `<div class="hb-files"><h4>첨부파일</h4><ul>${files.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener" download>${FILE_ICO}${esc(f.name || '파일')}</a></li>`).join('')}</ul></div>` : '')
    + `<div class="hb-actions"><a class="hb-btn" href="${K.page}">← 목록으로</a></div>`
    + `</article>`;
}

function jsonLd(kind, r, ctx, meta, url, image) {
  const org = { '@type': 'Organization', name: ctx.siteName, url: ctx.siteBase + '/' };
  let data;
  if (kind === 'event') {
    data = {
      '@context': 'https://schema.org', '@type': 'Event', name: r.title, description: meta.description, url,
      ...(image ? { image: [image] } : {}),
      ...(r.start_date ? { startDate: String(r.start_date).slice(0, 10) } : {}),
      ...(r.end_date || r.start_date ? { endDate: String(r.end_date || r.start_date).slice(0, 10) } : {}),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: /온라인|online|zoom|웨비나/i.test(r.location || '') ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
      ...(r.location ? { location: /온라인|online/i.test(r.location) ? { '@type': 'VirtualLocation', url } : { '@type': 'Place', name: r.location, address: r.location } } : {}),
      organizer: org,
      ...(r.apply_url ? { offers: { '@type': 'Offer', url: r.apply_url, availability: 'https://schema.org/InStock' } } : {}),
    };
  } else {
    data = {
      '@context': 'https://schema.org', '@type': KINDS[kind].schema, headline: String(r.title || '').slice(0, 110), description: meta.description,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url }, url,
      ...(image ? { image: [image] } : {}),
      datePublished: r.published_at, dateModified: r.updated_at || r.published_at,
      author: org, publisher: { ...org, ...(ctx.logo ? { logo: { '@type': 'ImageObject', url: ctx.logo } } : {}) },
      keywords: meta.keywords, inLanguage: 'ko-KR',
    };
  }
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: ctx.siteBase + '/' },
      { '@type': 'ListItem', position: 2, name: KINDS[kind].label, item: `${ctx.siteBase}/${KINDS[kind].page}` },
      { '@type': 'ListItem', position: 3, name: r.title, item: url },
    ],
  };
  const j = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${j(data)}</script>\n  <script type="application/ld+json">${j(crumbs)}</script>`;
}

/** 글 1개의 정적 페이지 */
export function buildPostPage(kind, r, ctx) {
  const K = KINDS[kind];
  const path = postPath(kind, r.id);
  const url = `${ctx.siteBase}/${path}`;
  const meta = finalSeo(r, kind, ctx.siteName);
  const image = abs(ctx.siteBase, r.thumbnail_url) || ctx.defaultImage || '';
  const title = `${meta.title} | ${ctx.siteName}`;
  let html = SITE_FILES[K.page];

  // 1) 하위 폴더(posts/)에서도 ./menu3.js · ./img/… 가 사이트 루트를 가리키도록
  html = /<meta charset[^>]*>/i.test(html)
    ? html.replace(/<meta charset[^>]*>/i, (m) => `${m}\n  <base href="../">`)
    : html.replace(/<head>/i, '<head>\n  <meta charset="UTF-8" />\n  <base href="../">');
  // 2) 게시판 기본 메타 제거 → 글 전용 메타
  html = html
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+(name|property)="(description|keywords|title|subject|robots|og:[\w:]+|twitter:[\w:]+|article:[\w:]+)"[^>]*>/gi, '')
    .replace(/\s*<link rel="canonical"[^>]*>/gi, '');
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="keywords" content="${esc(meta.keywords)}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${esc(ctx.siteName)}" />`,
    `<meta property="og:locale" content="ko_KR" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    image ? `<meta property="og:image:alt" content="${esc(r.title)}" />` : '',
    `<meta property="article:published_time" content="${esc(r.published_at)}" />`,
    r.updated_at ? `<meta property="article:modified_time" content="${esc(r.updated_at)}" />` : '',
    `<meta property="article:section" content="${esc(K.label)}" />`,
    ...String(meta.keywords).split(',').map((k) => k.trim()).filter(Boolean).slice(0, 6).map((k) => `<meta property="article:tag" content="${esc(k)}" />`),
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
    jsonLd(kind, r, ctx, meta, url, image),
  ].filter(Boolean).join('\n  ');
  html = html.replace(/<base href="\.\.\/">/, `<base href="../">\n  ${tags}`);
  // 3) 본문을 미리 그려 넣음 (자바스크립트 없이도 검색엔진이 읽음)
  html = html
    .replace(`data-mode="${kind}"`, `data-mode="${kind}" data-id="${esc(r.id)}"`)
    .replace('<div class="hb-root"><div class="hb-loading">불러오는 중…</div></div>', `<div class="hb-root">${articleHtml(kind, r)}</div>`);
  return { path, html, url, meta };
}

export function buildSitemap(ctx, rootPages, posts) {
  const now = new Date().toISOString().slice(0, 10);
  const prio = (p) => (p === '' ? '1.0' : /^(notice|event|news)\.html$/.test(p) ? '0.8' : '0.7');
  const urls = [
    ...rootPages.map((p) => `  <url><loc>${esc(`${ctx.siteBase}/${p}`)}</loc><lastmod>${now}</lastmod><changefreq>${p === '' || /^(notice|event|news)\.html$/.test(p) ? 'daily' : 'monthly'}</changefreq><priority>${prio(p)}</priority></url>`),
    ...posts.map((x) => `  <url><loc>${esc(x.url)}</loc><lastmod>${ymd(x.row.updated_at || x.row.published_at) || now}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority>${x.image ? `<image:image><image:loc>${esc(x.image)}</image:loc></image:image>` : ''}</url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
}

/** DB 에서 공개 글을 모두 읽어 옴 */
export async function loadPosts(sb) {
  const get = async (table, filter) => {
    let q = sb.from(table).select('*').eq('active', true);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    return data || [];
  };
  const [notices, events, news, settings] = await Promise.all([
    get('notices'),
    get('events', (q) => q.neq('link_type', 'external')),
    get('news', (q) => q.eq('type', 'internal')),
    sb.from('site_settings').select('key,value').in('key', ['site', 'header']).then((r) => Object.fromEntries((r.data || []).map((x) => [x.key, x.value || {}]))),
  ]);
  return { notices, events, news, settings };
}

/**
 * 정적 페이지 · sitemap · robots 를 만들어 한 번에 커밋하고 DB 에 seo_path 기록
 */
export async function publishPosts({ sb, cfg, targets, endpoint, snapshot }) {
  const { notices, events, news, settings } = await loadPosts(sb);
  const siteBase = String(settings.site?.site_url || 'https://htuglobal.com').trim().replace(/\/+$/, '');
  const ctx = {
    siteBase,
    siteName: settings.site?.name || 'HTU GLOBAL',
    logo: abs(siteBase, settings.header?.logo_url || settings.header?.logo_light_url),
    defaultImage: (String(SITE_FILES['index.html']).match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '',
  };
  const built = [];
  for (const [kind, rows] of [['notice', notices], ['event', events], ['news', news]]) {
    for (const r of rows) {
      const page = buildPostPage(kind, r, ctx);
      built.push({ kind, row: r, ...page, image: abs(siteBase, r.thumbnail_url) });
    }
  }
  const want = new Set(built.map((b) => b.path));
  const results = [];
  for (const t of targets) {
    const prefix = t.dir ? t.dir + '/' : '';
    const root = await listDir(cfg, t.branch, t.dir);
    const existingPosts = (await listDir(cfg, t.branch, prefix + 'posts')).filter((f) => f.type === 'file').map((f) => 'posts/' + f.name);
    const rootPages = root
      .filter((f) => f.type === 'file' && /\.html$/i.test(f.name) && !/copy|^google|^naver|^404|^sections\.html$|^test/i.test(f.name))
      .map((f) => (f.name === 'index.html' ? '' : f.name))
      .sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
    if (!rootPages.includes('')) rootPages.unshift('');
    const changes = Object.fromEntries(built.map((b) => [b.path, b.html]));
    changes['sitemap.xml'] = buildSitemap(ctx, rootPages, built);
    const robots = root.some((f) => f.name === 'robots.txt') ? await readText(cfg, t.branch, prefix + 'robots.txt') : null;
    const smLine = `Sitemap: ${siteBase}/sitemap.xml`;
    if (!robots) changes['robots.txt'] = `User-agent: *\nAllow: /\n\n${smLine}\n`;
    else if (!robots.includes(smLine)) changes['robots.txt'] = robots.replace(/^Sitemap:.*$/gim, '').trimEnd() + `\n\n${smLine}\n`;
    // 홈페이지 내장 콘텐츠 갱신 (이미 관리자 연동판인 경우에만)
    if (endpoint && snapshot && root.some((f) => f.name === 'index.html')) {
      const cur = await readText(cfg, t.branch, prefix + 'index.html');
      if (cur && /htu-cms-config|HTU_CMS_ENDPOINT/.test(cur)) {
        const site = renderSiteFiles(endpoint, snapshot);
        changes['index.html'] = site['index.html'];
        changes['js/htu-cms-data.js'] = site['js/htu-cms-data.js'];
      }
    }
    const deletes = existingPosts.filter((p) => /^posts\/(notice|event|news)-[\w-]+\.html$/.test(p) && !want.has(p));
    const r = await commitChanges(cfg, t, changes, deletes, `HTU CMS 검색엔진 페이지 발행 (${built.length}개 글)`);
    results.push({ ...r, removed: deletes.length });
  }
  // DB 에 정적 페이지 주소 기록 (목록 · 메인에서 이 주소로 연결)
  const updates = [];
  for (const b of built) if (b.row.seo_path !== b.path) updates.push(sb.from(KINDS[b.kind].table).update({ seo_path: b.path }).eq('id', b.row.id));
  for (const [kind, table] of [['notice', 'notices'], ['event', 'events'], ['news', 'news']]) {
    updates.push(sb.from(table).update({ seo_path: null }).not('seo_path', 'is', null).or(`active.eq.false${kind === 'event' ? ',link_type.eq.external' : kind === 'news' ? ',type.eq.external' : ''}`));
  }
  await Promise.all(updates);
  return { pages: built.length, results, changed: results.some((x) => !x.upToDate), sample: built[0]?.url || null, words: built.reduce((n, b) => n + htmlToText(b.row.content_html).length, 0) };
}
