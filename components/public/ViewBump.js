'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

export default function ViewBump({ table, id }) {
  useEffect(() => {
    const key = `htu_view_${table}_${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {}
    supabaseBrowser().rpc('bump_view', { p_table: table, p_id: id }).then(() => {});
  }, [table, id]);
  return null;
}
