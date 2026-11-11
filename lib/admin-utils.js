'use client';
import { supabaseBrowser } from './supabase/browser';

export const BUCKET = 'cms';

// 방금 GitHub 에 올린 파일: 사이트 반영(약 1분) 전에도 관리자에서 바로 보이도록 원본 주소를 기억
const PREVIEW_KEY = 'htu_media_preview';
function previewMap() {
  if (typeof window === 'undefined') return {};
  if (!window.__htuMediaPreview) {
    try { window.__htuMediaPreview = JSON.parse(sessionStorage.getItem(PREVIEW_KEY) || '{}'); } catch { window.__htuMediaPreview = {}; }
  }
  return window.__htuMediaPreview;
}
function rememberPreview(url, preview) {
  if (!preview) return;
  const m = previewMap();
  m[url] = preview;
  try { sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(m)); } catch { /* noop */ }
}

// ./img/x.jpg 같은 기존 상대경로를 관리자 미리보기에서도 보이게
export function previewUrl(url) {
  if (!url) return '';
  const u = String(url);
  const fresh = previewMap()[u];
  if (fresh) return fresh;
  if (/^\.?\/(?!\/)/.test(u)) {
    const base = (typeof window !== 'undefined' && window.__htuSiteBase) || '';
    return base ? base + '/' + u.replace(/^\.?\//, '') : u.replace(/^\.\//, '/');
  }
  return u;
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

// ───────── 업로드: GitHub 저장소로 (연동 설정에서 GitHub 를 연결한 경우) ─────────
let mediaCfgP = null;
function mediaConfig() {
  if (!mediaCfgP) {
    mediaCfgP = fetch('/api/media/config', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { github: false })).catch(() => ({ github: false }));
  }
  return mediaCfgP;
}

// 큰 사진은 올리기 전에 자동으로 줄임 (긴 변 2560px, 화질 유지) — 로고 · 투명 PNG · GIF · SVG 는 그대로
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const MAX = 2560;
    const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const type = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise((ok) => canvas.toBlob(ok, type, 0.86));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + (type === 'image/webp' ? '.webp' : '.jpg');
    return new File([blob], name, { type });
  } catch {
    return file;
  }
}

async function readError(res) {
  const d = await res.json().catch(() => ({}));
  return new Error(d.error || `업로드 실패 (${res.status})`);
}

export async function uploadFile(file, folder = 'uploads', maxMB = 15) {
  if (!file) throw new Error('파일이 없습니다.');
  const cfg = await mediaConfig();
  const limit = cfg.github ? Math.min(Math.max(maxMB, 30), cfg.maxMB || 50) : maxMB;

  if (cfg.github) {
    file = await shrinkImage(file);
    if (file.size > limit * 1024 * 1024) throw new Error(`${limit}MB 이하 파일만 올릴 수 있습니다. 큰 영상은 YouTube · Vimeo 링크를 사용하세요.`);
    // 작은 파일: 바로 GitHub 로
    if (file.size <= (cfg.directMB || 4) * 1024 * 1024) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (!res.ok) throw await readError(res);
      const d = await res.json();
      rememberPreview(d.url, d.preview);
      return d.url;
    }
    // 큰 파일: 임시 위치에 올림 → 서버가 GitHub 로 옮기고 임시 파일 삭제
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const tmp = `tmp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseBrowser().storage.from(BUCKET).upload(tmp, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    const res = await fetch('/api/media/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tmp, name: file.name, folder }) });
    if (!res.ok) throw await readError(res);
    const d = await res.json();
    rememberPreview(d.url, d.preview);
    return d.url;
  }

  // GitHub 연결 전: 예전 방식(Supabase Storage)
  if (file.size > maxMB * 1024 * 1024) throw new Error(`${maxMB}MB 이하 파일만 업로드할 수 있습니다.`);
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

let revalTimer = null;
let syncTimer = null;
// 저장 직후: 캐시 갱신 → 바뀐 한국어만 영어·중국어·일본어로 자동 번역
export function revalidateSite() {
  clearTimeout(revalTimer);
  revalTimer = setTimeout(() => {
    fetch('/api/revalidate', { method: 'POST' }).catch(() => {});
  }, 400);
  clearTimeout(syncTimer);
  syncTimer = setTimeout(runTranslationSync, 1500);
}

export async function runTranslationSync(onProgress) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('adm-i18n', { detail: { state: 'running' } }));
  let last = null;
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('/api/translate/sync', { method: 'POST' });
      last = await r.json();
    } catch (e) {
      last = { error: String(e) };
    }
    onProgress?.(last);
    if (last.error || !last.remaining || (last.errors && last.errors.length && !last.translated)) break;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('adm-i18n', { detail: { state: 'done', result: last } }));
  return last;
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
