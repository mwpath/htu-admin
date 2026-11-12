'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadFile, youtubeId, toast, errMsg, previewUrl } from '@/lib/admin-utils';

// 사이트 기준 주소(./uploads/… · ./img/…)는 편집기 안에서 미리보기 주소로 보여주고, 저장할 때 원래 주소로 되돌림
const MEDIA_SEL = 'img[src], video[src], source[src]';
function toEditor(html) {
  if (!html || typeof document === 'undefined') return html || '';
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll(MEDIA_SEL).forEach((el) => {
    const src = el.getAttribute('src');
    const view = previewUrl(src);
    if (view && view !== src) { el.setAttribute('data-cms-src', src); el.setAttribute('src', view); }
  });
  return t.innerHTML;
}
function fromEditor(html) {
  if (!html || typeof document === 'undefined') return html || '';
  if (!html.includes('data-cms-src') && !html.includes('is-picked')) return html;
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('[data-cms-src]').forEach((el) => {
    el.setAttribute('src', el.getAttribute('data-cms-src'));
    el.removeAttribute('data-cms-src');
  });
  t.content.querySelectorAll('.is-picked').forEach((el) => { el.classList.remove('is-picked'); if (!el.className) el.removeAttribute('class'); });
  return t.innerHTML;
}

/* ───────── 선택 목록 ───────── */
const BLOCKS = [
  ['P', '본문'], ['H2', '제목 1'], ['H3', '제목 2'], ['H4', '제목 3'], ['BLOCKQUOTE', '인용문'], ['PRE', '코드'],
];
const SIZES = ['12px', '13px', '14px', '15px', '16px', '17px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '42px', '48px'];
const LINE_HEIGHTS = ['1', '1.2', '1.4', '1.5', '1.6', '1.8', '2', '2.2', '2.5', '3'];
const SPACINGS = [['-0.08em', '-0.08 (아주 좁게)'], ['-0.05em', '-0.05'], ['-0.03em', '-0.03'], ['-0.02em', '-0.02'], ['-0.01em', '-0.01'], ['0em', '0 (기본)'],
  ['0.02em', '+0.02'], ['0.05em', '+0.05'], ['0.08em', '+0.08'], ['0.12em', '+0.12'], ['0.2em', '+0.2 (아주 넓게)']];
const COLORS = ['#0b1220', '#334155', '#64748b', '#94a3b8', '#ffffff', '#0a6a62', '#033b1e', '#16a34a', '#2563eb', '#1e3a8a', '#7c3aed',
  '#db2777', '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#a16207', '#0891b2', '#0f766e', '#4b5563'];
const HIGHLIGHTS = ['transparent', '#fef08a', '#fde68a', '#fed7aa', '#fecaca', '#fbcfe8', '#e9d5ff', '#c7d2fe', '#bfdbfe', '#a5f3fc', '#bbf7d0', '#d9f99d', '#e5e7eb', '#f1f5f9'];

const EMOJI = {
  '자주 씀': ['😀', '😊', '😍', '🥰', '😎', '🤗', '👍', '👏', '🙏', '💪', '🎉', '🎊', '✨', '🔥', '💯', '❤️', '💚', '💙', '⭐', '🌟', '✅', '☑️', '❗', '❓', '📢', '📣', '📌', '📍', '🔔', '💡'],
  '표정': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '🤔', '🤫', '🤭', '😐', '😶', '😏', '😌', '😔', '😢', '😭', '😤', '😡', '😱', '😳', '🥺', '😴', '🤒', '😷', '🥳', '🤓', '🧐'],
  '손 · 사람': ['👋', '🤚', '✋', '👌', '✌️', '🤞', '🤟', '🤘', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '👊', '👏', '🙌', '🤝', '🙏', '💪', '✍️', '💅', '👀', '👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫', '👨‍💼', '👩‍💼', '🧑‍🤝‍🧑', '👪'],
  '건강 · 뷰티': ['💊', '💉', '🩺', '🩹', '🧬', '🔬', '🏥', '🧴', '🧼', '🪥', '💄', '💋', '💅', '🌿', '🍃', '🌱', '🌸', '🌺', '🌷', '🍀', '🧘', '🏃', '🚴', '🏋️', '🥗', '🥑', '🍎', '🍋', '🥕', '🍵', '💧', '☀️'],
  '사물 · 일정': ['📅', '📆', '🗓️', '⏰', '⏳', '📞', '☎️', '📱', '💻', '🖥️', '📧', '✉️', '📨', '📝', '📄', '📋', '📊', '📈', '📉', '📎', '🔗', '📁', '🗂️', '📚', '📖', '🎓', '🏆', '🥇', '🎁', '🎈', '🎀', '🛍️', '💳', '💰'],
  '장소 · 이동': ['🏢', '🏬', '🏫', '🏛️', '🏠', '🗺️', '📍', '🧭', '🚗', '🚕', '🚌', '🚇', '🚆', '✈️', '🚢', '🅿️', '🚻', '♿', '🌏', '🌍', '🇰🇷', '🇺🇸', '🇯🇵', '🇨🇳'],
  '기호': ['✔️', '✅', '❌', '⭕', '❗', '❕', '❓', '⚠️', '🚫', '⛔', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🔺', '🔻', '🔸', '🔹', '▶️', '⏩', '🔝', '🆕', '🆓', '🆗', '🔜', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '🔄', '➕', '➖', '✖️', '💲'],
};
const SYMBOLS = {
  '문장 부호': ['※', '·', '‧', '…', '‥', '〃', '「', '」', '『', '』', '【', '】', '〈', '〉', '《', '》', '〔', '〕', '“', '”', '‘', '’', '¡', '¿', '—', '–', '¶', '§', '†', '‡'],
  '도형': ['★', '☆', '○', '●', '◎', '◇', '◆', '□', '■', '△', '▲', '▽', '▼', '◁', '◀', '▷', '▶', '♤', '♠', '♡', '♥', '♧', '♣', '⊙', '◈', '▣', '◐', '◑', '▒', '▤', '▥', '▨', '▧', '▦', '▩'],
  '화살표': ['→', '←', '↑', '↓', '↔', '↕', '↗', '↙', '↖', '↘', '⇒', '⇔', '⇐', '⇑', '⇓', '➜', '➔', '➤', '⟶', '⟵', '↺', '↻'],
  '체크 · 표시': ['✓', '✔', '✕', '✖', '✗', '✘', '☑', '☒', '☐', '♨', '☎', '☏', '☜', '☞', '♪', '♬', '♩', '♭', '☀', '☁', '☂', '☃', '♂', '♀', '〒', '㉿', '㈜', '№', '℡', '™', '©', '®'],
  '수학 · 단위': ['±', '×', '÷', '≠', '≤', '≥', '≒', '≡', '∞', '∴', '∵', '√', '∑', '∏', '∫', '∂', '∇', '∈', '∋', '⊂', '⊃', '∪', '∩', '∧', '∨', '¬', '°', '℃', '℉', '‰', '′', '″', 'Å', '㎎', '㎏', '㎖', '㎗', 'ℓ', '㎜', '㎝', '㎞', '㎡', '㎥', '㎾'],
  '화폐': ['₩', '$', '€', '¥', '£', '¢', '₽', '₹', '฿', '₫'],
  '원 · 괄호 숫자': ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿',
    '⑴', '⑵', '⑶', '⑷', '⑸', '⑹', '⑺', '⑻', '⑼', '⑽', '㉠', '㉡', '㉢', '㉣', '㉤', '㉥', '㉦', '㉧', '㉨', '㉩', '㉪', '㉫', '㉬', '㉭', 'ⓐ', 'ⓑ', 'ⓒ', 'ⓓ', 'ⓔ'],
  '로마 숫자 · 위첨자': ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ', 'ⅰ', 'ⅱ', 'ⅲ', 'ⅳ', 'ⅴ', '¹', '²', '³', '⁴', '⁵', 'ⁿ', '₁', '₂', '₃', '½', '⅓', '⅔', '¼', '¾'],
};
const BOXES = [
  ['hb-box', '기본 안내 상자'], ['hb-box hb-box-green', '초록 강조 상자'], ['hb-box hb-box-gray', '회색 참고 상자'],
];

