import { normLang } from '@/lib/i18n/overlay';
// 번역 확인 · 수정 · 다시 번역 (관리자)
import { revalidateTag, revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { supabaseService } from '@/lib/supabase/service';
import { collectUnits, translateUnits, hashOf } from '@/lib/i18n/sync';
import { translateBatch } from '@/lib/i18n/translate';
import { CMS_TAG } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TITLE_FIELDS = ['title', 'label', 'name', 'caption', 'card_title', 'eyebrow', 'intro_title', 'slogan'];

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const sb = supabaseService() || admin;
  const sp = new URL(request.url).searchParams;
  const table = sp.get('table') || 'settings';
  const lang = normLang(sp.get('lang') || 'en');
  if (lang === 'ko') return Response.json({ items: [] });

  if (table === 'page') {
    const { data } = await sb.from('text_memory').select('id,source,value,status,locked,last_path,updated_at').eq('lang', lang).order('updated_at', { ascending: false }).limit(500);
    return Response.json({ items: (data || []).map((r) => ({ key: r.id, title: r.last_path || '', fields: [{ field: 'text', type: 'text', source: r.source, value: r.value, status: r.status, locked: r.locked, stale: false, memoryId: r.id }] })) });
  }

  const units = (await collectUnits(sb)).filter((u) => u.table === table);
  const ids = [...new Set(units.map((u) => u.id))];
  const tr = new Map();
  for (let i = 0; i < ids.length; i += 150) {
    const { data } = await sb.from('translations').select('source_id,field,value,source_hash,status,locked').eq('source_table', table).eq('lang', lang).in('source_id', ids.slice(i, i + 150));
    (data || []).forEach((t) => tr.set(`${t.source_id}:${t.field}`, t));
  }
  const items = ids.map((id) => {
    const us = units.filter((u) => u.id === id);
    const t = us.find((u) => TITLE_FIELDS.includes(u.field)) || us[0];
    return {
      key: id,
      title: table === 'settings' ? id : String(Array.isArray(t.source) ? t.source.join(', ') : t.source).replace(/<[^>]+>/g, ' ').slice(0, 80),
      fields: us.map((u) => {
        const e = tr.get(`${id}:${u.field}`);
        return { id, field: u.field, type: u.type, source: u.source, hash: u.hash, value: e?.value ?? null, status: e?.status || null, locked: !!e?.locked, stale: !!e && e.source_hash !== u.hash };
      }),
    };
  });
  return Response.json({ items });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const sb = supabaseService() || admin;
  const b = await request.json();
  b.lang = normLang(b.lang);
  if (b.lang === 'ko') return Response.json({ error: 'invalid lang' }, { status: 400 });
  const done = (data) => { revalidateTag(CMS_TAG); revalidatePath('/', 'layout'); return Response.json(data); };

  try {
    if (b.table === 'page') {
      if (b.action === 'redo') {
        const { data: row } = await sb.from('text_memory').select('source').eq('id', b.memoryId).single();
        const [value] = await translateBatch([{ text: row.source, html: false }], b.lang);
        await sb.from('text_memory').update({ value, status: 'auto', locked: false, updated_at: new Date().toISOString() }).eq('id', b.memoryId);
        return done({ value, status: 'auto', locked: false });
      }
      const patch = b.action === 'lock' ? { locked: !!b.locked } : { value: b.value, status: 'manual', locked: true };
      await sb.from('text_memory').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', b.memoryId);
      return done({ ok: true, ...patch });
    }

    const base = { source_table: b.table, source_id: String(b.id), field: b.field, lang: b.lang };
    if (b.action === 'redo') {
      const unit = { table: b.table, id: String(b.id), field: b.field, type: b.type, source: b.source, hash: b.hash || hashOf(b.source) };
      const { data: i18n } = await sb.from('site_settings').select('value').eq('key', 'i18n').maybeSingle();
      await translateUnits(sb, [unit], b.lang, String(i18n?.value?.glossary || ''));
      const { data } = await sb.from('translations').select('value,status,locked').match(base).single();
      return done({ ...data, stale: false });
    }
    if (b.action === 'lock') {
      await sb.from('translations').update({ locked: !!b.locked }).match(base);
      return done({ ok: true, locked: !!b.locked });
    }
    // save (직접 수정 → 자동 번역이 덮어쓰지 않도록 잠금)
    const { error } = await sb.from('translations').upsert(
      { ...base, value: b.value, source_hash: b.hash || hashOf(b.source), status: 'manual', locked: true, updated_at: new Date().toISOString() },
      { onConflict: 'source_table,source_id,field,lang' }
    );
    if (error) throw error;
    return done({ ok: true, status: 'manual', locked: true, stale: false });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
