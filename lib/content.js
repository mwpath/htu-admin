import { supabasePublic } from './supabase/public';
import { liteHtml, plainText } from './sanitize';

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
  heroSlides: [],
  familyGroups: {},
  partners: { rolling: [], fixed: [] },
  publications: [],
  columns: [],
  reel: [],
  gallery: [],
  news: [],
  popups: [],
  links: {},
};

async function q(builder) {
  const { data, error } = await builder;
  if (error) throw error;
  return data || [];
}

// 섹션들이 바로 쓰는 형태로 가공한 공개 콘텐츠 (RLS: active 만)
export async function getPublicContent(origin = '') {
  const sb = supabasePublic();
  if (!sb) return { ...EMPTY, origin, error: 'SUPABASE_ENV_MISSING' };

  try {
    const [settingsRows, slides, groups, sites, partners, pubs, cols, videos, news, popups] = await Promise.all([
      q(sb.from('site_settings').select('key,value')),
      q(sb.from('hero_slides').select('*').eq('active', true).order('sort')),
      q(sb.from('family_groups').select('*').eq('active', true).order('sort')),
      q(sb.from('family_sites').select('*').eq('active', true).order('sort')),
      q(sb.from('partner_logos').select('*').eq('active', true).order('sort')),
      q(sb.from('publications').select('*').eq('active', true).order('sort')),
      q(sb.from('expert_columns').select('*').eq('active', true).order('sort')),
      q(sb.from('videos').select('id,placement,youtube_url,title,excerpt').eq('active', true).order('sort')),
      q(sb.from('news').select('id,type,title,excerpt,thumbnail_url,external_url,published_at').eq('active', true).order('sort')),
      q(sb.from('popups').select('*').eq('active', true).order('sort')),
    ]);

    const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value || {}]));
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

    return {
      origin,
      settings,
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
      news: news
        .filter((n) => n.type === 'internal' || n.external_url)
        .map((n) => ({
          type: n.type,
          title: n.title,
          excerpt: n.excerpt,
          img: n.thumbnail_url,
          link: n.type === 'internal' ? `${origin}/news/${n.id}` : n.external_url,
          target: n.type === 'internal' ? '_self' : '_blank',
          date: n.published_at,
        })),
      popups: popups
        .filter((p) => (!p.starts_at || new Date(p.starts_at).getTime() <= now + 60_000) && (!p.ends_at || new Date(p.ends_at).getTime() >= now))
        .map((p) => ({ ...pick(p, ['id', 'title', 'image_url', 'link_url', 'link_label', 'link_new_tab', 'starts_at', 'ends_at']), body_html: liteHtml(p.body) })),
      links: { notice: `${origin}/notice`, home: `${origin}/` },
    };
  } catch (e) {
    console.error('[cms] getPublicContent failed', e?.message || e);
    return { ...EMPTY, origin, error: 'FETCH_FAILED' };
  }
}

export async function getSiteSettings() {
  const sb = supabasePublic();
  if (!sb) return {};
  const { data } = await sb.from('site_settings').select('value').eq('key', 'site').maybeSingle();
  return data?.value || {};
}
