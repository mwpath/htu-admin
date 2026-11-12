import { detectMode } from './i18n/langs';
import { supabasePublic } from './supabase/public';
import { liteHtml, plainText } from './sanitize';
import { loadTranslationMap, applyRows, applySettings, normLang } from './i18n/overlay';
import { enabledLangs } from './i18n/fields';

export function siteOrigin(reqUrl) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  if (env) return env;
  try {
    return new URL(reqUrl).origin;
  } catch {
    return '';
  }
}

const EMPTY = {
  settings: {},
  intro: [],
  heroSlides: [],
  familyGroups: {},
  partners: { rolling: [], fixed: [] },
  publications: [],
  columns: [],
  reel: [],
  gallery: [],
  news: [],
  notices: [],
  popups: [],
  menus: { header: [], footer: [], related: [], sns: [], policy: [] },
  links: {},
};

// 기존 사이트 주소 (비워두면 상대경로 ./ → 섹션이 올라간 사이트 기준)
export function siteBaseOf(site) {
  const u = String(site?.site_url || '').trim().replace(/\/+$/, '');
  return u || '.';
}

function buildMenus(rows) {
  const item = (r) => ({
    label: r.label,
    url: r.link_type === 'none' ? '' : r.url || '',
    external: r.link_type === 'external',
    new_tab: r.link_type === 'external' ? true : !!r.new_tab,
    icon: r.icon || null,
    highlight: !!r.highlight,
  });
  const out = { header: [], footer: [], related: [], sns: [], policy: [] };
  const top = rows.filter((r) => !r.parent_id);
  top.forEach((r) => {
    if (!out[r.location]) return;
    const children = rows.filter((c) => c.parent_id === r.id).map(item);
    out[r.location].push({ ...item(r), children });
  });
  return out;
}

function vimeoId(v) {
  const m = String(v || '').match(/(\d{6,})/);
  return m ? m[1] : null;
}

async function q(builder) {
  const { data, error } = await builder;
  if (error) throw error;
  return data || [];
}

