// 연동 설정 (대표 관리자) — 연결 상태 확인 · 번역 엔진 연결 테스트
import { requireOwner } from '@/lib/admin-auth';
import { getSetupState } from '@/lib/setup/state';
import { clearSecretsCache } from '@/lib/secrets';
import { getTranslateConfig, providerInfo, translateBatch } from '@/lib/i18n/translate';

export const dynamic = 'force-dynamic';

export async function GET() {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: '대표 관리자만 볼 수 있습니다.' }, { status: 403 });
  const [state, secrets] = await Promise.all([getSetupState(), owner.sb.rpc('app_secret_status')]);
  clearSecretsCache();
  const cfg = await getTranslateConfig({ fresh: true });
  return Response.json({ state, secrets: secrets.data || [], translate: providerInfo(cfg) });
}

// 번역 연결 테스트: '안녕하세요' → 영어
export async function POST() {
  const owner = await requireOwner();
  if (!owner) return Response.json({ error: '대표 관리자만 사용할 수 있습니다.' }, { status: 403 });
  clearSecretsCache();
  try {
    const cfg = await getTranslateConfig({ fresh: true });
    if (!cfg.configured) return Response.json({ ok: false, error: '선택한 번역 엔진의 API 키가 없습니다.' });
    const [en] = await translateBatch([{ text: '안녕하세요. 건강한 아름다움, 새로운 기회의 시작', html: false }], 'en', { cfg });
    return Response.json({ ok: true, provider: cfg.provider, result: en });
  } catch (e) {
    return Response.json({ ok: false, error: String(e.message || e).slice(0, 400) });
  }
}
