// 사이트 상태 점검 (직원 누구나) — 실제 사이트가 내보내는 파일 버전 · 관리자 주소 · 메뉴 데이터
import { requireAdmin } from '@/lib/admin-auth';
import { getPublicContent, siteOrigin } from '@/lib/content';
import { checkSite } from '@/lib/site/check';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export async function GET(request) {
  if (!(await requireAdmin())) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  const origin = new URL(request.url).origin;
  const content = await getPublicContent(siteOrigin(request.url));
  const siteBase = String(content.settings?.site?.site_url || 'https://htuglobal.com').replace(/\/+$/, '');
  return Response.json({ site: siteBase, endpoint: origin, ...(await checkSite(siteBase, origin, content.menus)) });
}
