// 홈페이지 ( / ) : sections/*.html 템플릿 + 서버에서 CMS 데이터 주입
import HOME_TEMPLATE from '@/generated/home-template';
import { getPublicContent, siteOrigin } from '@/lib/content';

const escAttr = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export async function GET(request) {
  const origin = siteOrigin(request.url);
  const data = await getPublicContent(origin);
  const site = data.settings?.site || {};

  const html = HOME_TEMPLATE
    .replace('<!--HTU_CMS_DATA-->', () => `<script>window.__HTU_CMS_DATA__=${safeJson(data)};</script>`)
    .replace('<!--HTU_TITLE-->', () => escAttr(site.name || 'HTU'))
    .replace('<!--HTU_DESC-->', () => escAttr(site.meta_description || ''));

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=30, stale-while-revalidate=300',
    },
  });
}
