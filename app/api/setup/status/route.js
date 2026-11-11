// 설치 상태 (처음 설정 화면) — 연결 여부 · 설치 여부만 알려주며 비밀 값은 포함하지 않습니다.
import { getSetupState } from '@/lib/setup/state';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(await getSetupState(), { headers: { 'Cache-Control': 'no-store' } });
}