// 섹션들이 바로 쓰는 형태로 가공한 공개 콘텐츠 (RLS: active 만)
export async function getPublicContent(origin = '', langParam = 'ko') {
  const sb = supabasePublic();
  if (!sb) return { ...EMPTY, origin, error: 'SUPABASE_ENV_MISSING' };
  let lang = normLang(langParam);

  try {
    let [menuRows, settingsRows, introRows, slides, groups, sites, partners, pubs, cols, videos, news, popups, noticeRows, eventRows] = await Promise.all([
      q(sb.from('menu_items').select('id,location,parent_id,label,link_type,url,new_tab,icon,highlight').eq('active', true).order('sort')).catch(() => []),
      q(sb.from('site_settings').select('key,value')),
      q(sb.from('intro_slides').select('*').eq('active', true).order('sort')).catch(() => []),
      q(sb.from('hero_slides').select('*').eq('active', true).order('sort')),
      q(sb.from('family_groups').select('*').eq('active', true).order('sort')),
      q(sb.from('family_sites').select('*').eq('active', true).order('sort')),
      q(sb.from('partner_logos').select('*').eq('active', true).order('sort')),
      q(sb.from('publications').select('*').eq('active', true).order('sort')),
      q(sb.from('expert_columns').select('*').eq('active', true).order('sort')),
      q(sb.from('videos').select('id,placement,youtube_url,title,excerpt').eq('active', true).order('sort')),
      q(sb.from('news').select('id,type,title,excerpt,thumbnail_url,external_url,published_at').eq('active', true).order('sort')),
      q(sb.from('popups').select('*').eq('active', true).order('sort')),
      // 메인 공지 · 이벤트 (칸이 아직 없는 DB 에서도 동작하도록 * 로 조회)
      q(sb.from('notices').select('*').eq('active', true).order('pinned', { ascending: false }).order('published_at', { ascending: false }).limit(12)).catch(() => []),
      q(sb.from('events').select('*').eq('active', true).order('sort').limit(30)).catch(() => []),
    ]);

    const rawSettings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value || {}]));
    const langs = enabledLangs(rawSettings.i18n);
    if (!langs.includes(lang)) lang = 'ko';
    const tr = await loadTranslationMap(sb, lang);
    const settings = applySettings(tr, rawSettings);
    settings.i18n = { languages: ['ko', ...langs], detect: detectMode(rawSettings.i18n), translate_pages: rawSettings.i18n?.translate_pages !== false };
    introRows = applyRows(tr, 'intro_slides', introRows);
    slides = applyRows(tr, 'hero_slides', slides);
    groups = applyRows(tr, 'family_groups', groups);
    sites = applyRows(tr, 'family_sites', sites);
    partners = applyRows(tr, 'partner_logos', partners);
    pubs = applyRows(tr, 'publications', pubs);
    cols = applyRows(tr, 'expert_columns', cols);
    videos = applyRows(tr, 'videos', videos);
    news = applyRows(tr, 'news', news);
    noticeRows = applyRows(tr, 'notices', noticeRows);
    eventRows = applyRows(tr, 'events', eventRows);
    popups = applyRows(tr, 'popups', popups);
    menuRows = applyRows(tr, 'menu_items', menuRows);
    const siteBase = siteBaseOf(settings.site);
    const hero = settings.hero || {};
    settings.hero = { ...hero, intro_title_html: liteHtml(hero.intro_title), intro_body_html: liteHtml(hero.intro_body) };
    settings.partners = { ...(settings.partners || {}), title_html: liteHtml(settings.partners?.title) };

    const familyGroups = {};
    groups.forEach((g) => {
      familyGroups[g.key] = {
        eyebrow: g.eyebrow,
        title: g.title,
        desc: g.description,
        toolbarTitle: g.toolbar_title,
        toolbarDesc: g.toolbar_desc,
        note: g.note,
        meta: g.meta || [],
        sites: [],
      };
    });
    sites.forEach((s) => {
      const g = familyGroups[s.group_key];
      if (g) g.sites.push({ badge: s.badge, title: s.title, desc: s.description, urlText: s.url_text, href: s.href, external: s.external });
    });

    const pick = (r, keys) => Object.fromEntries(keys.map((k) => [k, r[k] ?? null]));
    const now = Date.now();

    const intro = introRows
      .map((r) => {
        const type = r.media_type === 'local-video' ? 'local-video' : r.media_type === 'image' ? 'image' : 'video';
        const vimeo_id = type === 'video' ? vimeoId(r.vimeo_url) : null;
        if (type === 'video' && !vimeo_id) return null;
        if (type === 'local-video' && !r.video_url) return null;
        if (type === 'image' && !r.poster_url) return null;
        return { type, eyebrow: r.eyebrow, title_html: liteHtml(r.title), video_url: r.video_url, vimeo_id, poster_url: r.poster_url };
      })
      .filter(Boolean);

    return {
      origin,
      lang,
      settings,
      menus: buildMenus(menuRows),
      intro,
      heroSlides: slides.map((s) => ({
        image_url: s.image_url,
        title_html: liteHtml(s.title),
        title_text: plainText(s.title),
        body_html: liteHtml(s.body),
        link_label: s.link_label,
        link_url: s.link_url,
        link_new_tab: s.link_new_tab,
        family_key: s.family_key && familyGroups[s.family_key] ? s.family_key : null,
        family_label: s.family_label,
      })),
      familyGroups,
      partners: {
        rolling: partners.filter((p) => p.kind === 'rolling').map((p) => pick(p, ['logo_url', 'alt', 'name'])),
        fixed: partners
          .filter((p) => p.kind === 'fixed')
          .map((p) => pick(p, ['logo_url', 'alt', 'action', 'name', 'sub', 'headline', 'description', 'hero_url', 'homepage_url', 'button_label'])),
      },
      publications: pubs.map((p) =>
        pick(p, ['cover_url', 'caption', 'image_border', 'action', 'link_url', 'popup_title', 'popup_desc', 'button_label'])
      ),
      columns: cols.map((c) => pick(c, ['image_url', 'title', 'card_title', 'subtitle', 'pdf_url'])),
      reel: videos.filter((v) => v.placement === 'reel').map((v) => ({ youtube_url: v.youtube_url })),
      gallery: videos.filter((v) => v.placement === 'gallery').map((v) => pick(v, ['youtube_url', 'title', 'excerpt'])),
      news: (() => {
        const list = news
          .filter((n) => n.type === 'internal' || n.external_url)
          .map((n) => ({
            type: n.type,
            title: n.title,
            excerpt: n.excerpt,
            img: n.thumbnail_url,
            link: n.type === 'internal' ? (n.seo_path ? `${siteBase}/${n.seo_path}` : `${siteBase}/news.html?id=${n.id}`) : n.external_url,
            target: n.type === 'internal' ? '_self' : '_blank',
            date: n.published_at,
          }));
        if (settings.news?.include_events === false || !eventRows.length) return list;
        const ev = eventRows
          .filter((e) => e.link_type !== 'external' || e.external_url)
          .map((e) => ({
            type: 'event',
            title: e.title,
            excerpt: e.summary || [e.start_date && `📅 ${e.start_date}${e.end_date && e.end_date !== e.start_date ? ' ~ ' + e.end_date : ''}`, e.location && `📍 ${e.location}`].filter(Boolean).join('  '),
            img: e.thumbnail_url,
            link: e.link_type === 'external' ? e.external_url : e.seo_path ? `${siteBase}/${e.seo_path}` : `${siteBase}/event.html?id=${e.id}`,
            target: e.link_type === 'external' ? '_blank' : '_self',
            date: e.published_at,
          }));
        return [...list, ...ev].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      })(),
      notices: noticeRows.slice(0, Math.max(1, Math.min(12, Number(settings.notices_main?.count) || 5))).map((n) => ({
        title: n.title,
        pinned: !!n.pinned,
        date: n.published_at,
        img: n.thumbnail_url || null,
        link: n.seo_path ? `${siteBase}/${n.seo_path}` : `${siteBase}/notice.html?id=${n.id}`,
        isNew: Date.now() - new Date(n.published_at).getTime() < 7 * 864e5,
      })),
      popups: popups
        .filter((p) => (!p.starts_at || new Date(p.starts_at).getTime() <= now + 60_000) && (!p.ends_at || new Date(p.ends_at).getTime() >= now))
        .map((p) => ({ ...pick(p, ['id', 'title', 'image_url', 'link_url', 'link_label', 'link_new_tab', 'starts_at', 'ends_at']), body_html: liteHtml(p.body) })),
      links: { notice: `${siteBase}/notice.html`, news: `${siteBase}/news.html`, event: `${siteBase}/event.html`, home: `${siteBase}/` },
    };
  } catch (e) {
    console.error('[cms] getPublicContent failed', e?.message || e);
    return { ...EMPTY, origin, error: 'FETCH_FAILED' };
  }
}
