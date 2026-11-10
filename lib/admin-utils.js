'use client';
import { supabaseBrowser } from './supabase/browser';

export const BUCKET = 'cms';

// ./img/x.jpg 같은 기존 상대경로를 관리자 미리보기에서도 보이게
export function previewUrl(url) {
  if (!url) return '';
  return String(url).replace(/^\.\//, '/');
}

export function youtubeId(url) {
  const s = String(url || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m =
    s.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    s.match(/\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : '';
}

export async function uploadFile(file, folder = 'uploads') {
  if (!file) throw new Error('파일이 없습니다.');
  if (file.size > 15 * 1024 * 1024) throw new Error('15MB 이하 파일만 업로드할 수 있습니다.');
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

let revalTimer = null;
export function revalidateSite() {
  clearTimeout(revalTimer);
  revalTimer = setTimeout(() => {
    fetch('/api/revalidate', { method: 'POST' }).catch(() => {});
  }, 400);
}

export function toast(message, type = 'ok') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('adm-toast', { detail: { message, type } }));
}

export function errMsg(e) {
  const m = e?.message || String(e);
  if (/row-level security|permission denied/i.test(m)) return '권한이 없습니다. 관리자 계정(admin_users)에 등록되어 있는지 확인하세요.';
  if (/Bucket not found/i.test(m)) return 'Storage 버킷(cms)이 없습니다. schema.sql 을 다시 실행하세요.';
  return m;
}

// <input type="datetime-local"> ↔ ISO
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
}
