'use client';
import { useEffect, useRef, useState } from 'react';
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
  if (!html || !html.includes('data-cms-src') || typeof document === 'undefined') return html || '';
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('[data-cms-src]').forEach((el) => {
    el.setAttribute('src', el.getAttribute('data-cms-src'));
    el.removeAttribute('data-cms-src');
  });
  return t.innerHTML;
}

const TOOLS = [
  { cmd: 'formatBlock', arg: 'H2', label: '제목', title: '큰 제목' },
  { cmd: 'formatBlock', arg: 'H3', label: '소제목', title: '소제목' },
  { cmd: 'formatBlock', arg: 'P', label: '본문', title: '본문 문단' },
  { sep: true },
  { cmd: 'bold', label: <b>B</b>, title: '굵게' },
  { cmd: 'italic', label: <i>I</i>, title: '기울임' },
  { cmd: 'underline', label: <u>U</u>, title: '밑줄' },
  { cmd: 'strikeThrough', label: <s>S</s>, title: '취소선' },
  { sep: true },
  { cmd: 'justifyLeft', label: '왼쪽', title: '왼쪽 정렬' },
  { cmd: 'justifyCenter', label: '가운데', title: '가운데 정렬' },
  { sep: true },
  { cmd: 'insertUnorderedList', label: '• 목록', title: '글머리 목록' },
  { cmd: 'insertOrderedList', label: '1. 목록', title: '번호 목록' },
  { cmd: 'formatBlock', arg: 'BLOCKQUOTE', label: '인용', title: '인용문' },
  { cmd: 'insertHorizontalRule', label: '구분선', title: '구분선' },
  { sep: true },
  { act: 'link', label: '링크', title: '링크 삽입' },
  { act: 'image', label: '이미지', title: '이미지 업로드' },
  { act: 'youtube', label: '유튜브', title: '유튜브 영상 삽입' },
  { sep: true },
  { cmd: 'removeFormat', label: '서식 지우기', title: '서식 지우기' },
];

export default function RichEditor({ value, onChange, folder = 'posts' }) {
  const ref = useRef(null);
  const fileRef = useRef(null);
  const savedRange = useRef(null);
  const [source, setSource] = useState(false);
  const [busy, setBusy] = useState(false);

  // 최초 1회 / 외부 값 변경(다른 항목 선택) 시에만 innerHTML 동기화 → 커서 튐 방지
  useEffect(() => {
    if (ref.current && !source && fromEditor(ref.current.innerHTML) !== (value || '')) {
      ref.current.innerHTML = toEditor(value || '');
    }
  }, [value, source]);

  const emit = () => ref.current && onChange(fromEditor(ref.current.innerHTML));

  const saveSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    ref.current?.focus();
    const r = savedRange.current;
    if (r) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    }
  };

  const exec = (cmd, arg) => {
    restoreSel();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const insertHtml = (html) => {
    restoreSel();
    document.execCommand('insertHTML', false, html);
    emit();
  };

  const onTool = async (t) => {
    if (t.cmd) return exec(t.cmd, t.arg);
    if (t.act === 'link') {
      const url = window.prompt('링크 주소(URL)를 입력하세요', 'https://');
      if (url && url !== 'https://') exec('createLink', url);
    }
    if (t.act === 'youtube') {
      const url = window.prompt('유튜브 영상 주소를 입력하세요');
      const id = youtubeId(url);
      if (url && !id) return toast('유튜브 주소를 인식하지 못했습니다.', 'err');
      if (id) {
        insertHtml(
          `<div class="yt-embed"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`
        );
      }
    }
    if (t.act === 'image') fileRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(file, folder);
      const view = previewUrl(url);
      insertHtml(view !== url ? `<img src="${view}" data-cms-src="${url}" alt=""><p><br></p>` : `<img src="${url}" alt=""><p><br></p>`);
    } catch (err) {
      toast(errMsg(err), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`adm-rich ${source ? 'is-source' : ''}`}>
      <div className="adm-rich-bar" onMouseDown={(e) => e.target.closest('button') && e.preventDefault()}>
        {!source &&
          TOOLS.map((t, i) =>
            t.sep ? (
              <span key={i} className="adm-rich-sep" />
            ) : (
              <button key={i} type="button" title={t.title} onClick={() => onTool(t)} disabled={busy}>
                {t.label}
              </button>
            )
          )}
        <button type="button" className="adm-rich-src" onClick={() => setSource((s) => !s)}>
          {source ? '편집기로' : 'HTML'}
        </button>
        {busy ? <span className="adm-rich-busy">업로드 중…</span> : null}
      </div>
      {source ? (
        <textarea className="adm-rich-code" value={value || ''} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      ) : (
        <div
          ref={ref}
          className="adm-rich-area"
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={() => {
            saveSel();
            emit();
          }}
          onKeyUp={saveSel}
          onMouseUp={saveSel}
          data-placeholder="내용을 입력하세요. 이미지·유튜브 영상도 넣을 수 있습니다."
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}
