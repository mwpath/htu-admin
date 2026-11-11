// 연동 키 (번역 API 키 등) — 관리자 화면 '연동 설정'에서 저장하고 Supabase(app_secrets)에 보관합니다.
// 서버 키로만 읽을 수 있으며, 예전 방식의 Vercel 환경변수가 있으면 그것도 인식합니다.
import { supabaseService } from './supabase/service';

let cache = null;
let cachedAt = 0;
const TTL = 30_000;

export function clearSecretsCache() { cache = null; cachedAt = 0; }

export async function getSecrets({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL) return cache;
  const out = {};
  const sb = supabaseService();
  if (sb) {
    try {
      const { data, error } = await sb.from('app_secrets').select('key, value');
      if (!error) (data || []).forEach((r) => (out[r.key] = r.value));
    } catch { /* 테이블이 아직 없으면 무시 */ }
  }
  const envFallback = {
    translate_provider: process.env.TRANSLATE_PROVIDER,
    translate_model: process.env.TRANSLATE_MODEL,
    anthropic_api_key: process.env.ANTHROPIC_API_KEY,
    deepl_api_key: process.env.DEEPL_API_KEY,
    google_api_key: process.env.GOOGLE_TRANSLATE_API_KEY,
  };
  for (const [k, v] of Object.entries(envFallback)) if (!out[k] && v) out[k] = v;
  cache = out;
  cachedAt = Date.now();
  return out;
}