const BLOCK_SEL = 'p,h1,h2,h3,h4,li,blockquote,pre,div:not(.adm-rich-area):not(.yt-embed),td,th,figcaption';

/* ───────── 작은 부품 ───────── */
function Btn({ title, onClick, children, on, disabled, wide }) {
  return (
    <button type="button" title={title} aria-label={title} className={`${on ? 'is-on' : ''} ${wide ? 'wide' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
function Pop({ id, open, setOpen, label, title, children, wide, disabled }) {
  const isOpen = open === id;
  return (
    <span className={`adm-rich-pop ${isOpen ? 'open' : ''}`}>
      <button type="button" title={title} aria-label={title} aria-expanded={isOpen} disabled={disabled} className={wide ? 'wide' : ''}
        onClick={() => setOpen(isOpen ? null : id)}>{label}<i className="caret" /></button>
      {isOpen ? <div className="adm-rich-panel" onMouseDown={(e) => { if (!e.target.closest('input,select,textarea')) e.preventDefault(); }}>{children}</div> : null}
    </span>
  );
}
const Ico = {
  undo: <svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>,
  redo: <svg viewBox="0 0 24 24"><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>,
  left: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h10M4 14h16M4 18h10" /></svg>,
  center: <svg viewBox="0 0 24 24"><path d="M4 6h16M7 10h10M4 14h16M7 18h10" /></svg>,
  right: <svg viewBox="0 0 24 24"><path d="M4 6h16M10 10h10M4 14h16M10 18h10" /></svg>,
  justify: <svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  ul: <svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>,
  ol: <svg viewBox="0 0 24 24"><path d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 14.5c0-.8.7-1.5 1.5-1.5S7 13.7 7 14.5c0 1.2-3 2-3 3.5h3" /></svg>,
  indent: <svg viewBox="0 0 24 24"><path d="M4 6h16M10 10h10M10 14h10M4 18h16M4 9.5l3 2.5-3 2.5" /></svg>,
  outdent: <svg viewBox="0 0 24 24"><path d="M4 6h16M10 10h10M10 14h10M4 18h16M7 9.5 4 12l3 2.5" /></svg>,
  link: <svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>,
  unlink: <svg viewBox="0 0 24 24"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /><path d="M3 3l18 18" /></svg>,
  image: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>,
  video: <svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="m10 9 5 3-5 3z" /></svg>,
  table: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M3 9.5h18M3 15h18M9 4v16M15 4v16" /></svg>,
  hr: <svg viewBox="0 0 24 24"><path d="M3 12h18" /><path d="M7 7h10M7 17h10" opacity=".35" /></svg>,
  clear: <svg viewBox="0 0 24 24"><path d="M6 5h12M12 5l-3 14M15 13l6 6M21 13l-6 6" /></svg>,
  full: <svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>,
  quote: <svg viewBox="0 0 24 24"><path d="M5 17c0-3 1-6 4-8M14 17c0-3 1-6 4-8M5 17h4v-4H5zM14 17h4v-4h-4z" /></svg>,
  box: <svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="14" rx="3" /><path d="M7.5 10h9M7.5 14h6" /></svg>,
};

export default function RichEditor({ value, onChange, folder = 'posts' }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const fileRef = useRef(null);
  const savedRange = useRef(null);
  const [source, setSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [full, setFull] = useState(false);
  const [state, setState] = useState({});
  const [picked, setPicked] = useState(null); // 선택한 이미지
  const [count, setCount] = useState({ all: 0, chars: 0 });
  const [emojiTab, setEmojiTab] = useState('자주 씀');
  const [symTab, setSymTab] = useState('문장 부호');
  const [tbl, setTbl] = useState({ r: 0, c: 0 });
  const [link, setLink] = useState({ url: '', text: '', blank: true });
  const [color, setColor] = useState('#0a6a62');

  // 최초 1회 / 외부 값 변경(다른 항목 선택) 시에만 innerHTML 동기화 → 커서 튐 방지
  useEffect(() => {
    if (ref.current && !source && fromEditor(ref.current.innerHTML) !== (value || '')) {
      ref.current.innerHTML = toEditor(value || '');
      countNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, source]);

  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* noop */ }
  }, []);

  // 바깥 클릭 → 팝업 닫기
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!e.target.closest('.adm-rich-pop')) setOpen(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (!full) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [full]);

  function countNow() {
    const t = (ref.current?.innerText || '').replace(/​/g, '').replace(/\n$/, '');
    setCount({ all: t.length, chars: t.replace(/\s/g, '').length });
  }
  const emit = () => { if (!ref.current) return; onChange(fromEditor(ref.current.innerHTML)); countNow(); };

  /* ───── 선택 영역 ───── */
  const inEditor = (node) => node && ref.current && ref.current.contains(node.nodeType === 1 ? node : node.parentNode);
  const saveSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && inEditor(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    ref.current?.focus({ preventScroll: true });
    const r = savedRange.current;
    if (r) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };
  const readState = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inEditor(sel.anchorNode)) return;
    const q = (c) => { try { return document.queryCommandState(c); } catch { return false; } };
    let el = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
    const block = el.closest(BLOCK_SEL);
    const cs = el ? getComputedStyle(el) : null;
    setState({
      bold: q('bold'), italic: q('italic'), underline: q('underline'), strike: q('strikeThrough'), sup: q('superscript'), sub: q('subscript'),
      ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      align: block ? getComputedStyle(block).textAlign : 'left',
      block: (block && block.tagName) || 'P',
      size: cs ? cs.fontSize : '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const on = () => { saveSel(); readState(); };
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readState]);

  const exec = (cmd, arg) => {
    restoreSel();
    try { document.execCommand('styleWithCSS', false, cmd === 'foreColor' || cmd === 'hiliteColor'); } catch { /* noop */ }
    document.execCommand(cmd, false, arg);
    emit(); readState();
  };
  const insertHtml = (html) => {
    restoreSel();
    document.execCommand('insertHTML', false, html);
    emit();
  };

  // 선택한 글자에 인라인 스타일 (글자 크기 · 자간). 선택이 없으면 현재 문단 전체에 적용
  const inlineStyle = (prop, val) => {
    restoreSel();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    if (sel.isCollapsed) return blockStyle(prop, val);
    try { document.execCommand('styleWithCSS', false, false); } catch { /* noop */ }
    document.execCommand('fontSize', false, '7');
    ref.current.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement('span');
      span.style[prop] = val;
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
      // 안쪽에 같은 속성이 겹쳐 있으면 정리
      span.querySelectorAll('span').forEach((s) => { if (s.style[prop]) { s.style[prop] = ''; if (!s.getAttribute('style')) s.replaceWith(...s.childNodes); } });
    });
    emit();
  };
  // 문단 단위 스타일 (행간 · 자간 · 정렬 등)
  const selectedBlocks = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return [];
    const range = sel.getRangeAt(0);
    const all = [...ref.current.querySelectorAll(BLOCK_SEL)].filter((b) => range.intersectsNode(b) && !b.querySelector(BLOCK_SEL.replace(/,td,th/, '')));
    if (all.length) return all;
    const node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
    const b = node.closest(BLOCK_SEL);
    return b && ref.current.contains(b) ? [b] : [];
  };
  const blockStyle = (prop, val) => {
    restoreSel();
    let blocks = selectedBlocks();
    if (!blocks.length) { document.execCommand('formatBlock', false, 'P'); blocks = selectedBlocks(); }
    blocks.forEach((b) => { b.style[prop] = val; if (!b.getAttribute('style')) b.removeAttribute('style'); });
    emit();
  };
  const indent = (dir) => {
    restoreSel();
    const blocks = selectedBlocks();
    if (blocks.some((b) => b.tagName === 'LI')) { document.execCommand(dir > 0 ? 'indent' : 'outdent'); return emit(); }
    blocks.forEach((b) => {
      const cur = parseFloat(b.style.marginLeft) || 0;
      const next = Math.max(0, cur + dir * 2);
      b.style.marginLeft = next ? `${next}em` : '';
      if (!b.getAttribute('style')) b.removeAttribute('style');
    });
    emit();
  };

  /* ───── 삽입 ───── */
  const insertTable = (r, c) => {
    const head = `<tr>${Array.from({ length: c }, (_, i) => `<th>제목 ${i + 1}</th>`).join('')}</tr>`;
    const body = Array.from({ length: r - 1 }, () => `<tr>${Array.from({ length: c }, () => '<td><br></td>').join('')}</tr>`).join('');
    insertHtml(`<table style="width:100%;border-collapse:collapse"><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`);
    setOpen(null);
  };
  const tableCell = () => {
    const sel = window.getSelection();
    const n = sel?.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode);
    return n && inEditor(n) ? n.closest('td,th') : null;
  };
  const tableOp = (op) => {
    restoreSel();
    const cell = tableCell();
    if (!cell) return toast('표 안의 칸을 먼저 클릭하세요.', 'err');
    const row = cell.parentNode, table = cell.closest('table'), idx = [...row.children].indexOf(cell);
    if (op === 'row+') { const nr = row.cloneNode(true); nr.querySelectorAll('td,th').forEach((c) => { const td = document.createElement(row.parentNode.tagName === 'THEAD' ? 'th' : 'td'); td.innerHTML = '<br>'; c.replaceWith(td); }); row.after(nr); }
    if (op === 'col+') table.querySelectorAll('tr').forEach((tr) => { const ref0 = tr.children[idx]; const c = document.createElement(ref0?.tagName === 'TH' ? 'th' : 'td'); c.innerHTML = '<br>'; ref0 ? ref0.after(c) : tr.appendChild(c); });
    if (op === 'row-') { if (table.querySelectorAll('tr').length > 1) row.remove(); else table.remove(); }
    if (op === 'col-') { if (row.children.length > 1) table.querySelectorAll('tr').forEach((tr) => tr.children[idx]?.remove()); else table.remove(); }
    if (op === 'del') table.remove();
    emit();
  };
  const applyLink = () => {
    const url = link.url.trim();
    if (!url) return;
    const href = /^(https?:|mailto:|tel:|\.\/|\/|#)/i.test(url) ? url : /@/.test(url) && !/\//.test(url) ? `mailto:${url}` : `https://${url}`;
    restoreSel();
    const sel = window.getSelection();
    if (sel.isCollapsed) {
      const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      document.execCommand('insertHTML', false, `<a href="${esc(href)}"${link.blank ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(link.text.trim() || url)}</a>&nbsp;`);
    } else {
      document.execCommand('createLink', false, href);
      const a = (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode).closest('a');
      if (a) { if (link.blank) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); } }
    }
    setLink({ url: '', text: '', blank: true });
    setOpen(null);
    emit();
  };
  const addYoutube = () => {
    const url = window.prompt('유튜브 영상 주소를 붙여넣으세요');
    if (!url) return;
    const id = youtubeId(url);
    if (!id) return toast('유튜브 주소를 인식하지 못했습니다.', 'err');
    insertHtml(`<div class="yt-embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`);
  };
  const insertBox = (cls) => {
    restoreSel();
    const sel = window.getSelection();
    const text = sel && !sel.isCollapsed ? sel.toString() : '안내 내용을 입력하세요.';
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>');
    document.execCommand('insertHTML', false, `<div class="${cls}"><p>${esc(text)}</p></div><p><br></p>`);
    setOpen(null); emit();
  };

  const onFile = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const url = await uploadFile(file, folder);
        const view = previewUrl(url);
        insertHtml(view !== url ? `<img src="${view}" data-cms-src="${url}" alt=""><p><br></p>` : `<img src="${url}" alt=""><p><br></p>`);
      }
    } catch (err) {
      toast(errMsg(err), 'err');
    } finally {
      setBusy(false);
    }
  };

  /* ───── 이미지 선택 · 조절 ───── */
  const pickImage = (img) => {
    ref.current.querySelectorAll('img.is-picked').forEach((i) => i !== img && i.classList.remove('is-picked'));
    if (img) img.classList.add('is-picked');
    setPicked(img || null);
  };
  const imgOp = (op, v) => {
    const img = picked;
    if (!img) return;
    if (op === 'width') img.style.width = v;
    if (op === 'align') {
      img.classList.remove('is-left', 'is-right', 'is-center');
      img.style.float = ''; img.style.margin = '';
      if (v === 'left') { img.classList.add('is-left'); img.style.float = 'left'; img.style.margin = '4px 18px 10px 0'; }
      if (v === 'right') { img.classList.add('is-right'); img.style.float = 'right'; img.style.margin = '4px 0 10px 18px'; }
      if (v === 'center') { img.classList.add('is-center'); img.style.margin = '0 auto'; img.style.display = 'block'; } else img.style.display = '';
    }
    if (op === 'alt') { const a = window.prompt('이미지 설명 (검색엔진 · 시각장애인 화면낭독용)', img.alt || ''); if (a !== null) img.alt = a.trim(); }
    if (op === 'link') {
      const u = window.prompt('이미지를 누르면 이동할 주소', img.parentNode.tagName === 'A' ? img.parentNode.getAttribute('href') : 'https://');
      if (u === null) return;
      if (img.parentNode.tagName === 'A') { if (u.trim()) img.parentNode.setAttribute('href', u.trim()); else img.parentNode.replaceWith(img); }
      else if (u.trim() && u.trim() !== 'https://') { const a = document.createElement('a'); a.href = u.trim(); a.target = '_blank'; a.rel = 'noopener noreferrer'; img.replaceWith(a); a.appendChild(img); }
    }
    if (op === 'del') { (img.parentNode.tagName === 'A' ? img.parentNode : img).remove(); setPicked(null); }
    if (!img.getAttribute('style')) img.removeAttribute('style');
    emit();
  };

  // 붙여넣기: 워드 · 한글 · 웹페이지의 지저분한 서식 정리 (굵게 · 목록 · 표 · 링크 · 정렬은 유지)
  const onPaste = (e) => {
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain');
    if (e.clipboardData?.files?.length && !html) {
      const imgs = [...e.clipboardData.files].filter((f) => f.type.startsWith('image/'));
      if (imgs.length) { e.preventDefault(); onFile({ target: { files: imgs, value: '' } }); return; }
    }
    if (!html) return;
    e.preventDefault();
    const t = document.createElement('template');
    t.innerHTML = html.replace(/<!--[\s\S]*?-->/g, '');
    t.content.querySelectorAll('meta,style,script,link,title,xml,o\\:p').forEach((n) => n.remove());
    t.content.querySelectorAll('*').forEach((n) => {
      const keep = {};
      const st = n.style;
      if (st) {
        if (st.textAlign && /^(center|right|justify)$/.test(st.textAlign)) keep['text-align'] = st.textAlign;
        if (st.fontWeight && /^(bold|[6-9]00)$/.test(st.fontWeight)) keep['font-weight'] = 'bold';
      }
      [...n.attributes].forEach((a) => { if (!['href', 'src', 'alt', 'colspan', 'rowspan'].includes(a.name)) n.removeAttribute(a.name); });
      const s = Object.entries(keep).map(([k, v]) => `${k}:${v}`).join(';');
      if (s) n.setAttribute('style', s);
      if (n.tagName === 'SPAN' && !s) n.replaceWith(...n.childNodes);
    });
    const clean = t.innerHTML.trim();
    document.execCommand('insertHTML', false, clean || (text || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>'));
    emit();
  };

  const onKeyDown = (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); saveSel(); setOpen('link'); }
    if (e.key === 'Tab' && tableCell()) {
      e.preventDefault();
      const cells = [...tableCell().closest('table').querySelectorAll('td,th')];
      const i = cells.indexOf(tableCell());
      const next = cells[i + (e.shiftKey ? -1 : 1)];
      if (next) { const r = document.createRange(); r.selectNodeContents(next); r.collapse(false); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    } else if (e.key === 'Tab') { e.preventDefault(); indent(e.shiftKey ? -1 : 1); }
  };

  const dis = busy || source;
  return (
    <div ref={wrapRef} className={`adm-rich ${source ? 'is-source' : ''} ${full ? 'is-full' : ''}`}>
      <div className="adm-rich-bar" onMouseDown={(e) => { if (e.target.closest('button') && !e.target.closest('.adm-rich-panel input')) { saveSel(); e.preventDefault(); } }}>
        <div className="adm-rich-group">
          <Btn title="실행 취소 (Ctrl+Z)" onClick={() => exec('undo')} disabled={dis}>{Ico.undo}</Btn>
          <Btn title="다시 실행 (Ctrl+Y)" onClick={() => exec('redo')} disabled={dis}>{Ico.redo}</Btn>
        </div>
        <div className="adm-rich-group">
          <select className="adm-rich-select" title="문단 형식" value={BLOCKS.some(([v]) => v === state.block) ? state.block : 'P'} disabled={dis}
            onMouseDown={saveSel} onChange={(e) => exec('formatBlock', e.target.value)}>
            {BLOCKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="adm-rich-select sm" title="글자 크기" value="" disabled={dis} onMouseDown={saveSel} onChange={(e) => e.target.value && inlineStyle('fontSize', e.target.value)}>
            <option value="">{state.size ? `크기 ${Math.round(parseFloat(state.size))}` : '크기'}</option>
            {SIZES.map((s) => <option key={s} value={s}>{parseInt(s, 10)}px</option>)}
          </select>
        </div>
        <div className="adm-rich-group">
          <Btn title="굵게 (Ctrl+B)" on={state.bold} onClick={() => exec('bold')} disabled={dis}><b>B</b></Btn>
          <Btn title="기울임 (Ctrl+I)" on={state.italic} onClick={() => exec('italic')} disabled={dis}><i style={{ fontFamily: 'Georgia,serif' }}>I</i></Btn>
          <Btn title="밑줄 (Ctrl+U)" on={state.underline} onClick={() => exec('underline')} disabled={dis}><u>U</u></Btn>
          <Btn title="취소선" on={state.strike} onClick={() => exec('strikeThrough')} disabled={dis}><s>S</s></Btn>
          <Btn title="위 첨자" on={state.sup} onClick={() => exec('superscript')} disabled={dis}>X<sup>2</sup></Btn>
          <Btn title="아래 첨자" on={state.sub} onClick={() => exec('subscript')} disabled={dis}>X<sub>2</sub></Btn>
        </div>
        <div className="adm-rich-group">
          <Pop id="color" open={open} setOpen={setOpen} title="글자 색" disabled={dis} label={<span className="adm-rich-a">A<i style={{ background: color }} /></span>}>
            <div className="adm-rich-swatches">
              {COLORS.map((c) => <button key={c} type="button" style={{ background: c }} title={c} onClick={() => { setColor(c); exec('foreColor', c); setOpen(null); }} />)}
            </div>
            <label className="adm-rich-custom">직접 선택 <input type="color" defaultValue="#0a6a62" onChange={(e) => { setColor(e.target.value); exec('foreColor', e.target.value); }} /></label>
          </Pop>
          <Pop id="hl" open={open} setOpen={setOpen} title="형광펜 (배경색)" disabled={dis} label={<span className="adm-rich-hl">가</span>}>
            <div className="adm-rich-swatches">
              {HIGHLIGHTS.map((c) => <button key={c} type="button" className={c === 'transparent' ? 'none' : ''} style={{ background: c }} title={c === 'transparent' ? '없음' : c}
                onClick={() => { exec('hiliteColor', c); setOpen(null); }} />)}
            </div>
            <label className="adm-rich-custom">직접 선택 <input type="color" defaultValue="#fef08a" onChange={(e) => exec('hiliteColor', e.target.value)} /></label>
          </Pop>
        </div>
        <div className="adm-rich-group">
          <Btn title="왼쪽 정렬" on={state.align === 'left' || state.align === 'start'} onClick={() => blockStyle('textAlign', '')} disabled={dis}>{Ico.left}</Btn>
          <Btn title="가운데 정렬" on={state.align === 'center'} onClick={() => blockStyle('textAlign', 'center')} disabled={dis}>{Ico.center}</Btn>
          <Btn title="오른쪽 정렬" on={state.align === 'right'} onClick={() => blockStyle('textAlign', 'right')} disabled={dis}>{Ico.right}</Btn>
          <Btn title="양쪽 정렬" on={state.align === 'justify'} onClick={() => blockStyle('textAlign', 'justify')} disabled={dis}>{Ico.justify}</Btn>
        </div>
        <div className="adm-rich-group">
          <Pop id="lh" open={open} setOpen={setOpen} title="행간 (줄 간격)" disabled={dis} wide label={<span className="adm-rich-txt">행간</span>}>
            <div className="adm-rich-list">
              <small>선택한 문단에 적용 (선택이 없으면 커서가 있는 문단)</small>
              {LINE_HEIGHTS.map((v) => <button key={v} type="button" onClick={() => { blockStyle('lineHeight', v); setOpen(null); }}>{v}{v === '1.8' ? ' (사이트 기본에 가까움)' : ''}</button>)}
              <button type="button" className="muted" onClick={() => { blockStyle('lineHeight', ''); setOpen(null); }}>기본값으로</button>
            </div>
          </Pop>
          <Pop id="ls" open={open} setOpen={setOpen} title="자간 (글자 간격)" disabled={dis} wide label={<span className="adm-rich-txt">자간</span>}>
            <div className="adm-rich-list">
              <small>글자를 선택하면 그 글자만, 선택이 없으면 문단 전체에 적용</small>
              {SPACINGS.map(([v, l]) => <button key={v} type="button" onClick={() => { inlineStyle('letterSpacing', v === '0em' ? 'normal' : v); setOpen(null); }}><span style={{ letterSpacing: v }}>가나다 ABC</span><em>{l}</em></button>)}
            </div>
          </Pop>
          <Btn title="들여쓰기 (Tab)" onClick={() => indent(1)} disabled={dis}>{Ico.indent}</Btn>
          <Btn title="내어쓰기 (Shift+Tab)" onClick={() => indent(-1)} disabled={dis}>{Ico.outdent}</Btn>
        </div>
        <div className="adm-rich-group">
          <Btn title="글머리 목록" on={state.ul} onClick={() => exec('insertUnorderedList')} disabled={dis}>{Ico.ul}</Btn>
          <Btn title="번호 목록" on={state.ol} onClick={() => exec('insertOrderedList')} disabled={dis}>{Ico.ol}</Btn>
          <Btn title="인용문" onClick={() => exec('formatBlock', 'BLOCKQUOTE')} disabled={dis}>{Ico.quote}</Btn>
          <Pop id="box" open={open} setOpen={setOpen} title="안내 상자" disabled={dis} label={Ico.box}>
            <div className="adm-rich-list">
              <small>선택한 글을 상자로 감쌉니다</small>
              {BOXES.map(([c, l]) => <button key={c} type="button" onClick={() => insertBox(c)}><span className={`adm-rich-boxprev ${c}`}>{l}</span></button>)}
            </div>
          </Pop>
          <Btn title="구분선" onClick={() => exec('insertHorizontalRule')} disabled={dis}>{Ico.hr}</Btn>
        </div>
        <div className="adm-rich-group">
          <Pop id="link" open={open} setOpen={setOpen} title="링크 (Ctrl+K)" disabled={dis} label={Ico.link}>
            <div className="adm-rich-form">
              <label>주소<input autoFocus value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="https://  ·  이메일  ·  tel:010…" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyLink())} /></label>
              <label>표시할 글자 <small>(글자를 선택했다면 비워두세요)</small><input value={link.text} onChange={(e) => setLink({ ...link, text: e.target.value })} /></label>
              <label className="row"><input type="checkbox" checked={link.blank} onChange={(e) => setLink({ ...link, blank: e.target.checked })} /> 새 창에서 열기</label>
              <button type="button" className="adm-btn sm primary" onClick={applyLink}>링크 넣기</button>
            </div>
          </Pop>
          <Btn title="링크 해제" onClick={() => exec('unlink')} disabled={dis}>{Ico.unlink}</Btn>
          <Btn title="이미지 업로드 (여러 장 가능 · 붙여넣기도 됨)" onClick={() => fileRef.current?.click()} disabled={dis}>{Ico.image}</Btn>
          <Btn title="유튜브 영상" onClick={addYoutube} disabled={dis}>{Ico.video}</Btn>
          <Pop id="table" open={open} setOpen={setOpen} title="표" disabled={dis} label={Ico.table}>
            <div className="adm-rich-grid" onMouseLeave={() => setTbl({ r: 0, c: 0 })}>
              {Array.from({ length: 8 * 8 }, (_, i) => {
                const r = Math.floor(i / 8) + 1, c = (i % 8) + 1;
                return <button key={i} type="button" className={r <= tbl.r && c <= tbl.c ? 'on' : ''} onMouseEnter={() => setTbl({ r, c })} onClick={() => insertTable(Math.max(2, r), c)} />;
              })}
            </div>
            <small className="adm-rich-gridlabel">{tbl.r ? `${Math.max(2, tbl.r)}줄 × ${tbl.c}칸 (첫 줄은 제목)` : '크기를 고르세요'}</small>
            <div className="adm-rich-tableops">
              <button type="button" onClick={() => tableOp('row+')}>＋ 줄</button>
              <button type="button" onClick={() => tableOp('col+')}>＋ 칸</button>
              <button type="button" onClick={() => tableOp('row-')}>－ 줄</button>
              <button type="button" onClick={() => tableOp('col-')}>－ 칸</button>
              <button type="button" className="danger" onClick={() => tableOp('del')}>표 삭제</button>
            </div>
          </Pop>
        </div>
        <div className="adm-rich-group">
          <Pop id="emoji" open={open} setOpen={setOpen} title="이모티콘" disabled={dis} label={<span className="adm-rich-emo">😊</span>}>
            <div className="adm-rich-tabs">{Object.keys(EMOJI).map((k) => <button key={k} type="button" className={k === emojiTab ? 'on' : ''} onClick={() => setEmojiTab(k)}>{k}</button>)}</div>
            <div className="adm-rich-chars emoji">{EMOJI[emojiTab].map((ch, i) => <button key={ch + i} type="button" onClick={() => insertHtml(ch)}>{ch}</button>)}</div>
          </Pop>
          <Pop id="sym" open={open} setOpen={setOpen} title="특수 기호" disabled={dis} label={<span className="adm-rich-txt">※ 기호</span>} wide>
            <div className="adm-rich-tabs">{Object.keys(SYMBOLS).map((k) => <button key={k} type="button" className={k === symTab ? 'on' : ''} onClick={() => setSymTab(k)}>{k}</button>)}</div>
            <div className="adm-rich-chars">{SYMBOLS[symTab].map((ch, i) => <button key={ch + i} type="button" onClick={() => insertHtml(ch)}>{ch}</button>)}</div>
          </Pop>
        </div>
        <div className="adm-rich-group end">
          <Btn title="서식 지우기" onClick={() => { exec('removeFormat'); blockStyle('lineHeight', ''); }} disabled={dis}>{Ico.clear}</Btn>
          <Btn title={full ? '전체 화면 닫기 (Esc)' : '전체 화면으로 쓰기'} on={full} onClick={() => setFull((f) => !f)}>{Ico.full}</Btn>
          <button type="button" className="adm-rich-src wide" onClick={() => { setSource((s) => !s); setOpen(null); pickImage(null); }}>{source ? '편집기로' : 'HTML'}</button>
        </div>
      </div>

      {picked && !source ? (
        <div className="adm-rich-imgbar" onMouseDown={(e) => e.preventDefault()}>
          <b>이미지</b>
          {['25%', '50%', '75%', '100%'].map((w) => <button key={w} type="button" className={picked.style.width === w ? 'on' : ''} onClick={() => imgOp('width', w)}>{w}</button>)}
          <button type="button" onClick={() => imgOp('width', '')}>원본</button>
          <span className="sep" />
          <button type="button" onClick={() => imgOp('align', 'left')}>왼쪽 (글 감싸기)</button>
          <button type="button" onClick={() => imgOp('align', 'center')}>가운데</button>
          <button type="button" onClick={() => imgOp('align', 'right')}>오른쪽 (글 감싸기)</button>
          <button type="button" onClick={() => imgOp('align', 'none')}>정렬 해제</button>
          <span className="sep" />
          <button type="button" onClick={() => imgOp('alt')}>설명(alt){picked.alt ? ' ✓' : ''}</button>
          <button type="button" onClick={() => imgOp('link')}>링크</button>
          <button type="button" className="danger" onClick={() => imgOp('del')}>삭제</button>
          <button type="button" onClick={() => pickImage(null)}>닫기</button>
        </div>
      ) : null}

      {source ? (
        <textarea className="adm-rich-code" value={value || ''} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      ) : (
        <div
          ref={ref}
          className="adm-rich-area hb-content"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={() => { saveSel(); emit(); }}
          onKeyUp={saveSel}
          onMouseUp={saveSel}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onClick={(e) => pickImage(e.target.tagName === 'IMG' ? e.target : null)}
          data-placeholder="내용을 입력하세요. 이미지는 끌어다 놓거나 붙여넣어도 됩니다."
          onDragOver={(e) => e.dataTransfer?.types?.includes('Files') && e.preventDefault()}
          onDrop={(e) => {
            const imgs = [...(e.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
            if (!imgs.length) return;
            e.preventDefault();
            const r = document.caretRangeFromPoint?.(e.clientX, e.clientY);
            if (r) { savedRange.current = r; }
            onFile({ target: { files: imgs, value: '' } });
          }}
        />
      )}
      <div className="adm-rich-foot">
        <span>글자 수 <b>{count.all.toLocaleString()}</b> (공백 제외 {count.chars.toLocaleString()})</span>
        <span className="adm-muted">Ctrl+B 굵게 · Ctrl+K 링크 · Tab 들여쓰기 · 이미지 클릭 → 크기·정렬</span>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFile} />
    </div>
  );
}
