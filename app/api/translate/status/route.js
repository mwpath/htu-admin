// 번역 현황 (관리자)
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { providerInfo } from '@/lib/i18n/translate';
import { collectUnits, loadExisting, keyOf } from '@/lib/i18n/sync';
import { enabledLangs } from '@/lib/i18n/fields';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const sb = supabaseService() || admin;
  const { data: i18n } = await sb.from('site_settings').select('value').eq('key', 'i18n').maybeSingle();
  const langs = enabledLangs(i18n?.value);
  let units = [], existing = [], memory = 0, tableMissing = false;
  try {
    units = await collectUnits(sb);
    existing = await loadExisting(sb);
    const { count } = await sb.from('text_memory').select('id', { count: 'exact', head: true });
    memory = count || 0;
  } catch (e) {
    tableMissing = /translations|text_memory/.test(String(e.message || e));
  }
  const ex = new Map(existing.map((e) => [`${keyOf(e)}:${e.lang}`, e]));
  const stats = langs.map((lang) => {
    let done = 0, missing = 0, stale = 0, review = 0, manual = 0;
    units.forEach((u) => {
      const e = ex.get(`${keyOf(u)}:${lang}`);
      if (!e) missing++;
      else if (e.source_hash === u.hash) { done++; if (e.status === 'manual') manual++; }
      else if (e.locked) review++;
      else stale++;
    });
    return { lang, done, missing, stale, review, manual };
  });
  return Response.json({
    ...providerInfo(),
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cron: !!process.env.CRON_SECRET,
    langs, units: units.length, memory, stats, tableMissing,
  });
}
