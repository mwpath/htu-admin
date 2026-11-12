// 관리자 전용: 기존 사이트에 올릴 파일 다운로드 (연결 주소 자동 입력)
import SITE_FILES from '@/generated/site-files';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveEndpoint } from '@/lib/site/endpoint';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('로그인이 필요합니다.', { status: 401 });

  const name = params.file;
  const tpl = SITE_FILES[name];
  if (!tpl) return new Response('Not found', { status: 404 });

  const origin = await resolveEndpoint(request.url);
  const body = tpl.split('__HTU_CMS_ENDPOINT__').join(origin);
  const inline = new URL(request.url).searchParams.get('view') === '1';

  return new Response(body, {
    headers: {
      'content-type': inline ? 'text/plain; charset=utf-8' : name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
      'content-disposition': inline ? 'inline' : `attachment; filename="${name}"`,
      'cache-control': 'no-store',
    },
  });
}
