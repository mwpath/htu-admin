// GitHub 저장소 연결 테스트 (대표 관리자)
import { requireOwner } from '@/lib/admin-auth';
import { clearSecretsCache } from '@/lib/secrets';
import { getGithubConfig, testGithub } from '@/lib/media/github';
export const dynamic = 'force-dynamic';
export async function POST() {
  if (!(await requireOwner())) return Response.json({ error: '대표 관리자만 사용할 수 있습니다.' }, { status: 403 });
  clearSecretsCache();
  return Response.json(await testGithub(await getGithubConfig({ fresh: true })));
}
