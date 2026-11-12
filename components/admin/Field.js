'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LANG_LIST, enabledLangs } from '@/lib/i18n/langs';
import { previewUrl, uploadFile, youtubeId, toast, errMsg, toLocalInput, fromLocalInput } from '@/lib/admin-utils';

const RichEditor = dynamic(() => import('./RichEditor'), { ssr: false });
import { suggestSeo } from '@/lib/seo';

// 검색엔진(구글 · 네이버) 노출 설정 — 비워두면 저장 시 자동으로 채움
function SeoField({ form, setValues, kind, siteHint }) {
  const auto = () => suggestSeo({
    kind, title: form.title, summary: form.summary || form.excerpt, html: form.content_html, location: form.location,
    date: [form.start_date, form.end_date && form.end_date !== form.start_date ? form.end_date : ''].filter(Boolean).join(' ~ '),
  });
  const a = auto();
  const t = form.seo_title || '', d = form.seo_description || '', k = form.seo_keywords || '';
  const showT = t || a.title, showD = d || a.description;
  const len = (s) => [...String(s)].length;
  const cls = (n, ok, max) => (n === 0 ? '' : n > max ? 'err' : n >= ok ? 'ok' : 'warn');
  const site = (siteHint || 'htuglobal.com').replace(/^https?:\/\//, '');
  return (
    <div className="adm-seo">
      <div className="adm-seo-head">
        <p>제목 · 본문을 분석해 검색 문구를 만듭니다. <b>비워두면 저장할 때 자동으로 채워지고</b>, 사이트에 검색엔진용 페이지 · sitemap 이 함께 올라갑니다.</p>
        <button type="button" className="adm-btn sm primary" onClick={() => setValues({ seo_title: a.title, seo_description: a.description, seo_keywords: a.keywords })}>✨ 자동 생성</button>
      </div>
      <label className="adm-label">검색 결과 제목 <span className={`adm-count ${cls(len(t), 15, 60)}`}>{len(t)} / 60</span></label>
      <input className="adm-input" value={t} placeholder={a.title} onChange={(e) => setValues({ seo_title: e.target.value })} />
      <label className="adm-label">검색 결과 설명 <span className={`adm-count ${cls(len(d), 60, 160)}`}>{len(d)} / 160</span></label>
      <textarea className="adm-input" rows={3} value={d} placeholder={a.description} onChange={(e) => setValues({ seo_description: e.target.value })} />
      <label className="adm-label">키워드 <small className="adm-muted">쉼표로 구분 · 네이버 등에 전달</small></label>
      <input className="adm-input" value={k} placeholder={a.keywords} onChange={(e) => setValues({ seo_keywords: e.target.value })} />
      <div className="adm-seo-preview">
        <div className="g">
          <small>Google 미리보기</small>
          <span className="url">{site} › posts</span>
          <span className="t">{showT} | HTU GLOBAL</span>
          <span className="d">{showD}</span>
        </div>
        <div className="n">
          <small>NAVER 미리보기</small>
          <span className="t">{showT}</span>
          <span className="d">{showD}</span>
          <span className="url">{site}</span>
        </div>
      </div>
    </div>
  );
}

function ImageField({ value, onChange, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('이미지 파일만 업로드할 수 있습니다.', 'err');
    setBusy(true);
    try {
      onChange(await uploadFile(file, folder));
      toast('이미지를 업로드했습니다.');
    } catch (e) {
      toast(errMsg(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`adm-image ${drag ? 'is-drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        upload(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="adm-image-preview" onClick={() => ref.current?.click()}>
        {value ? <img src={previewUrl(value)} alt="" /> : <span>클릭 또는 드래그하여<br />이미지 업로드</span>}
        {busy ? <div className="adm-image-busy">업로드 중…</div> : null}
      </div>
      <div className="adm-image-side">
        <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="이미지 URL 직접 입력 가능" />
        <div className="adm-row-gap">
          <button type="button" className="adm-btn sm" onClick={() => ref.current?.click()} disabled={busy}>
            파일 선택
          </button>
          {value ? (
            <button type="button" className="adm-btn sm ghost" onClick={() => onChange('')}>
              비우기
            </button>
          ) : null}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function VideoField({ value, onChange, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (!/^video\//.test(file.type)) return toast('영상(mp4) 파일만 업로드할 수 있습니다.', 'err');
    setBusy(true);
    try {
      onChange(await uploadFile(file, folder || 'video', 50));
      toast('영상을 업로드했습니다.');
    } catch (e) {
      toast(errMsg(e), 'err');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="adm-image">
      <div className="adm-image-preview" onClick={() => ref.current?.click()}>
        {value ? <video src={previewUrl(value)} muted playsInline loop autoPlay /> : <span>클릭하여<br />mp4 업로드 (50MB 이하)</span>}
        {busy ? <div className="adm-image-busy">업로드 중…</div> : null}
      </div>
      <div className="adm-image-side">
        <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="./video/파일.mp4 또는 https://.../파일.mp4" />
        <div className="adm-row-gap">
          <button type="button" className="adm-btn sm" onClick={() => ref.current?.click()} disabled={busy}>파일 선택</button>
          {value ? <button type="button" className="adm-btn sm ghost" onClick={() => onChange('')}>비우기</button> : null}
        </div>
      </div>
      <input ref={ref} type="file" accept="video/mp4,video/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function FilesField({ value, onChange, folder }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const list = Array.isArray(value) ? value : [];
  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added = [];
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, folder || 'files', 30);
        added.push({ name: file.name, url });
      }
      onChange([...list, ...added]);
      toast(`${added.length}개 파일을 첨부했습니다.`);
    } catch (e) {
      toast(errMsg(e), 'err');
    } finally {
      setBusy(false);
    }
  };
  const rename = (i, name) => onChange(list.map((f, j) => (j === i ? { ...f, name } : f)));
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  return (
    <div className="adm-files-field">
      {list.map((f, i) => (
        <div key={f.url + i} className="adm-file-row">
          <span className="adm-file-ico">📎</span>
          <input className="adm-input sm" value={f.name || ''} onChange={(e) => rename(i, e.target.value)} />
          <a className="adm-icon" href={f.url} target="_blank" rel="noreferrer" title="열기">↗</a>
          <button type="button" className="adm-icon danger" onClick={() => remove(i)} title="삭제">✕</button>
        </div>
      ))}
      <button type="button" className="adm-btn sm" onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? '업로드 중…' : '+ 파일 첨부 (PDF·한글·워드·엑셀·이미지, 30MB 이하)'}
      </button>
      <input ref={ref} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

function YoutubeField({ value, onChange }) {
  const id = youtubeId(value);
  return (
    <div className="adm-yt">
      <input className="adm-input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://youtu.be/... 또는 watch?v=... / shorts 모두 가능" />
      {value ? (
        id ? (
          <img className="adm-yt-thumb" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" />
        ) : (
          <p className="adm-help err">유튜브 주소를 인식하지 못했습니다.</p>
        )
      ) : null}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <label className="adm-switch">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch-ui" />
      {label ? <span className="adm-switch-label">{label}</span> : null}
    </label>
  );
}
export { Switch };

export default function Field({ field, value, onChange, form, setValues }) {
  const f = field;
  let input;
  switch (f.type) {
    case 'textarea':
    case 'lite':
      input = (
        <textarea className="adm-input" rows={f.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
      );
      break;
    case 'number':
      input = (
        <input className="adm-input" type="number" value={value ?? ''} step={f.step} min={f.min}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={f.placeholder} />
      );
      break;
    case 'checkbox':
      input = <Switch checked={value} onChange={onChange} label={f.switchLabel} />;
      break;
    case 'select': {
      const opts = typeof f.options === 'function' ? f.options(form) : f.options || [];
      input = (
        <select className="adm-input" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' && f.nullable ? null : e.target.value)}>
          {f.nullable ? <option value="">{f.nullLabel || '— 선택 안 함 —'}</option> : null}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    }
    case 'langs': {
      const on = enabledLangs(form);
      input = (
        <div className="adm-langs">
          <span className="adm-lang is-base">한국어 <small>원문</small></span>
          {LANG_LIST.filter((l) => l.code !== 'ko').map((l) => {
            const active = on.includes(l.code);
            return (
              <button key={l.code} type="button" className={`adm-lang ${active ? 'is-on' : ''}`} onClick={() => onChange({ [l.code]: !active })} title={l.ko}>
                {l.name} <small>{l.ko}</small>
              </button>
            );
          })}
          <span className="adm-langs-count">{on.length + 1}개 언어 사용 중</span>
        </div>
      );
      break;
    }
    case 'radio': {
      const opts = f.options || [];
      input = (
        <div className="adm-seg">
          {opts.map((o) => (
            <button key={o.value} type="button" className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
      break;
    }
    case 'image':
      input = <ImageField value={value} onChange={onChange} folder={f.folder} />;
      break;
    case 'files':
      input = <FilesField value={value} onChange={onChange} folder={f.folder} />;
      break;
    case 'link': {
      const listId = `dl-${f.name}`;
      input = (
        <>
          <input className="adm-input" list={listId} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
          <datalist id={listId}>
            {(f.suggestions || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </datalist>
        </>
      );
      break;
    }
    case 'video':
      input = <VideoField value={value} onChange={onChange} folder={f.folder} />;
      break;
    case 'youtube':
      input = <YoutubeField value={value} onChange={onChange} />;
      break;
    case 'tags':
      input = (
        <textarea className="adm-input" rows={f.rows || 3} value={(value || []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n'))} placeholder="한 줄에 하나씩 입력" />
      );
      break;
    case 'date':
      input = <input className="adm-input" type="date" value={value ? String(value).slice(0, 10) : ''} onChange={(e) => onChange(e.target.value || null)} />;
      break;
    case 'datetime':
      input = <input className="adm-input" type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />;
      break;
    case 'richtext':
      input = <RichEditor value={value} onChange={onChange} folder={f.folder} />;
      break;
    case 'seo':
      input = <SeoField form={form || {}} setValues={setValues || (() => {})} kind={f.kind} siteHint={f.site} />;
      break;
    default:
      input = (
        <input className="adm-input" type={f.type === 'url' ? 'url' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder} />
      );
  }

  return (
    <div className={`adm-field ${f.half ? 'half' : ''} ${f.type === 'richtext' || f.type === 'seo' ? 'full' : ''}`}>
      {f.label ? <label className="adm-label">{f.label}{f.required ? <em>*</em> : null}</label> : null}
      {input}
      {f.type === 'lite' && !f.help ? <p className="adm-help">줄바꿈은 그대로 반영됩니다. &lt;b&gt;굵게&lt;/b&gt;, &lt;u&gt;밑줄&lt;/u&gt; 태그 사용 가능</p> : null}
      {f.help ? <p className="adm-help">{f.help}</p> : null}
    </div>
  );
}

// 저장 직전 값 정리
export function cleanValue(field, v) {
  if (field.type === 'files') return (Array.isArray(v) ? v : []).filter((x) => x && x.url).map((x) => ({ name: String(x.name || '파일').trim(), url: x.url }));
  if (field.type === 'tags') return (v || []).map((s) => String(s).trim()).filter(Boolean);
  if (field.type === 'number') return v === '' || v == null ? null : Number(v);
  if (field.type === 'checkbox') return !!v;
  if (typeof v === 'string' && field.type !== 'richtext' && field.type !== 'lite' && field.type !== 'textarea') return v.trim();
  return v ?? null;
}
