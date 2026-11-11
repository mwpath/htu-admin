'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from './supabase/browser';

// 관리자 미리보기용: 기존 사이트 주소 (설정 > 기존 사이트 주소)
let cache = null;
export function useSiteBase() {
  const [base, setBase] = useState(cache);
  useEffect(() => {
    if (cache !== null) { if (typeof window !== 'undefined') window.__htuSiteBase = cache; return; }
    supabaseBrowser()
      .from('site_settings')
      .select('value')
      .eq('key', 'site')
      .maybeSingle()
      .then(({ data }) => {
        cache = String(data?.value?.site_url || '').trim().replace(/\/+$/, '');
        if (typeof window !== 'undefined') window.__htuSiteBase = cache;
        setBase(cache);
      });
  }, []);
  return base || '';
}
